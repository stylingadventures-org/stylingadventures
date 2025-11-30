// lib/prime-studios-stack.ts
import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface PrimeStudiosStackProps extends StackProps {
  envName: string;
  table: dynamodb.ITable;
  userPool: cognito.IUserPool;
  layoutValidatorFn: lambda.IFunction;
}

const ADMIN_GROUP_NAME = "admin";
const CREATOR_GROUP_NAME = "creator"; // treat creators as "studio users" for now

export class PrimeStudiosStack extends Stack {
  public readonly episodeProductionSm: sfn.StateMachine;

  public readonly episodeComponentsFn: lambda.Function;
  public readonly episodeAssemblerFn: lambda.Function;
  public readonly scriptReviewFn: lambda.Function;

  public readonly coinsLedgerFn: lambda.Function;
  public readonly careerArchiveFn: lambda.Function;
  public readonly pollManagerFn: lambda.Function;
  public readonly mockSocialFeedFn: lambda.Function;

  constructor(scope: Construct, id: string, props: PrimeStudiosStackProps) {
    super(scope, id, props);

    const { envName, table, userPool, layoutValidatorFn } = props;

    const DDB_ENV = {
      TABLE_NAME: table.tableName,
      PK_NAME: "pk",
      SK_NAME: "sk",
      STATUS_GSI: "gsi1",
    };

    // ─────────────────────────────
    // Core Episode Generators
    // ─────────────────────────────
    this.episodeComponentsFn = new NodejsFunction(
      this,
      "EpisodeComponentsFn",
      {
        entry: "lambda/prime/episode-components.ts",
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
        timeout: Duration.seconds(30),
        memorySize: 512,
        environment: {
          ...DDB_ENV,
          ADMIN_GROUP_NAME,
          CREATOR_GROUP_NAME,
          NODE_OPTIONS: "--enable-source-maps",
        },
      },
    );

    table.grantReadWriteData(this.episodeComponentsFn);

    this.episodeAssemblerFn = new NodejsFunction(
      this,
      "EpisodeAssemblerFn",
      {
        entry: "lambda/prime/episode-assembler.ts",
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
        timeout: Duration.seconds(30),
        memorySize: 512,
        environment: {
          ...DDB_ENV,
          ADMIN_GROUP_NAME,
          CREATOR_GROUP_NAME,
          NODE_OPTIONS: "--enable-source-maps",
        },
      },
    );

    table.grantReadWriteData(this.episodeAssemblerFn);

    // ─────────────────────────────
    // Script Review Dashboard
    // ─────────────────────────────
    this.scriptReviewFn = new NodejsFunction(this, "ScriptReviewFn", {
      entry: "lambda/prime/script-review.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(20),
      memorySize: 512,
      environment: {
        ...DDB_ENV,
        ADMIN_GROUP_NAME,
        CREATOR_GROUP_NAME,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    table.grantReadWriteData(this.scriptReviewFn);

    // ─────────────────────────────
    // Support Systems
    // ─────────────────────────────
    this.coinsLedgerFn = new NodejsFunction(this, "CoinsLedgerFn", {
      entry: "lambda/prime/coins-ledger.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(15),
      memorySize: 512,
      environment: {
        ...DDB_ENV,
        ADMIN_GROUP_NAME,
        CREATOR_GROUP_NAME,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });
    table.grantReadWriteData(this.coinsLedgerFn);

    this.careerArchiveFn = new NodejsFunction(this, "CareerArchiveFn", {
      entry: "lambda/prime/career-archive.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(20),
      memorySize: 512,
      environment: {
        ...DDB_ENV,
        ADMIN_GROUP_NAME,
        CREATOR_GROUP_NAME,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });
    table.grantReadWriteData(this.careerArchiveFn);

    this.pollManagerFn = new NodejsFunction(this, "PollManagerFn", {
      entry: "lambda/prime/poll-manager.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(15),
      memorySize: 512,
      environment: {
        ...DDB_ENV,
        ADMIN_GROUP_NAME,
        CREATOR_GROUP_NAME,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });
    table.grantReadWriteData(this.pollManagerFn);

    this.mockSocialFeedFn = new NodejsFunction(this, "MockSocialFeedFn", {
      entry: "lambda/prime/mock-social-feed.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(15),
      memorySize: 512,
      environment: {
        ...DDB_ENV,
        ADMIN_GROUP_NAME,
        CREATOR_GROUP_NAME,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });
    table.grantReadWriteData(this.mockSocialFeedFn);

    // ─────────────────────────────
    // Episode Production State Machine
    // ─────────────────────────────
    const generateComponents = new tasks.LambdaInvoke(
      this,
      "GenerateEpisodeComponents",
      {
        lambdaFunction: this.episodeComponentsFn,
        payloadResponseOnly: true,
      },
    );

    const assembleEpisode = new tasks.LambdaInvoke(
      this,
      "AssembleEpisode",
      {
        lambdaFunction: this.episodeAssemblerFn,
        payloadResponseOnly: true,
      },
    );

    const layoutCheck = new tasks.LambdaInvoke(this, "LayoutCheck", {
      lambdaFunction: layoutValidatorFn,
      payloadResponseOnly: true,
    });

    const definition = generateComponents
      .next(assembleEpisode)
      .next(layoutCheck);

    this.episodeProductionSm = new sfn.StateMachine(
      this,
      "EpisodeProductionStateMachine",
      {
        stateMachineName: `SA2-PrimeStudios-Production-${envName}`,
        definition,
        tracingEnabled: true,
      },
    );

    new CfnOutput(this, "EpisodeProductionSmArn", {
      value: this.episodeProductionSm.stateMachineArn,
    });

    // Access control NOTE:
    // All Prime Studios Lambdas are expected to enforce internal-only access
    // by checking Cognito groups (admin/creator) from identity info.
    userPool; // referenced so props is "used"
  }
}
