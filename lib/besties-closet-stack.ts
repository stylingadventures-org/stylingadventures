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

// HTTP API v2
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";

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

    const imageSegmentationFn = new lambda.DockerImageFunction(this, "ImageSegmentationFn", {
      code: lambda.DockerImageCode.fromImageAsset(
        path.join(process.cwd(), "image-segmentation-lambda"),
      ),
      memorySize: 3008,
      timeout: cdk.Duration.seconds(120),
      ephemeralStorageSize: cdk.Size.mebibytes(4096),
      environment: {
        UPLOADS_BUCKET_NAME: uploadsBucket.bucketName,
        PROCESSED_PREFIX: "closet/processed",
      },
    });

    uploadsBucket.grantRead(imageSegmentationFn, "closet/*");
    uploadsBucket.grantWrite(imageSegmentationFn, "closet/processed/*");

    const ENV = {
      TABLE_NAME: table.tableName,
      UPLOADS_BUCKET: uploadsBucket.bucketName,
      NODE_OPTIONS: "--enable-source-maps",
      PK_NAME: "pk",
      SK_NAME: "sk",
    };

    // =====================================================
    // 1) FAN CLOSET UPLOAD APPROVAL (WAIT_FOR_TASK_TOKEN)
    // =====================================================

    const moderationFn = new lambdaNode.NodejsFunction(this, "ModerationFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      entry: path.join(process.cwd(), "lambda/closet/moderation.ts"),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: uploadsBucket.bucketName,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    const piiCheckFn = new lambdaNode.NodejsFunction(this, "PiiCheckFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      entry: path.join(process.cwd(), "lambda/closet/pii-check.ts"),
      environment: {
        TABLE_NAME: table.tableName,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    const publishClosetItemFn = new lambdaNode.NodejsFunction(this, "PublishClosetItemFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      entry: path.join(process.cwd(), "lambda/closet/publish.ts"),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: uploadsBucket.bucketName,
        PUBLISHED_PREFIX: "published",
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    const notifyAdminFn = new lambdaNode.NodejsFunction(this, "NotifyAdminFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      entry: path.join(process.cwd(), "lambda/closet/notify-admin.ts"),
      environment: {
        TABLE_NAME: table.tableName,
        PK_NAME: "pk",
        SK_NAME: "sk",
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    // IAM
    table.grantReadWriteData(moderationFn);
    table.grantReadWriteData(piiCheckFn);
    table.grantReadWriteData(publishClosetItemFn);
    table.grantReadWriteData(notifyAdminFn);

    uploadsBucket.grantReadWrite(moderationFn);
    uploadsBucket.grantReadWrite(publishClosetItemFn);

    // ---- Fan Closet approval state machine ----

    const segmentOutfitTask = new tasks.LambdaInvoke(this, "SegmentOutfit", {
      lambdaFunction: imageSegmentationFn,
      payload: sfn.TaskInput.fromObject({
        item: {
          "s3Key.$": "$.item.s3Key",
          bucket: uploadsBucket.bucketName,
        },
      }),
      payloadResponseOnly: true,
      resultPath: "$.segmentation",
    });

    const moderationTask = new tasks.LambdaInvoke(this, "ModerateImage", {
      lambdaFunction: moderationFn,
      payload: sfn.TaskInput.fromJsonPathAt("$"),
      payloadResponseOnly: true,
      resultPath: "$.moderation",
    });

    const piiTask = new tasks.LambdaInvoke(this, "CheckPII", {
      lambdaFunction: piiCheckFn,
      payload: sfn.TaskInput.fromJsonPathAt("$"),
      payloadResponseOnly: true,
      resultPath: "$.pii",
    });

    // ✅ IMPORTANT FIX:
    // Use "token: JsonPath.taskToken" (NOT "token.$": ...)
    // CDK will generate the correct StepFn JSON: "token.$": "$$.Task.Token"
    const notifyAdminTask = new tasks.LambdaInvoke(this, "NotifyAdminForApproval", {
      lambdaFunction: notifyAdminFn,
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      taskTimeout: sfn.Timeout.duration(cdk.Duration.hours(24)),

      payload: sfn.TaskInput.fromObject({
        token: sfn.JsonPath.taskToken,
        item: sfn.JsonPath.objectAt("$.item"),
        processedImageKey: sfn.JsonPath.stringAt("$.segmentation.outputKey"),
        moderation: sfn.JsonPath.objectAt("$.moderation"),
        pii: sfn.JsonPath.objectAt("$.pii"),
      }),

      // Callback output is the task result
      resultSelector: {
        "decision.$": "$.decision",
        "reason.$": "$.reason",
      },
      resultPath: "$.admin",
    });

    const publishTask = new tasks.LambdaInvoke(this, "PublishClosetItem", {
      lambdaFunction: publishClosetItemFn,
      payload: sfn.TaskInput.fromJsonPathAt("$"),
      payloadResponseOnly: true,
      resultPath: "$.published",
    });

    const rejected = new sfn.Fail(this, "Rejected", { cause: "RejectedByAdmin" });
    const approved = publishTask.next(new sfn.Succeed(this, "Published"));

    const waitForAdminChoice = new sfn.Choice(this, "AdminApproved?")
      .when(sfn.Condition.stringEquals("$.admin.decision", "APPROVE"), approved)
      .when(sfn.Condition.stringEquals("$.admin.decision", "REJECT"), rejected)
      .otherwise(rejected);

    const definition = segmentOutfitTask
      .next(moderationTask)
      .next(piiTask)
      .next(notifyAdminTask)
      .next(waitForAdminChoice);

    this.closetUploadStateMachine = new sfn.StateMachine(this, "ClosetUploadApprovalSM", {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      stateMachineType: sfn.StateMachineType.STANDARD,
      tracingEnabled: true,
    });

    // =====================================================
    // 2) BACKGROUND CHANGE APPROVAL (SNS + WAIT_FOR_TASK_TOKEN)
    // =====================================================

    const validateBgFn = new lambdaNode.NodejsFunction(this, "ValidateBgChangeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      entry: path.join(process.cwd(), "lambda/closet/validate-background-change.ts"),
      bundling: { format: lambdaNode.OutputFormat.CJS, minify: true, sourceMap: true },
      environment: ENV,
    });
    table.grantReadWriteData(validateBgFn);

    const moderateBgFn = new lambdaNode.NodejsFunction(this, "ModerateBgFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      entry: path.join(process.cwd(), "lambda/closet/moderate-background.ts"),
      bundling: { format: lambdaNode.OutputFormat.CJS, minify: true, sourceMap: true },
      environment: ENV,
    });
    table.grantReadWriteData(moderateBgFn);
    uploadsBucket.grantRead(moderateBgFn);

    const applyBgFn = new lambdaNode.NodejsFunction(this, "ApplyBgChangeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      entry: path.join(process.cwd(), "lambda/closet/apply-background-change.ts"),
      bundling: { format: lambdaNode.OutputFormat.CJS, minify: true, sourceMap: true },
      environment: ENV,
    });
    table.grantReadWriteData(applyBgFn);

    const bgApprovalTopic = new sns.Topic(this, "BestieBackgroundApprovalTopic", {
      displayName: "Bestie Background Change Approvals",
    });

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

    const validateTask = new tasks.LambdaInvoke(this, "ValidateBackgroundChange", {
      lambdaFunction: validateBgFn,
      payloadResponseOnly: true,
      resultPath: "$.validation",
    });

    const segmentBgTask = new tasks.LambdaInvoke(this, "SegmentOutfitForBgChange", {
      lambdaFunction: imageSegmentationFn,
      payload: sfn.TaskInput.fromObject({
        item: { "s3Key.$": "$.item.s3Key", bucket: uploadsBucket.bucketName },
      }),
      payloadResponseOnly: true,
      resultPath: "$.segmentationBg",
      timeout: cdk.Duration.seconds(180),
    });

    const moderateTask = new tasks.LambdaInvoke(this, "ModerateBackground", {
      lambdaFunction: moderateBgFn,
      payloadResponseOnly: true,
      resultPath: "$.moderationBg",
    });

    const waitForAdmin = new tasks.SnsPublish(this, "NotifyAdminBgChange", {
      topic: bgApprovalTopic,
      message: sfn.TaskInput.fromObject({
        type: "BESTIE_BACKGROUND_CHANGE",
        "detail.$": "$",
        taskToken: sfn.JsonPath.taskToken,
        processedImageKey: sfn.JsonPath.stringAt("$.segmentationBg.outputKey"),
      }),
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      resultPath: "$.approval",
    });

    const applyTask = new tasks.LambdaInvoke(this, "ApplyBackgroundChange", {
      lambdaFunction: applyBgFn,
      payloadResponseOnly: true,
      resultPath: "$.applied",
    });

    const bgDefinition = validateTask
      .next(segmentBgTask)
      .next(moderateTask)
      .next(waitForAdmin)
      .next(
        new sfn.Choice(this, "AdminApprovedBgChange?")
          .when(sfn.Condition.booleanEquals("$.approval.approved", true), applyTask)
          .otherwise(
            new sfn.Pass(this, "BackgroundChangeRejected", {
              result: sfn.Result.fromObject({ status: "REJECTED" }),
            }),
          ),
      );

    this.backgroundChangeStateMachine = new sfn.StateMachine(this, "BackgroundChangeApprovalSM", {
      definitionBody: sfn.DefinitionBody.fromChainable(bgDefinition),
      stateMachineType: sfn.StateMachineType.STANDARD,
      tracingEnabled: true,
    });

    // =====================================================
    // 3) Save-approval-token Lambda wired to SNS topic (BG flow)
    // =====================================================

    const saveApprovalTokenFn = new lambdaNode.NodejsFunction(this, "SaveApprovalTokenFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(process.cwd(), "lambda/workflows/save-approval-token.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: table.tableName,
        PK_NAME: "pk",
        SK_NAME: "sk",
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    table.grantReadWriteData(saveApprovalTokenFn);
    bgApprovalTopic.addSubscription(new subs.LambdaSubscription(saveApprovalTokenFn));

    // =====================================================
    // 4) Admin Approval API -> SendTaskSuccess using taskToken on ITEM#<id>/META
    // =====================================================

    const approveClosetUploadFn = new lambdaNode.NodejsFunction(this, "ApproveClosetUploadFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(process.cwd(), "lambda/admin/approve-closet-upload.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: table.tableName,
        PK_NAME: "pk",
        SK_NAME: "sk",
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    table.grantReadWriteData(approveClosetUploadFn);

    approveClosetUploadFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["states:SendTaskSuccess", "states:SendTaskFailure"],
        resources: ["*"],
      }),
    );

    const adminApi = new apigwv2.HttpApi(this, "BestiesAdminApi", {
      apiName: `sa-${cdk.Stack.of(this).stackName}-admin-api`,
    });

    adminApi.addRoutes({
      path: "/admin/closet/approve",
      methods: [apigwv2.HttpMethod.POST],
      integration: new apigwv2Integrations.HttpLambdaIntegration(
        "ApproveClosetUploadIntegration",
        approveClosetUploadFn,
      ),
    });

    new cdk.CfnOutput(this, "AdminApiUrl", { value: adminApi.url ?? "" });
  }
}
