// lib/creator-tools-stack.ts
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";

export interface CreatorToolsStackProps extends StackProps {
  envName: string;
  table: dynamodb.ITable;
  /**
   * Still passed in from bin/stylingadventures.ts:
   * used for any scheduling / story-publish helpers.
   */
  storyPublishStateMachine: sfn.IStateMachine;
}

/**
 * CreatorToolsStack
 *
 * Owns:
 *  - Creator media bucket
 *  - Creator tools Lambda that handles:
 *      * cabinets
 *      * folders
 *      * assets
 *      * simple AI suggest stub
 */
export class CreatorToolsStack extends Stack {
  public readonly creatorToolsFn: lambda.Function;
  public readonly creatorMediaBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CreatorToolsStackProps) {
    super(scope, id, props);

    const { envName, table, storyPublishStateMachine } = props;

    // 1) S3 bucket for creator media uploads
    this.creatorMediaBucket = new s3.Bucket(this, "CreatorMediaBucket", {
      bucketName: `sa-${envName}-creator-media`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // 2) Lambda that implements the GraphQL fields
    this.creatorToolsFn = new NodejsFunction(this, "CreatorToolsFn", {
      entry: "lambda/creator-tools/index.ts", // <-- your handler file
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        format: OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      timeout: Duration.seconds(30),
      memorySize: 512,
      environment: {
        TABLE_NAME: table.tableName,
        PK_NAME: "pk",
        SK_NAME: "sk",
        STATUS_GSI: "gsi1",
        CREATOR_MEDIA_BUCKET: this.creatorMediaBucket.bucketName,
        STORY_PUBLISH_SM_ARN: storyPublishStateMachine.stateMachineArn,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    // 3) Permissions
    table.grantReadWriteData(this.creatorToolsFn);
    this.creatorMediaBucket.grantReadWrite(this.creatorToolsFn);
    storyPublishStateMachine.grantStartExecution(this.creatorToolsFn);
  }
}
