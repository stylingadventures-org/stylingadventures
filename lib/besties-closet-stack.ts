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

    // Reusable environment for background-change Lambdas
    const ENV = {
      TABLE_NAME: table.tableName,
      UPLOADS_BUCKET: uploadsBucket.bucketName,
      NODE_OPTIONS: "--enable-source-maps",
    };

    // =====================================================
    // 1) CLOSET UPLOAD APPROVAL (existing)
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

    // IAM – least privilege
    table.grantReadWriteData(moderationFn);
    table.grantReadWriteData(piiCheckFn);
    table.grantReadWriteData(publishClosetItemFn);

    uploadsBucket.grantReadWrite(moderationFn);
    uploadsBucket.grantReadWrite(publishClosetItemFn);

    // ---- ClosetUploadApproval state machine ----

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

    const definition = moderationTask
      .next(piiTask)
      .next(notifyAdminTask)
      .next(waitForAdminChoice);

    this.closetUploadStateMachine = new sfn.StateMachine(
      this,
      "ClosetUploadApprovalSM",
      {
        definition,
        stateMachineType: sfn.StateMachineType.STANDARD,
        tracingEnabled: true,
      },
    );

    // Allow admin tools to resume the workflow via SendTaskSuccess/Failure
    this.closetUploadStateMachine.grantTaskResponse(notifyAdminFn);

    // Example EventBridge rule: notify an admin channel when executions start
    const closetApprovalEventsRule = new events.Rule(
      this,
      "ClosetApprovalEventsRule",
      {
        eventPattern: {
          source: ["aws.states"],
          detailType: ["Step Functions Execution Status Change"],
          detail: {
            stateMachineArn: [this.closetUploadStateMachine.stateMachineArn],
          },
        },
      },
    );

    closetApprovalEventsRule.addTarget(
      new targets.LambdaFunction(notifyAdminFn),
    );

    // =====================================================
    // 2) BACKGROUND CHANGE APPROVAL (new, SNS + WAIT_FOR_TASK_TOKEN)
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

    const applyBgFn = new lambdaNode.NodejsFunction(
      this,
      "ApplyBgChangeFn",
      {
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
      },
    );
    table.grantReadWriteData(applyBgFn);

    // SNS topic + EventBridge for admin review notifications
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

    // Step Functions: BackgroundChangeApproval

    const validateTask = new tasks.LambdaInvoke(
      this,
      "ValidateBackgroundChange",
      {
        lambdaFunction: validateBgFn,
        payloadResponseOnly: true,
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
      }),
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      resultPath: "$.approval",
    });

    const applyTask = new tasks.LambdaInvoke(this, "ApplyBackgroundChange", {
      lambdaFunction: applyBgFn,
      payloadResponseOnly: true,
    });

    const bgDefinition = validateTask
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
  }
}
