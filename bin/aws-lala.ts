import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";

import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";

import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";

import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

import * as sqs from "aws-cdk-lib/aws-sqs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";

import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

// HTTP API v2
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";

export interface BestiesClosetStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
  uploadsBucket: s3.IBucket;
}

export class BestiesClosetStack extends cdk.Stack {
  /** FAN/admin-upload flow: WAIT_FOR_TASK_TOKEN */
  public readonly closetUploadStateMachine: sfn.StateMachine;

  /** BESTIE/user-upload flow: auto-publish (no wait) */
  public readonly bestieClosetUploadAutoPublishStateMachine: sfn.StateMachine;

  public readonly backgroundChangeStateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: BestiesClosetStackProps) {
    super(scope, id, props);

    const { table, uploadsBucket } = props;

    // =====================================================
    // ADMIN AUDIT LOG TABLE
    // =====================================================
    const adminAuditTable = new dynamodb.Table(this, "AdminAuditTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // =====================================================
    // OPS / ALERTING SNS TOPIC
    // =====================================================
    const opsTopic = new sns.Topic(this, "ClosetOpsTopic", {
      displayName: "Closet Ops Notifications",
    });
    new cdk.CfnOutput(this, "ClosetOpsTopicArn", { value: opsTopic.topicArn });

    // =====================================================
    // DEAD-LETTER QUEUE
    // =====================================================
    const approvalDlq = new sqs.Queue(this, "ClosetApprovalDLQ", {
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.seconds(60),
    });

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
      PK_NAME: "pk",
      SK_NAME: "sk",
      NODE_OPTIONS: "--enable-source-maps",
    };

    // =====================================================
    // 1) Shared Lambdas
    // =====================================================
    const moderationFn = new lambdaNode.NodejsFunction(this, "ModerationFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      entry: path.join(process.cwd(), "lambda/closet/moderation.ts"),
      environment: {
        ...ENV,
        BUCKET_NAME: uploadsBucket.bucketName,
      },
    });

    const piiCheckFn = new lambdaNode.NodejsFunction(this, "PiiCheckFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      entry: path.join(process.cwd(), "lambda/closet/pii-check.ts"),
      environment: ENV,
    });

    const publishClosetItemFn = new lambdaNode.NodejsFunction(this, "PublishClosetItemFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      entry: path.join(process.cwd(), "lambda/closet/publish.ts"),
      bundling: { format: lambdaNode.OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...ENV,
        BUCKET_NAME: uploadsBucket.bucketName,
        PUBLISHED_PREFIX: "published",
      },
    });

    const notifyAdminFn = new lambdaNode.NodejsFunction(this, "NotifyAdminFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      entry: path.join(process.cwd(), "lambda/closet/notify-admin.ts"),
      environment: ENV,
    });

    table.grantReadWriteData(moderationFn);
    table.grantReadWriteData(piiCheckFn);
    table.grantReadWriteData(publishClosetItemFn);
    table.grantReadWriteData(notifyAdminFn);

    uploadsBucket.grantReadWrite(moderationFn);
    uploadsBucket.grantReadWrite(publishClosetItemFn);

    // =====================================================
    // Expire lambda (WAIT_FOR_TASK_TOKEN timeout path)
    // =====================================================
    const expireApprovalFn = new lambdaNode.NodejsFunction(this, "ExpireApprovalFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      entry: path.join(process.cwd(), "lambda/closet/expire-approval.ts"),
      environment: ENV,
    });
    table.grantReadWriteData(expireApprovalFn);

    // =====================================================
    // Scheduled expiration Lambda (sweeper)
    // =====================================================
    const expireApprovalsFn = new lambdaNode.NodejsFunction(this, "ExpireClosetApprovalsFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      entry: path.join(process.cwd(), "lambda/closet/expire-closet-approvals.ts"),
      bundling: { format: lambdaNode.OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...ENV,
        AUDIT_TABLE_NAME: adminAuditTable.tableName,
        NOTIFY_TOPIC_ARN: opsTopic.topicArn,
        MAX_PER_RUN: "25",
      },
    });

    table.grantReadWriteData(expireApprovalsFn);
    adminAuditTable.grantWriteData(expireApprovalsFn);
    opsTopic.grantPublish(expireApprovalsFn);

    expireApprovalsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["states:SendTaskSuccess", "events:PutEvents"],
        resources: ["*"],
      }),
    );

    new events.Rule(this, "ExpireClosetApprovalsSchedule", {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new targets.LambdaFunction(expireApprovalsFn)],
    });

    // =====================================================
    // DLQ processor Lambda (SQS event source)
    // =====================================================
    const dlqProcessorFn = new lambdaNode.NodejsFunction(this, "ClosetDlqProcessorFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      entry: path.join(process.cwd(), "lambda/closet/dlq-processor.ts"),
      bundling: { format: lambdaNode.OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...ENV,
        AUDIT_TABLE_NAME: adminAuditTable.tableName,
        NOTIFY_TOPIC_ARN: opsTopic.topicArn,
      },
    });

    table.grantReadWriteData(dlqProcessorFn);
    adminAuditTable.grantWriteData(dlqProcessorFn);
    opsTopic.grantPublish(dlqProcessorFn);

    dlqProcessorFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["events:PutEvents"],
        resources: ["*"],
      }),
    );

    dlqProcessorFn.addEventSource(
      new lambdaEventSources.SqsEventSource(approvalDlq, {
        batchSize: 10,
      }),
    );

    // =====================================================
    // CloudWatch alarms -> opsTopic
    // =====================================================
    const alarmAction = new cloudwatchActions.SnsAction(opsTopic);

    const dashboard = new cloudwatch.Dashboard(this, "ClosetHappyPathDashboard", {
      dashboardName: `sa-${cdk.Stack.of(this).stackName}-closet-happy-path`,
    });

    new cloudwatch.Alarm(this, "ApprovalDlqAlarm", {
      metric: approvalDlq.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: "Closet approval DLQ has messages",
    }).addAlarmAction(alarmAction);

    new cloudwatch.Alarm(this, "ExpireApprovalsErrors", {
      metric: expireApprovalsFn.metricErrors({ period: cdk.Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: "ExpireClosetApprovalsFn is erroring",
    }).addAlarmAction(alarmAction);

    new cloudwatch.Alarm(this, "DlqProcessorErrors", {
      metric: dlqProcessorFn.metricErrors({ period: cdk.Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: "ClosetDlqProcessorFn is erroring",
    }).addAlarmAction(alarmAction);

    // =====================================================
    // SLA alarms: Approval latency p90 / p99 (APPROVED outcomes)
    // =====================================================
    const approvalLatencyP90 = new cloudwatch.Metric({
      namespace: "StylingAdventures/ClosetApprovals",
      metricName: "ApprovalLatencySeconds",
      statistic: "p90",
      period: cdk.Duration.minutes(5),
      dimensionsMap: { Outcome: "APPROVED" },
    });

    new cloudwatch.Alarm(this, "ApprovalLatencyP90TooHigh", {
      metric: approvalLatencyP90,
      threshold: 60 * 10,
      evaluationPeriods: 1,
      alarmDescription: "p90 approval latency > 10 minutes",
    }).addAlarmAction(alarmAction);

    const approvalLatencyP99 = new cloudwatch.Metric({
      namespace: "StylingAdventures/ClosetApprovals",
      metricName: "ApprovalLatencySeconds",
      statistic: "p99",
      period: cdk.Duration.minutes(5),
      dimensionsMap: { Outcome: "APPROVED" },
    });

    new cloudwatch.Alarm(this, "ApprovalLatencyP99TooHigh", {
      metric: approvalLatencyP99,
      threshold: 60 * 20,
      evaluationPeriods: 1,
      alarmDescription: "p99 approval latency > 20 minutes",
    }).addAlarmAction(alarmAction);

    // =====================================================
    // 1A) FAN CLOSET UPLOAD APPROVAL (WAIT_FOR_TASK_TOKEN)
    // =====================================================

    const fanNormalizeFromItem = new sfn.Pass(this, "FanNormalizeFromItem", {
      parameters: { "item.$": "$.item" },
    });

    const fanNormalizeFromRoot = new sfn.Pass(this, "FanNormalizeFromRoot", {
      parameters: {
        item: {
          "s3Key.$": "$.s3Key",
          "rawMediaKey.$": "$.rawMediaKey",
          "id.$": "$.id",
          "ownerSub.$": "$.ownerSub",
          "userId.$": "$.userId",
        },
      },
    });

    const fanHasItemObject = new sfn.Choice(this, "FanHasItemObject?")
      .when(sfn.Condition.isPresent("$.item"), fanNormalizeFromItem)
      .otherwise(fanNormalizeFromRoot);

    const fanIdsOk_NoRaw = new sfn.Pass(this, "FanIdsOk_NoRaw", {
      parameters: {
        item: {
          "id.$": "$.item.id",
          "s3Key.$": "$.item.s3Key",
          "ownerSub.$": "$.item.ownerSub",
          "userId.$": "$.item.userId",
        },
      },
    });

    const fanIdsOk_WithRaw = new sfn.Pass(this, "FanIdsOk_WithRaw", {
      parameters: {
        item: {
          "id.$": "$.item.id",
          "s3Key.$": "$.item.s3Key",
          "rawMediaKey.$": "$.item.rawMediaKey",
          "ownerSub.$": "$.item.ownerSub",
          "userId.$": "$.item.userId",
        },
      },
    });

    const fanUseUserIdAsOwnerSub_NoRaw = new sfn.Pass(this, "FanUseUserIdAsOwnerSub_NoRaw", {
      parameters: {
        item: {
          "id.$": "$.item.id",
          "s3Key.$": "$.item.s3Key",
          "userId.$": "$.item.userId",
          "ownerSub.$": "$.item.userId",
        },
      },
    });

    const fanUseUserIdAsOwnerSub_WithRaw = new sfn.Pass(this, "FanUseUserIdAsOwnerSub_WithRaw", {
      parameters: {
        item: {
          "id.$": "$.item.id",
          "s3Key.$": "$.item.s3Key",
          "rawMediaKey.$": "$.item.rawMediaKey",
          "userId.$": "$.item.userId",
          "ownerSub.$": "$.item.userId",
        },
      },
    });

    const fanUseOwnerSubAsUserId_NoRaw = new sfn.Pass(this, "FanUseOwnerSubAsUserId_NoRaw", {
      parameters: {
        item: {
          "id.$": "$.item.id",
          "s3Key.$": "$.item.s3Key",
          "ownerSub.$": "$.item.ownerSub",
          "userId.$": "$.item.ownerSub",
        },
      },
    });

    const fanUseOwnerSubAsUserId_WithRaw = new sfn.Pass(this, "FanUseOwnerSubAsUserId_WithRaw", {
      parameters: {
        item: {
          "id.$": "$.item.id",
          "s3Key.$": "$.item.s3Key",
          "rawMediaKey.$": "$.item.rawMediaKey",
          "ownerSub.$": "$.item.ownerSub",
          "userId.$": "$.item.ownerSub",
        },
      },
    });

    const fanChooseIdsOk = new sfn.Choice(this, "FanHasRawMediaKey_ForIdsOk?")
      .when(sfn.Condition.isPresent("$.item.rawMediaKey"), fanIdsOk_WithRaw)
      .otherwise(fanIdsOk_NoRaw);

    const fanChooseUseUserIdAsOwnerSub = new sfn.Choice(
      this,
      "FanHasRawMediaKey_ForUserIdAsOwnerSub?",
    )
      .when(sfn.Condition.isPresent("$.item.rawMediaKey"), fanUseUserIdAsOwnerSub_WithRaw)
      .otherwise(fanUseUserIdAsOwnerSub_NoRaw);

    const fanChooseUseOwnerSubAsUserId = new sfn.Choice(
      this,
      "FanHasRawMediaKey_ForOwnerSubAsUserId?",
    )
      .when(sfn.Condition.isPresent("$.item.rawMediaKey"), fanUseOwnerSubAsUserId_WithRaw)
      .otherwise(fanUseOwnerSubAsUserId_NoRaw);

    const fanEnsureIds = new sfn.Choice(this, "FanEnsureIds?")
      .when(
        sfn.Condition.and(
          sfn.Condition.isPresent("$.item.userId"),
          sfn.Condition.isPresent("$.item.ownerSub"),
        ),
        fanChooseIdsOk,
      )
      .when(
        sfn.Condition.and(
          sfn.Condition.isPresent("$.item.userId"),
          sfn.Condition.not(sfn.Condition.isPresent("$.item.ownerSub")),
        ),
        fanChooseUseUserIdAsOwnerSub,
      )
      .when(
        sfn.Condition.and(
          sfn.Condition.not(sfn.Condition.isPresent("$.item.userId")),
          sfn.Condition.isPresent("$.item.ownerSub"),
        ),
        fanChooseUseOwnerSubAsUserId,
      )
      .otherwise(new sfn.Fail(this, "FanMissingIdentity", { cause: "Missing userId/ownerSub" }));

    const fanUseItemS3Key = new sfn.Pass(this, "FanUseItemS3Key", {
      parameters: {
        item: {
          "id.$": "$.item.id",
          "ownerSub.$": "$.item.ownerSub",
          "userId.$": "$.item.userId",
          "s3Key.$": "$.item.s3Key",
        },
      },
    });

    const fanUseItemRawMediaKey = new sfn.Pass(this, "FanUseItemRawMediaKey", {
      parameters: {
        item: {
          "id.$": "$.item.id",
          "ownerSub.$": "$.item.ownerSub",
          "userId.$": "$.item.userId",
          "s3Key.$": "$.item.rawMediaKey",
        },
      },
    });

    const fanPickUploadKey = new sfn.Choice(this, "FanPickUploadKey?")
      .when(sfn.Condition.isPresent("$.item.s3Key"), fanUseItemS3Key)
      .when(sfn.Condition.isPresent("$.item.rawMediaKey"), fanUseItemRawMediaKey)
      .otherwise(new sfn.Fail(this, "FanMissingUploadKey", { cause: "Missing s3Key/rawMediaKey" }));

    const fanSegmentOutfitTask = new tasks.LambdaInvoke(this, "FanSegmentOutfit", {
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

    const fanModerationTask = new tasks.LambdaInvoke(this, "FanModerateImage", {
      lambdaFunction: moderationFn,
      payload: sfn.TaskInput.fromJsonPathAt("$"),
      payloadResponseOnly: true,
      resultPath: "$.moderation",
    });

    const fanPiiTask = new tasks.LambdaInvoke(this, "FanCheckPII", {
      lambdaFunction: piiCheckFn,
      payload: sfn.TaskInput.fromJsonPathAt("$"),
      payloadResponseOnly: true,
      resultPath: "$.pii",
    });

    const fanExpiredTask = new tasks.LambdaInvoke(this, "FanExpireApproval", {
      lambdaFunction: expireApprovalFn,
      payload: sfn.TaskInput.fromObject({
        "approvalId.$": "$.item.id",
        reason: "Timed out waiting for admin approval",
      }),
      payloadResponseOnly: true,
      resultPath: "$.expired",
    });

    const fanNotifyAdminTask = new tasks.LambdaInvoke(this, "FanNotifyAdminForApproval", {
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
      resultPath: "$.admin",
    });

    fanNotifyAdminTask.addCatch(fanExpiredTask, {
      errors: ["States.Timeout"],
      resultPath: "$.notifyError",
    });

    const fanPublishTask = new tasks.LambdaInvoke(this, "FanPublishClosetItem", {
      lambdaFunction: publishClosetItemFn,
      payload: sfn.TaskInput.fromObject({
        "approvalId.$": "$.item.id",
        "item.$": "$.item",
        "segmentation.$": "$.segmentation",
        "moderation.$": "$.moderation",
        "pii.$": "$.pii",
        "admin.$": "$.admin",
      }),
      payloadResponseOnly: true,
      resultPath: "$.published",
    });

    const fanRejected = new sfn.Fail(this, "FanRejected", { cause: "RejectedByAdmin" });
    const fanApproved = fanPublishTask.next(new sfn.Succeed(this, "FanPublished"));

    const fanWaitForAdminChoice = new sfn.Choice(this, "FanAdminApproved?")
      .when(sfn.Condition.stringEquals("$.admin.decision", "APPROVE"), fanApproved)
      .when(sfn.Condition.stringEquals("$.admin.decision", "REJECT"), fanRejected)
      .otherwise(fanRejected);

    const fanWasExpired = new sfn.Choice(this, "FanWasExpired?")
      .when(
        sfn.Condition.isPresent("$.expired"),
        new sfn.Fail(this, "FanExpired", { cause: "ApprovalExpired" }),
      )
      .otherwise(fanWaitForAdminChoice);

    const fanDefinition = sfn.Chain.start(fanHasItemObject.afterwards())
      .next(fanEnsureIds.afterwards())
      .next(fanPickUploadKey.afterwards())
      .next(fanSegmentOutfitTask)
      .next(fanModerationTask)
      .next(fanPiiTask)
      .next(fanNotifyAdminTask)
      .next(fanWasExpired);

    this.closetUploadStateMachine = new sfn.StateMachine(this, "ClosetUploadApprovalSM", {
      definitionBody: sfn.DefinitionBody.fromChainable(fanDefinition),
      stateMachineType: sfn.StateMachineType.STANDARD,
      tracingEnabled: true,
    });

    new cloudwatch.Alarm(this, "ClosetUploadApprovalSMFailedAlarm", {
      metric: this.closetUploadStateMachine.metricFailed({ period: cdk.Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: "ClosetUploadApprovalSM failed executions > 0",
    }).addAlarmAction(alarmAction);

    // Dashboard widgets (now that SM exists)
    const smStarted = this.closetUploadStateMachine.metricStarted({ period: cdk.Duration.minutes(5) });
    const smSucceeded = this.closetUploadStateMachine.metricSucceeded({
      period: cdk.Duration.minutes(5),
    });
    const smFailed = this.closetUploadStateMachine.metricFailed({ period: cdk.Duration.minutes(5) });
    const smTimedOut = this.closetUploadStateMachine.metricTimedOut({
      period: cdk.Duration.minutes(5),
    });

    const approvedCount = new cloudwatch.Metric({
      namespace: "StylingAdventures/ClosetApprovals",
      metricName: "ApprovalCount",
      statistic: "sum",
      period: cdk.Duration.minutes(5),
      dimensionsMap: { Outcome: "APPROVED" },
    });

    const rejectedCount = new cloudwatch.Metric({
      namespace: "StylingAdventures/ClosetApprovals",
      metricName: "ApprovalCount",
      statistic: "sum",
      period: cdk.Duration.minutes(5),
      dimensionsMap: { Outcome: "REJECTED" },
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "ClosetUploadApprovalSM — executions (5m)",
        left: [smStarted, smSucceeded, smFailed, smTimedOut],
      }),
      new cloudwatch.GraphWidget({
        title: "Admin decisions — approvals vs rejects (5m)",
        left: [approvedCount, rejectedCount],
      }),
      new cloudwatch.GraphWidget({
        title: "Approval latency (seconds) — p90 / p99 (APPROVED)",
        left: [approvalLatencyP90, approvalLatencyP99],
      }),
      new cloudwatch.GraphWidget({
        title: "Approval DLQ — visible messages (5m)",
        left: [
          approvalDlq.metricApproximateNumberOfMessagesVisible({ period: cdk.Duration.minutes(5) }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: "Key Lambda errors (5m)",
        left: [
          notifyAdminFn.metricErrors({ period: cdk.Duration.minutes(5) }),
          publishClosetItemFn.metricErrors({ period: cdk.Duration.minutes(5) }),
        ],
      }),
    );

    publishClosetItemFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["events:PutEvents"],
        resources: ["*"],
      }),
    );

    // =====================================================
    // 1B) BESTIE CLOSET UPLOAD (AUTO-PUBLISH, NO WAIT)
    // =====================================================
    const bestieSegmentOutfitTask = new tasks.LambdaInvoke(this, "BestieSegmentOutfit", {
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

    const bestieModerationTask = new tasks.LambdaInvoke(this, "BestieModerateImage", {
      lambdaFunction: moderationFn,
      payload: sfn.TaskInput.fromJsonPathAt("$"),
      payloadResponseOnly: true,
      resultPath: "$.moderation",
    });

    const bestiePiiTask = new tasks.LambdaInvoke(this, "BestieCheckPII", {
      lambdaFunction: piiCheckFn,
      payload: sfn.TaskInput.fromJsonPathAt("$"),
      payloadResponseOnly: true,
      resultPath: "$.pii",
    });

    const bestiePublishTask = new tasks.LambdaInvoke(this, "BestiePublishClosetItem", {
      lambdaFunction: publishClosetItemFn,
      payload: sfn.TaskInput.fromObject({
        "approvalId.$": "$.item.id",
        "item.$": "$.item",
        "segmentation.$": "$.segmentation",
        "moderation.$": "$.moderation",
        "pii.$": "$.pii",
      }),
      payloadResponseOnly: true,
      resultPath: "$.published",
    });

    const bestieGate = new sfn.Choice(this, "BestieChecksPassed?")
      .when(
        sfn.Condition.and(
          sfn.Condition.or(
            sfn.Condition.not(sfn.Condition.isPresent("$.moderation")),
            sfn.Condition.booleanEquals("$.moderation.ok", true),
          ),
          sfn.Condition.or(
            sfn.Condition.not(sfn.Condition.isPresent("$.pii")),
            sfn.Condition.and(
              sfn.Condition.booleanEquals("$.pii.ok", true),
              sfn.Condition.or(
                sfn.Condition.not(sfn.Condition.isPresent("$.pii.hasPii")),
                sfn.Condition.booleanEquals("$.pii.hasPii", false),
              ),
            ),
          ),
        ),
        bestiePublishTask.next(new sfn.Succeed(this, "BestiePublished")),
      )
      .otherwise(new sfn.Fail(this, "BestieRejected", { cause: "ChecksFailed" }));

    const bestieDefinition = bestieSegmentOutfitTask
      .next(bestieModerationTask)
      .next(bestiePiiTask)
      .next(bestieGate);

    this.bestieClosetUploadAutoPublishStateMachine = new sfn.StateMachine(
      this,
      "BestieClosetUploadAutoPublishSM",
      {
        definitionBody: sfn.DefinitionBody.fromChainable(bestieDefinition),
        stateMachineType: sfn.StateMachineType.STANDARD,
        tracingEnabled: true,
      },
    );

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
      environment: { ...ENV },
    });

    table.grantReadWriteData(saveApprovalTokenFn);
    bgApprovalTopic.addSubscription(new subs.LambdaSubscription(saveApprovalTokenFn));

    // =====================================================
    // ✅ Step Functions failures → DLQ (NOW SAFE: after all SMs exist)
    // =====================================================
    new events.Rule(this, "ClosetStepFunctionsFailuresToDLQ", {
      eventPattern: {
        source: ["aws.states"],
        detailType: ["Step Functions Execution Status Change"],
        detail: {
          status: ["FAILED", "TIMED_OUT", "ABORTED"],
          stateMachineArn: [
            this.closetUploadStateMachine.stateMachineArn,
            this.bestieClosetUploadAutoPublishStateMachine.stateMachineArn,
            this.backgroundChangeStateMachine.stateMachineArn,
          ],
        },
      },
      targets: [new targets.SqsQueue(approvalDlq)],
    });

    // =====================================================
    // 4) Admin Approval API -> SendTaskSuccess
    // =====================================================
    const approveClosetUploadFn = new lambdaNode.NodejsFunction(this, "ApproveClosetUploadFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(process.cwd(), "lambda/admin/approve-closet-upload.ts"),
      handler: "handler",
      bundling: { format: lambdaNode.OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...ENV,
        AUDIT_TABLE_NAME: adminAuditTable.tableName,
        NOTIFY_TOPIC_ARN: opsTopic.topicArn,
      },
    });

    table.grantReadWriteData(approveClosetUploadFn);
    adminAuditTable.grantWriteData(approveClosetUploadFn);
    opsTopic.grantPublish(approveClosetUploadFn);

    approveClosetUploadFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["states:SendTaskSuccess", "states:SendTaskFailure", "events:PutEvents"],
        resources: ["*"],
      }),
    );

    new cloudwatch.Alarm(this, "ApproveClosetUploadFnErrors", {
      metric: approveClosetUploadFn.metricErrors({ period: cdk.Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: "ApproveClosetUploadFn is erroring",
    }).addAlarmAction(alarmAction);

    // =====================================================
    // 4B) Admin upload endpoint -> starts FAN SM
    // =====================================================
    const adminFanClosetUploadFn = new lambdaNode.NodejsFunction(this, "AdminFanClosetUploadFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(process.cwd(), "lambda/admin/fan-closet-upload.ts"),
      handler: "handler",
      bundling: { format: lambdaNode.OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: cdk.Duration.seconds(15),
      memorySize: 512,
      environment: {
        TABLE_NAME: table.tableName,
        PK_NAME: "pk",
        SK_NAME: "sk",
        FAN_APPROVAL_SM_ARN: this.closetUploadStateMachine.stateMachineArn,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    table.grantReadWriteData(adminFanClosetUploadFn);
    this.closetUploadStateMachine.grantStartExecution(adminFanClosetUploadFn);

    // =====================================================
    // 5) HTTP API (Admin)
    // =====================================================
    const adminApi = new apigwv2.HttpApi(this, "BestiesAdminApi", {
      apiName: `sa-${cdk.Stack.of(this).stackName}-admin-api`,
    });

    adminApi.addRoutes({
      path: "/admin/closet/approve",
      methods: [apigwv2.HttpMethod.POST, apigwv2.HttpMethod.OPTIONS],
      integration: new apigwv2Integrations.HttpLambdaIntegration(
        "ApproveClosetUploadIntegration",
        approveClosetUploadFn,
      ),
    });

    adminApi.addRoutes({
      path: "/admin/fan/closet/upload",
      methods: [apigwv2.HttpMethod.POST, apigwv2.HttpMethod.OPTIONS],
      integration: new apigwv2Integrations.HttpLambdaIntegration(
        "AdminFanClosetUploadIntegration",
        adminFanClosetUploadFn,
      ),
    });

    // =====================================================
    // ✅ Outputs for scripting / CI
    // =====================================================
    new cdk.CfnOutput(this, "AdminApiUrl", { value: adminApi.url ?? "" });

    new cdk.CfnOutput(this, "ClosetUploadApprovalStateMachineArn", {
      value: this.closetUploadStateMachine.stateMachineArn,
    });

    new cdk.CfnOutput(this, "BestieClosetUploadAutoPublishStateMachineArn", {
      value: this.bestieClosetUploadAutoPublishStateMachine.stateMachineArn,
    });

    new cdk.CfnOutput(this, "BackgroundChangeApprovalStateMachineArn", {
      value: this.backgroundChangeStateMachine.stateMachineArn,
    });

    new cdk.CfnOutput(this, "AppTableName", { value: table.tableName });
    new cdk.CfnOutput(this, "UploadsBucketName", { value: uploadsBucket.bucketName });
    new cdk.CfnOutput(this, "ClosetDashboardName", { value: dashboard.dashboardName });
  }
}
