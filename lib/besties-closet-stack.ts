// lib/besties-closet-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export interface BestiesClosetStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
  uploadsBucket: s3.IBucket;
}

export class BestiesClosetStack extends cdk.Stack {
  public readonly closetUploadStateMachine: sfn.StateMachine;
  public readonly backgroundChangeStateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: BestiesClosetStackProps) {
    super(scope, id, props);

    const moderationFn = new lambda.NodejsFunction(this, 'ModerationFn', {
      entry: 'lambda/closet/moderation.ts',
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.uploadsBucket.bucketName,
      },
    });

    const piiCheckFn = new lambda.NodejsFunction(this, 'PiiCheckFn', {
      entry: 'lambda/closet/pii-check.ts',
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });

    const publishClosetItemFn = new lambda.NodejsFunction(this, 'PublishClosetItemFn', {
      entry: 'lambda/closet/publish.ts',
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.uploadsBucket.bucketName,
        PUBLISHED_PREFIX: 'published',
      },
    });

    const notifyAdminFn = new lambda.NodejsFunction(this, 'NotifyAdminFn', {
      entry: 'lambda/closet/notify-admin.ts',
    });

    // IAM – least privilege
    props.table.grantReadWriteData(moderationFn);
    props.table.grantReadWriteData(piiCheckFn);
    props.table.grantReadWriteData(publishClosetItemFn);

    props.uploadsBucket.grantReadWrite(moderationFn);
    props.uploadsBucket.grantReadWrite(publishClosetItemFn);

    // ---- ClosetUploadApproval state machine ----

    const moderationTask = new tasks.LambdaInvoke(this, 'ModerateImage', {
      lambdaFunction: moderationFn,
      outputPath: '$.Payload',
    });

    const piiTask = new tasks.LambdaInvoke(this, 'CheckPII', {
      lambdaFunction: piiCheckFn,
      outputPath: '$.Payload',
    });

    const notifyAdminTask = new tasks.LambdaInvoke(this, 'NotifyAdminForApproval', {
      lambdaFunction: notifyAdminFn,
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      payload: sfn.TaskInput.fromObject({
        token: sfn.JsonPath.taskToken,
        item: sfn.JsonPath.stringAt('$$.Execution.Input.item'),
      }),
    });

    const publishTask = new tasks.LambdaInvoke(this, 'PublishClosetItem', {
      lambdaFunction: publishClosetItemFn,
      outputPath: '$.Payload',
    });

    const rejected = new sfn.Fail(this, 'Rejected', {
      cause: 'RejectedByAdmin',
    });

    const approved = publishTask.next(
      new sfn.Succeed(this, 'Published')
    );

    const waitForAdminChoice = new sfn.Choice(this, 'AdminApproved?')
      .when(sfn.Condition.stringEquals('$.decision', 'APPROVE'), approved)
      .when(sfn.Condition.stringEquals('$.decision', 'REJECT'), rejected)
      .otherwise(rejected);

    const definition = moderationTask
      .next(piiTask)
      .next(notifyAdminTask)
      .next(waitForAdminChoice);

    this.closetUploadStateMachine = new sfn.StateMachine(this, 'ClosetUploadApprovalSM', {
      definition,
      stateMachineType: sfn.StateMachineType.STANDARD,
      tracingEnabled: true,
    });

    // Allow admin tools to resume the workflow via SendTaskSuccess/Failure
    this.closetUploadStateMachine.grantTaskResponse(notifyAdminFn);

    // Example EventBridge rule: notify an admin channel when executions start
    const closetApprovalEventsRule = new events.Rule(this, 'ClosetApprovalEventsRule', {
      eventPattern: {
        source: ['aws.states'],
        detailType: ['Step Functions Execution Status Change'],
        detail: {
          stateMachineArn: [this.closetUploadStateMachine.stateMachineArn],
        },
      },
    });

    closetApprovalEventsRule.addTarget(
      new targets.LambdaFunction(notifyAdminFn)
    );

    // ---- BackgroundChangeApproval state machine (simplified) ----

    const bgModerationFn = new lambda.NodejsFunction(this, 'BgModerationFn', {
      entry: 'lambda/closet/bg-moderation.ts',
      environment: {
        TABLE_NAME: props.table.tableName,
      },
    });

    props.table.grantReadWriteData(bgModerationFn);

    const bgModerationTask = new tasks.LambdaInvoke(this, 'ModerateBackground', {
      lambdaFunction: bgModerationFn,
      outputPath: '$.Payload',
    });

    const bgDefinition = bgModerationTask
      .next(notifyAdminTask)
      .next(waitForAdminChoice); // reuse choice logic

    this.backgroundChangeStateMachine = new sfn.StateMachine(this, 'BackgroundChangeApprovalSM', {
      definition: bgDefinition,
      stateMachineType: sfn.StateMachineType.STANDARD,
      tracingEnabled: true,
    });
  }
}
