// lib/besties-stories-stack.ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as path from "path";

export interface BestiesStoriesStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
}

export class BestiesStoriesStack extends cdk.Stack {
  public readonly storyPublishStateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: BestiesStoriesStackProps) {
    super(scope, id, props);

    const { table } = props;

    const ENV = {
      TABLE_NAME: table.tableName,
      NODE_OPTIONS: "--enable-source-maps",
    };

    const composeFn = new lambda.NodejsFunction(this, "ComposeStoryFn", {
      entry: path.join(process.cwd(), "lambda/stories/compose.ts"),
      bundling: { format: lambda.OutputFormat.CJS, minify: true, sourceMap: true },
      environment: ENV,
    });
    table.grantReadWriteData(composeFn);

    const publishFn = new lambda.NodejsFunction(this, "PublishStoryFn", {
      entry: path.join(process.cwd(), "lambda/stories/publish.ts"),
      bundling: { format: lambda.OutputFormat.CJS, minify: true, sourceMap: true },
      environment: ENV,
    });
    table.grantReadWriteData(publishFn);

    // Bus used for "story scheduled" & "story published" events
    const bus = new events.EventBus(this, "StoriesBus", {
      eventBusName: `sa-${cdk.Stack.of(this).stackName}-stories`,
    });

    // Task 1: compose story (validates Bestie tier & closet tags)
    const composeTask = new tasks.LambdaInvoke(this, "ComposeStory", {
      lambdaFunction: composeFn,
      payloadResponseOnly: true,
    });

    // Branch: scheduled vs immediate
    const schedulePublishTask = new tasks.EventBridgePutEvents(
      this,
      "ScheduleStoryPublish",
      {
        entries: [
          {
            eventBus: bus,
            detailType: "BestieStoryScheduled",
            source: "stylingadventures.besties",
            detail: sfn.TaskInput.fromObject({
              storyId: sfn.JsonPath.stringAt("$.storyId"),
              scheduledAt: sfn.JsonPath.stringAt("$.scheduledAt"),
            }),
          },
        ],
      },
    );

    const immediatePublishTask = new tasks.LambdaInvoke(
      this,
      "ImmediatePublishStory",
      {
        lambdaFunction: publishFn,
        payloadResponseOnly: true,
      },
    );

    const chooseSchedule = new sfn.Choice(this, "HasScheduledAt?")
      .when(
        sfn.Condition.isNotNull("$.scheduledAt"),
        schedulePublishTask,
      )
      .otherwise(immediatePublishTask);

    const definition = composeTask.next(chooseSchedule);

    this.storyPublishStateMachine = new sfn.StateMachine(this, "StoryPublishSM", {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      tracingEnabled: true,
      stateMachineType: sfn.StateMachineType.STANDARD,
    });

    // Rule to react when it's time to publish (could be fed by EventBridge Scheduler)
    new events.Rule(this, "StoryPublishRule", {
      eventBus: bus,
      eventPattern: {
        source: ["stylingadventures.besties"],
        detailType: ["BestieStoryScheduled"],
      },
      targets: [
        new targets.LambdaFunction(publishFn, {
          event: events.RuleTargetInput.fromEventPath("$.detail"),
        }),
      ],
    });
  }
}
