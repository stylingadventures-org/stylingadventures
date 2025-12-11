import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

export interface BestiesClosetStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
  uploadsBucket: s3.IBucket;
}

export class BestiesClosetStack extends cdk.Stack {
  public readonly closetUploadStateMachine: sfn.StateMachine;
  public readonly backgroundChangeStateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: BestiesClosetStackProps) {
    super(scope, id, props);

    const { table, uploadsBucket } = props;

    // =====================================================
    // 0) Container-based image segmentation Lambda (Docker)
    // =====================================================

    const imageSegmentationFn = new lambda.DockerImageFunction(
      this,
      "ImageSegmentationFn",
      {
        code: lambda.DockerImageCode.fromImageAsset(
          path.join(process.cwd(), "image-segmentation-lambda"),
        ),
        // Max allowed for your account/region
        memorySize: 3008,
        timeout: cdk.Duration.seconds(60),
        ephemeralStorageSize: cdk.Size.mebibytes(4096),
        environment: {
          UPLOADS_BUCKET_NAME: uploadsBucket.bucketName,
          PROCESSED_PREFIX: "closet/processed",
        },
      },
    );

    // Least-privilege S3 access: read closet/*, write closet/processed/*
    uploadsBucket.grantRead(imageSegmentationFn);
    uploadsBucket.grantWrite(imageSegmentationFn);

    imageSegmentationFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [uploadsBucket.arnForObjects("closet/*")],
      }),
    );

    imageSegmentationFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        resources: [uploadsBucket.arnForObjects("closet/processed/*")],
      }),
    );

    // Reusable environment for background-change Lambdas
    const ENV = {
      TABLE_NAME: table.tableName,
      UPLOADS_BUCKET: uploadsBucket.bucketName,
      NODE_OPTIONS: "--enable-source-maps",
    };

    // =====================================================
    // 1) CLOSET UPLOAD APPROVAL
    // =====================================================

    const moderationFn = new lambdaNode.NodejsFunction(this, "ModerationFn", {
      entry: "lambda/closet/moderation.ts",
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: uploadsBucket.bucketName,
      },
    });

    const piiCheckFn = new lambdaNode.NodejsFunction(this, "PiiCheckFn", {
      entry: "lambda/closet/pii-check.ts",
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const publishClosetItemFn = new lambdaNode.NodejsFunction(
      this,
      "PublishClosetItemFn",
      {
        entry: "lambda/closet/publish.ts",
        environment: {
          TABLE_NAME: table.tableName,
          BUCKET_NAME: uploadsBucket.bucketName,
          PUBLISHED_PREFIX: "published",
        },
      },
    );

    const notifyAdminFn = new lambdaNode.NodejsFunction(this, "NotifyAdminFn", {
      entry: "lambda/closet/notify-admin.ts",
    });

    // IAM – least privilege for DDB/S3
    table.grantReadWriteData(moderationFn);
    table.grantReadWriteData(piiCheckFn);
    table.grantReadWriteData(publishClosetItemFn);

    uploadsBucket.grantReadWrite(moderationFn);
    uploadsBucket.grantReadWrite(publishClosetItemFn);

    // Allow NotifyAdminFn to send task responses back to ANY Step Functions
    notifyAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "states:SendTaskSuccess",
          "states:SendTaskFailure",
          "states:SendTaskHeartbeat",
        ],
        resources: ["*"],
      }),
    );

    // SNS topic for closet upload approvals (for future SNS-based flows)
    const closetApprovalTopic = new sns.Topic(this, "ClosetApprovalTopic", {
      displayName: "Bestie Closet Upload Approvals",
      topicName: `sa-${cdk.Stack.of(this).stackName}-closet-approval`,
    });

    // ---- ClosetUploadApproval state machine ----

    const segmentOutfitTask = new tasks.LambdaInvoke(this, "SegmentOutfit", {
      lambdaFunction: imageSegmentationFn,
      payload: sfn.TaskInput.fromObject({
        item: {
          "s3Key.$": "$.item.s3Key",
        },
      }),
      resultPath: "$.segmentation",
    });

    const moderationTask = new tasks.LambdaInvoke(this, "ModerateImage", {
      lambdaFunction: moderationFn,
      outputPath: "$.Payload",
    });

    const piiTask = new tasks.LambdaInvoke(this, "CheckPII", {
      lambdaFunction: piiCheckFn,
      outputPath: "$.Payload",
    });

    const notifyAdminTask = new tasks.LambdaInvoke(
      this,
      "NotifyAdminForApproval",
      {
        lambdaFunction: notifyAdminFn,
        integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        payload: sfn.TaskInput.fromObject({
          token: sfn.JsonPath.taskToken,
          item: sfn.JsonPath.stringAt("$.item"),
          processedImageKey: sfn.JsonPath.stringAt(
            "$.segmentation.Payload.outputKey",
          ),
        }),
      },
    );

    const publishTask = new tasks.LambdaInvoke(this, "PublishClosetItem", {
      lambdaFunction: publishClosetItemFn,
      outputPath: "$.Payload",
    });

    const rejected = new sfn.Fail(this, "Rejected", {
      cause: "RejectedByAdmin",
    });

    const approved = publishTask.next(new sfn.Succeed(this, "Published"));

    const waitForAdminChoice = new sfn.Choice(this, "AdminApproved?")
      .when(sfn.Condition.stringEquals("$.decision", "APPROVE"), approved)
      .when(sfn.Condition.stringEquals("$.decision", "REJECT"), rejected)
      .otherwise(rejected);

    const definition = segmentOutfitTask
      .next(moderationTask)
      .next(piiTask)
      .next(notifyAdminTask)
      .next(waitForAdminChoice);

    this.closetUploadStateMachine = new sfn.StateMachine(
      this,
      "ClosetUploadApprovalSM",
      {
        definitionBody: sfn.DefinitionBody.fromChainable(definition),
        stateMachineType: sfn.StateMachineType.STANDARD,
        tracingEnabled: true,
      },
    );

    // =====================================================
    // 2) BACKGROUND CHANGE APPROVAL (SNS + WAIT_FOR_TASK_TOKEN)
    // =====================================================

    const validateBgFn = new lambdaNode.NodejsFunction(
      this,
      "ValidateBgChangeFn",
      {
        entry: path.join(
          process.cwd(),
          "lambda/closet/validate-background-change.ts",
        ),
        bundling: {
          format: lambdaNode.OutputFormat.CJS,
          minify: true,
          sourceMap: true,
        },
        environment: ENV,
      },
    );
    table.grantReadWriteData(validateBgFn);

    const moderateBgFn = new lambdaNode.NodejsFunction(this, "ModerateBgFn", {
      entry: path.join(
        process.cwd(),
        "lambda/closet/moderate-background.ts",
      ),
      bundling: {
        format: lambdaNode.OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: ENV,
    });
    table.grantReadWriteData(moderateBgFn);
    uploadsBucket.grantRead(moderateBgFn);

    const applyBgFn = new lambdaNode.NodejsFunction(this, "ApplyBgChangeFn", {
      entry: path.join(
        process.cwd(),
        "lambda/closet/apply-background-change.ts",
      ),
      bundling: {
        format: lambdaNode.OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: ENV,
    });
    table.grantReadWriteData(applyBgFn);

    const bgApprovalTopic = new sns.Topic(
      this,
      "BestieBackgroundApprovalTopic",
      {
        displayName: "Bestie Background Change Approvals",
      },
    );

    const bus = new events.EventBus(this, "BestiesBus", {
      eventBusName: `sa-${cdk.Stack.of(this).stackName}-besties`,
    });

    bgApprovalTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["sns:Publish"],
        principals: [new iam.ServicePrincipal("events.amazonaws.com")],
        resources: [bgApprovalTopic.topicArn],
      }),
    );

    new events.Rule(this, "BgChangePendingReviewRule", {
      eventBus: bus,
      eventPattern: {
        source: ["stylingadventures.besties"],
        detailType: ["BestieBackgroundChangePendingReview"],
      },
      targets: [new targets.SnsTopic(bgApprovalTopic)],
    });

    new events.Rule(this, "ClosetItemPendingReviewRule", {
      eventBus: bus,
      eventPattern: {
        source: ["stylingadventures.besties"],
        detailType: ["BestieClosetItemPendingReview"],
      },
      targets: [new targets.SnsTopic(bgApprovalTopic)],
    });

    const validateTask = new tasks.LambdaInvoke(
      this,
      "ValidateBackgroundChange",
      {
        lambdaFunction: validateBgFn,
        payloadResponseOnly: true,
      },
    );

    const segmentBgTask = new tasks.LambdaInvoke(
      this,
      "SegmentOutfitForBgChange",
      {
        lambdaFunction: imageSegmentationFn,
        payload: sfn.TaskInput.fromObject({
          item: {
            "s3Key.$": "$.item.s3Key",
          },
        }),
        resultPath: "$.segmentationBg",
      },
    );

    const moderateTask = new tasks.LambdaInvoke(this, "ModerateBackground", {
      lambdaFunction: moderateBgFn,
      payloadResponseOnly: true,
    });

    const waitForAdmin = new tasks.SnsPublish(this, "NotifyAdminBgChange", {
      topic: bgApprovalTopic,
      message: sfn.TaskInput.fromObject({
        type: "BESTIE_BACKGROUND_CHANGE",
        detail: sfn.JsonPath.entirePayload,
        taskToken: sfn.JsonPath.taskToken,
        processedImageKey: sfn.JsonPath.stringAt(
          "$.segmentationBg.Payload.outputKey",
        ),
      }),
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      resultPath: "$.approval",
    });

    const applyTask = new tasks.LambdaInvoke(this, "ApplyBackgroundChange", {
      lambdaFunction: applyBgFn,
      payloadResponseOnly: true,
    });

    const bgDefinition = validateTask
      .next(segmentBgTask)
      .next(moderateTask)
      .next(waitForAdmin)
      .next(
        new sfn.Choice(this, "AdminApprovedBgChange?")
          .when(
            sfn.Condition.booleanEquals("$.approval.approved", true),
            applyTask,
          )
          .otherwise(
            new sfn.Pass(this, "BackgroundChangeRejected", {
              result: sfn.Result.fromObject({ status: "REJECTED" }),
            }),
          ),
      );

    this.backgroundChangeStateMachine = new sfn.StateMachine(
      this,
      "BackgroundChangeApprovalSM",
      {
        definitionBody: sfn.DefinitionBody.fromChainable(bgDefinition),
        stateMachineType: sfn.StateMachineType.STANDARD,
        tracingEnabled: true,
      },
    );

    // =====================================================
    // 3) Save-approval-token Lambda wired to both SNS topics
    // =====================================================

    const saveApprovalTokenFn = new lambdaNode.NodejsFunction(
      this,
      "SaveApprovalTokenFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          process.cwd(),
          "lambda/workflows/save-approval-token.ts",
        ),
        handler: "handler",
        environment: {
          TABLE_NAME: table.tableName,
          PK_NAME: "pk",
          SK_NAME: "sk",
        },
      },
    );

    table.grantReadWriteData(saveApprovalTokenFn);

    closetApprovalTopic.addSubscription(
      new subs.LambdaSubscription(saveApprovalTokenFn),
    );
    bgApprovalTopic.addSubscription(
      new subs.LambdaSubscription(saveApprovalTokenFn),
    );

    // =====================================================
    // 4) (reserved) Additional workflows can hook into segmentation
    // =====================================================
  }
}
