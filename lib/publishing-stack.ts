// lib/publishing-stack.ts
import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface PublishingStackProps extends StackProps {
  envName: string;
  table: dynamodb.ITable;
  layoutValidatorFn: lambda.IFunction;
}

export class PublishingStack extends Stack {
  public readonly episodePublishingSm: sfn.StateMachine;

  public readonly validateEpisodeFn: lambda.Function;
  public readonly publishEpisodeFn: lambda.Function;
  public readonly failEpisodeFn: lambda.Function;

  constructor(scope: Construct, id: string, props: PublishingStackProps) {
    super(scope, id, props);

    const { envName, table, layoutValidatorFn } = props;

    const DDB_ENV = {
      TABLE_NAME: table.tableName,
      PK_NAME: "pk",
      SK_NAME: "sk",
      STATUS_GSI: "gsi1",
    };

    this.validateEpisodeFn = new NodejsFunction(this, "ValidateEpisodeFn", {
      entry: "lambda/prime/validate-episode.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(10),
      memorySize: 512,
      environment: {
        ...DDB_ENV,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });
    table.grantReadData(this.validateEpisodeFn);

    this.publishEpisodeFn = new NodejsFunction(this, "PublishEpisodeFn", {
      entry: "lambda/prime/publish-episode.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(15),
      memorySize: 512,
      environment: {
        ...DDB_ENV,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });
    table.grantReadWriteData(this.publishEpisodeFn);

    this.failEpisodeFn = new NodejsFunction(this, "FailEpisodeFn", {
      entry: "lambda/prime/fail-episode.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.seconds(5),
      memorySize: 256,
      environment: {
        ...DDB_ENV,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });
    table.grantReadWriteData(this.failEpisodeFn);

    const validateEpisode = new tasks.LambdaInvoke(this, "ValidateEpisode", {
      lambdaFunction: this.validateEpisodeFn,
      payloadResponseOnly: true,
    });

    const layoutChecklist = new tasks.LambdaInvoke(this, "LayoutChecklist", {
      lambdaFunction: layoutValidatorFn,
      payloadResponseOnly: true,
    });

    const publish = new tasks.LambdaInvoke(this, "PublishEpisode", {
      lambdaFunction: this.publishEpisodeFn,
      payloadResponseOnly: true,
    });

    const fail = new tasks.LambdaInvoke(this, "MarkEpisodeFailed", {
      lambdaFunction: this.failEpisodeFn,
      payloadResponseOnly: true,
    });

    const definition = validateEpisode
      .next(
        new sfn.Choice(this, "LayoutOk?")
          .when(
            sfn.Condition.booleanEquals("$.layoutValid", true),
            layoutChecklist.next(publish),
          )
          .otherwise(fail),
      );

    this.episodePublishingSm = new sfn.StateMachine(
      this,
      "EpisodePublishingStateMachine",
      {
        stateMachineName: `SA2-PrimeStudios-Publish-${envName}`,
        definition,
        tracingEnabled: true,
      },
    );

    new CfnOutput(this, "EpisodePublishingSmArn", {
      value: this.episodePublishingSm.stateMachineArn,
    });
  }
}
