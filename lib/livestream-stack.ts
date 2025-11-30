import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ivs from "aws-cdk-lib/aws-ivs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface LivestreamStackProps extends StackProps {
  envName: string;
  table: dynamodb.ITable;
}

/**
 * LivestreamStack
 *
 * - Pro Creator livestream channel (AWS IVS)
 * - Lambda stub for Creator-only livestream actions
 * - Exposes channelArn + playbackUrl for front-end / API use
 *
 * NOTE:
 * - AppSync / API side should enforce creator-only access in the Lambda
 *   handler using cognito:groups (admin || creator).
 */
export class LivestreamStack extends Stack {
  readonly channelArn: string;
  readonly playbackUrl: string;
  readonly livestreamFn: lambda.IFunction;

  constructor(scope: Construct, id: string, props: LivestreamStackProps) {
    super(scope, id, props);

    const { envName, table } = props;

    // Single shared IVS channel for now – you can fan out later
    const channel = new ivs.CfnChannel(this, "CreatorLiveChannel", {
      name: `sa-${envName}-creator-live`,
      latencyMode: "LOW",
      type: "STANDARD",
      authorized: false,
    });

    this.channelArn = channel.attrArn;
    this.playbackUrl = channel.attrPlaybackUrl;

    const livestreamFn = new NodejsFunction(this, "CreatorLivestreamFn", {
      entry: "lambda/creator/live.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: {
        TABLE_NAME: table.tableName,
        LIVESTREAM_CHANNEL_ARN: this.channelArn,
        LIVESTREAM_PLAYBACK_URL: this.playbackUrl,
        // Used by handler to enforce creator-only access on API side
        LIVESTREAM_ALLOWED_GROUPS: "creator,admin",
      },
      timeout: Duration.seconds(10),
      memorySize: 512,
    });

    table.grantReadWriteData(livestreamFn);

    this.livestreamFn = livestreamFn;

    new CfnOutput(this, "CreatorLiveChannelArn", {
      value: this.channelArn,
      exportName: `SA-CreatorLiveChannelArn-${envName}`,
    });

    new CfnOutput(this, "CreatorLivePlaybackUrl", {
      value: this.playbackUrl,
      exportName: `SA-CreatorLivePlaybackUrl-${envName}`,
    });
  }
}
