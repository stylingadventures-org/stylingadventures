// lib/besties-stories-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface BestiesStoriesStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
}

export class BestiesStoriesStack extends cdk.Stack {
  public readonly storyPublishStateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: BestiesStoriesStackProps) {
    super(scope, id, props);

    const composeStoryFn = new lambda.NodejsFunction(this, 'ComposeStoryFn', {
      entry: 'lambda/stories/compose.ts',
      environment: { TABLE_NAME: props.table.tableName },
    });

    const publishStoryFn = new lambda.NodejsFunction(this, 'PublishStoryFn', {
      entry: 'lambda/stories/publish.ts',
      environment: { TABLE_NAME: props.table.tableName },
    });

    props.table.grantReadWriteData(composeStoryFn);
    props.table.grantReadWriteData(publishStoryFn);

    const composeTask = new tasks.LambdaInvoke(this, 'ComposeStory', {
      lambdaFunction: composeStoryFn,
      outputPath: '$.Payload',
    });

    const publishTask = new tasks.LambdaInvoke(this, 'PublishStory', {
      lambdaFunction: publishStoryFn,
      outputPath: '$.Payload',
    });

    // Decide now vs scheduled
    const immediate = publishTask.next(
      new sfn.Succeed(this, 'StoryPublishedNow')
    );

    const scheduled = new sfn.Pass(this, 'ScheduleStory', {
      // In practice, call EventBridge Scheduler via Lambda or AWS SDK integration
      // to create a schedule that triggers PublishStory later.
      result: sfn.Result.fromObject({ scheduled: true }),
    }).next(new sfn.Succeed(this, 'StoryScheduled'));

    const chooseSchedule = new sfn.Choice(this, 'IsScheduled?')
      .when(
        sfn.Condition.isNotNull('$.scheduledAt'),
        scheduled,
      )
      .otherwise(immediate);

    const definition = composeTask.next(chooseSchedule);

    this.storyPublishStateMachine = new sfn.StateMachine(this, 'StoryPublishSM', {
      definition,
      stateMachineType: sfn.StateMachineType.STANDARD,
      tracingEnabled: true,
    });
  }
}
