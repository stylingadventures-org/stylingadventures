// lib/workflows-v2-stack.ts
import {
  Stack,
  StackProps,
  CfnOutput,
  Duration, // needed for Duration.seconds(...)
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

export interface WorkflowsV2StackProps extends StackProps {
  table: dynamodb.ITable; // used for approvals + Social Pulse + analytics DDB access
}

/**
 * WorkflowsV2Stack (Option B)
 *
 * New, clean home for Step Functions:
 * - Closet item approval
 * - Background change requests
 * - Story publish flows
 * - Social Pulse Express workflow (Creator Social Pulse)
 * - Emotional PR Engine analytics (Goal Compass updates)
 *
 * Also exposes a tiny admin REST API:
 * - POST /approvals  -> completeApprovalFn (calls SendTaskSuccess/Failure)
 */
export class WorkflowsV2Stack extends Stack {
  // primary state machines
  public readonly approvalStateMachine: sfn.StateMachine;
  public readonly bgChangeStateMachine: sfn.StateMachine;
  public readonly storyPublishStateMachine: sfn.StateMachine;

  // Social Pulse Express workflow
  public readonly socialPulseStateMachine: sfn.StateMachine;

  // Emotional PR Engine – Goal Compass analytics
  public readonly emotionalPrEngineStateMachine: sfn.StateMachine;

  // convenient aliases for other stacks
  public readonly closetApprovalSm: sfn.StateMachine;
  public readonly backgroundChangeSm: sfn.StateMachine;
  public readonly storyPublishSm: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: WorkflowsV2StackProps) {
    super(scope, id, props);

    const { table } = props;
    const envName = this.node.tryGetContext("env") ?? "dev";

    //
    // 1) Closet approval pipeline
    //
    const approvalNoop = new sfn.Pass(this, "ApprovalNoop", {
      comment:
        "Closet approval workflow placeholder – expand to multi-step moderation later",
    });

    this.approvalStateMachine = new sfn.StateMachine(
      this,
      "ApprovalStateMachine",
      {
        stateMachineName: `SA2-ClosetApproval-${envName}`,
        // Using 'definition' for compatibility with your CDK version
        definition: approvalNoop,
        // Future-safe:
        // definitionBody: sfn.DefinitionBody.fromChainable(approvalNoop),
      },
    );

    //
    // 2) Background change moderation pipeline
    //
    const bgChangeNoop = new sfn.Pass(this, "BgChangeNoop", {
      comment:
        "Background change workflow placeholder – expand to moderation + processing later",
    });

    this.bgChangeStateMachine = new sfn.StateMachine(
      this,
      "BackgroundChangeStateMachine",
      {
        stateMachineName: `SA2-BackgroundChange-${envName}`,
        definition: bgChangeNoop,
      },
    );

    //
    // 3) Story publish workflow (schedule / publish / syndicate)
    //
    const storyPublishNoop = new sfn.Pass(this, "StoryPublishNoop", {
      comment:
        "Story publish workflow placeholder – expand to scheduling / publishing / syndication later",
    });

    this.storyPublishStateMachine = new sfn.StateMachine(
      this,
      "StoryPublishStateMachine",
      {
        stateMachineName: `SA2-StoryPublish-${envName}`,
        definition: storyPublishNoop,
      },
    );

    //
    // 4) Social Pulse Express workflow (per-request Social Pulse generation)
    //
    const loadGoalCompassFn = new lambdaNode.NodejsFunction(
      this,
      "SocialPulseLoadGoalCompassFn",
      {
        entry: path.join(
          __dirname,
          "..",
          "lambda",
          "social-pulse",
          "loadGoalCompass.ts",
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: {
          format: lambdaNode.OutputFormat.CJS,
          minify: true,
          sourceMap: true,
        },
        environment: {
          TABLE_NAME: table.tableName,
          PK_NAME: "pk",
          SK_NAME: "sk",
        },
        timeout: Duration.seconds(10),
      },
    );

    const fetchTrendsFn = new lambdaNode.NodejsFunction(
      this,
      "SocialPulseFetchTrendsFn",
      {
        entry: path.join(
          __dirname,
          "..",
          "lambda",
          "social-pulse",
          "fetchTrends.ts",
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: {
          format: lambdaNode.OutputFormat.CJS,
          minify: true,
          sourceMap: true,
        },
        environment: {
          TABLE_NAME: table.tableName,
        },
        timeout: Duration.seconds(10),
      },
    );

    const generateIdeasFn = new lambdaNode.NodejsFunction(
      this,
      "SocialPulseGenerateIdeasFn",
      {
        entry: path.join(
          __dirname,
          "..",
          "lambda",
          "social-pulse",
          "generateIdeas.ts",
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: {
          format: lambdaNode.OutputFormat.CJS,
          minify: true,
          sourceMap: true,
        },
        environment: {
          TABLE_NAME: table.tableName,
        },
        timeout: Duration.seconds(10),
      },
    );

    const persistPulseFn = new lambdaNode.NodejsFunction(
      this,
      "SocialPulsePersistFn",
      {
        entry: path.join(
          __dirname,
          "..",
          "lambda",
          "social-pulse",
          "persistPulse.ts",
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: {
          format: lambdaNode.OutputFormat.CJS,
          minify: true,
          sourceMap: true,
        },
        environment: {
          TABLE_NAME: table.tableName,
          PK_NAME: "pk",
          SK_NAME: "sk",
        },
        timeout: Duration.seconds(10),
      },
    );

    // DDB read/write for the Social Pulse lambdas
    table.grantReadData(loadGoalCompassFn);
    table.grantReadData(generateIdeasFn);
    table.grantWriteData(persistPulseFn);

    const loadGoalCompassTask = new tasks.LambdaInvoke(
      this,
      "SP_LoadGoalCompass",
      {
        lambdaFunction: loadGoalCompassFn,
        payloadResponseOnly: true,
      },
    );

    const fetchTrendsTask = new tasks.LambdaInvoke(
      this,
      "SP_FetchExternalTrends",
      {
        lambdaFunction: fetchTrendsFn,
        payloadResponseOnly: true,
      },
    );

    const generateIdeasTask = new tasks.LambdaInvoke(
      this,
      "SP_GenerateContentIdeas",
      {
        lambdaFunction: generateIdeasFn,
        payloadResponseOnly: true,
      },
    );

    const persistPulseTask = new tasks.LambdaInvoke(
      this,
      "SP_PersistPulse",
      {
        lambdaFunction: persistPulseFn,
        payloadResponseOnly: true,
      },
    );

    const socialPulseDefinition = loadGoalCompassTask
      .next(fetchTrendsTask)
      .next(generateIdeasTask)
      .next(persistPulseTask);

    this.socialPulseStateMachine = new sfn.StateMachine(
      this,
      "SocialPulseExpressStateMachine",
      {
        stateMachineName: `SA2-SocialPulse-${envName}`,
        definition: socialPulseDefinition,
        stateMachineType: sfn.StateMachineType.EXPRESS,
      },
    );

    //
    // 5) Emotional PR Engine – Goal Compass analytics workflow
    //
    const goalCompassAnalyticsFn = new lambdaNode.NodejsFunction(
      this,
      "GoalCompassAnalyticsFn",
      {
        entry: path.join(
          __dirname,
          "..",
          "lambda",
          "emotional-pr",
          "goalCompassAnalytics.ts",
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: {
          format: lambdaNode.OutputFormat.CJS,
          minify: true,
          sourceMap: true,
        },
        environment: {
          TABLE_NAME: table.tableName,
          PK_NAME: "pk",
          SK_NAME: "sk",
        },
        timeout: Duration.seconds(20),
      },
    );

    table.grantReadWriteData(goalCompassAnalyticsFn);

    const analyticsTask = new tasks.LambdaInvoke(
      this,
      "EPR_UpdateGoalCompassMix",
      {
        lambdaFunction: goalCompassAnalyticsFn,
        payloadResponseOnly: true,
      },
    );

    // Expect input: { "creatorIds": ["sub1", "sub2", ...] }
    const perCreatorMap = new sfn.Map(this, "EPR_ForEachCreator", {
      itemsPath: sfn.JsonPath.stringAt("$.creatorIds"),
      parameters: {
        "creatorId.$": "$$.Map.Item.Value",
      },
    }).iterator(analyticsTask);

    this.emotionalPrEngineStateMachine = new sfn.StateMachine(
      this,
      "EmotionalPrEngineStateMachine",
      {
        stateMachineName: `SA2-EmotionalPrEngine-${envName}`,
        definition: perCreatorMap,
        stateMachineType: sfn.StateMachineType.STANDARD,
      },
    );

    //
    // Aliases used by other stacks
    //
    this.closetApprovalSm = this.approvalStateMachine;
    this.backgroundChangeSm = this.bgChangeStateMachine;
    this.storyPublishSm = this.storyPublishStateMachine;

    //
    // Outputs (no exportName => avoids legacy cross-stack exports)
    //
    new CfnOutput(this, "ApprovalStateMachineArn", {
      value: this.approvalStateMachine.stateMachineArn,
    });

    new CfnOutput(this, "BgChangeStateMachineArn", {
      value: this.bgChangeStateMachine.stateMachineArn,
    });

    new CfnOutput(this, "StoryPublishStateMachineArn", {
      value: this.storyPublishStateMachine.stateMachineArn,
    });

    new CfnOutput(this, "SocialPulseStateMachineArn", {
      value: this.socialPulseStateMachine.stateMachineArn,
    });

    new CfnOutput(this, "EmotionalPrEngineStateMachineArn", {
      value: this.emotionalPrEngineStateMachine.stateMachineArn,
    });

    //
    // 6) Tiny admin REST API for approvals (out-of-band from fan app)
    //
    const completeApprovalFn = new lambdaNode.NodejsFunction(
      this,
      "CompleteApprovalFn",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../lambda/workflows/complete-approval.ts",
        ),
        handler: "handler",
        environment: {
          TABLE_NAME: table.tableName,
          PK_NAME: "pk",
          SK_NAME: "sk",
        },
      },
    );

    // DDB read/write for approval tokens + lookup
    table.grantReadWriteData(completeApprovalFn);

    // Allow this function to complete SFN tasks (SendTaskSuccess/Failure)
    completeApprovalFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["states:SendTaskSuccess", "states:SendTaskFailure"],
        resources: ["*"], // you can scope to specific SM ARNs later
      }),
    );

    const adminApi = new apigw.RestApi(this, "AdminApprovalApi", {
      restApiName: "stylingadventures-admin-approval",
      deployOptions: {
        stageName: "v1",
      },
    });

    const approvals = adminApi.root.addResource("approvals");

    approvals.addMethod(
      "POST",
      new apigw.LambdaIntegration(completeApprovalFn),
      {
        // TODO: add auth later (IAM / Cognito / API key)
      },
    );
  }
}

