import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface CreatorToolsStackProps extends StackProps {
  envName: string;
  table: dynamodb.ITable;
  storyPublishStateMachine: sfn.IStateMachine; // from WorkflowsStack
}

/**
 * CreatorToolsStack
 *
 * - Step Functions state machine for scheduled story publish
 * - AI helper Lambda stub (captions / hashtags / planning)
 *
 * NOTE:
 * - API-facing operations (scheduling, AI helpers, episode planning)
 *   should enforce creator-only (admin || creator) via cognito:groups.
 */
export class CreatorToolsStack extends Stack {
  readonly schedulerStateMachine: sfn.StateMachine;
  readonly aiFn: lambda.IFunction;

  constructor(scope: Construct, id: string, props: CreatorToolsStackProps) {
    super(scope, id, props);

    const { envName, table, storyPublishStateMachine } = props;

    const publishTask = new tasks.StepFunctionsStartExecution(
      this,
      "StartStoryPublishSm",
      {
        stateMachine: storyPublishStateMachine,
        input: sfn.TaskInput.fromObject({
          storyId: sfn.JsonPath.stringAt("$.storyId"),
          ownerSub: sfn.JsonPath.stringAt("$.ownerSub"),
          scheduledAt: sfn.JsonPath.stringAt("$.scheduledAt"),
        }),
      },
    );

    const definition = sfn.Chain.start(
      new sfn.Pass(this, "ValidateInput", {
        comment: "Validate creator schedule input; expand later",
      }),
    )
      .next(
        new sfn.Wait(this, "WaitUntilScheduled", {
          time: sfn.WaitTime.timestampPath("$.scheduledAt"),
        }),
      )
      .next(publishTask);

    const scheduler = new sfn.StateMachine(this, "CreatorStoryScheduler", {
      stateMachineName: `SA-CreatorStoryScheduler-${envName}`,
      definition,
    });

    this.schedulerStateMachine = scheduler;

    const aiFn = new NodejsFunction(this, "CreatorAiFn", {
      entry: "lambda/creator/ai.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: {
        TABLE_NAME: table.tableName,
        STORY_SCHEDULER_ARN: scheduler.stateMachineArn,
        // Enforced in handler: only admin/creator can call scheduling/AI tools
        CREATOR_TOOLS_ALLOWED_GROUPS: "creator,admin",
      },
      timeout: Duration.seconds(10),
      memorySize: 512,
    });

    table.grantReadWriteData(aiFn);
    scheduler.grantStartExecution(aiFn);

    this.aiFn = aiFn;

    new CfnOutput(this, "CreatorStorySchedulerArn", {
      value: scheduler.stateMachineArn,
      exportName: `SA-CreatorStorySchedulerArn-${envName}`,
    });
  }
}
