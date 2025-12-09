// lib/creator-tools-stack.ts
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";

export interface CreatorToolsStackProps extends StackProps {
  /**
   * Environment name (dev / prod / etc.) – used for naming resources.
   */
  envName: string;

  /**
   * Shared app table where creator cabinets / folders / assets are stored.
   */
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

    // 1) S3 bucket for creator media uploads (used by createCreatorAssetUpload)
    this.creatorMediaBucket = new s3.Bucket(this, "CreatorMediaBucket", {
      // Stable name so we can refer to it from other stacks / configs
      bucketName: `sa-${envName}-creator-media`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // We always use presigned URLs, but browsers still need CORS on PUT/GET.
      cors: [
        {
          allowedOrigins: ["*"], // relies on presigned URLs for auth
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
          ],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 300,
        },
      ],
    });

    // 2) Lambda that implements the GraphQL fields
    //
    // Handles:
    //   Query.creatorCabinets
    //   Query.creatorCabinet
    //   Query.creatorCabinetFolders
    //   Query.creatorCabinetAssets
    //   Mutation.createCreatorCabinet / update / delete
    //   Mutation.createCreatorFolder / rename / delete
    //   Mutation.createCreatorAssetUpload / update / delete / move
    //   Mutation.creatorAiSuggest
    this.creatorToolsFn = new NodejsFunction(this, "CreatorToolsFn", {
      entry: "lambda/creator-tools/index.ts", // <-- handler file
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
        // Dynamo config
        TABLE_NAME: table.tableName,
        PK_NAME: "pk",
        SK_NAME: "sk",
        STATUS_GSI: "gsi1",

        // S3 media bucket for presigned uploads
        CREATOR_MEDIA_BUCKET: this.creatorMediaBucket.bucketName,

        // Story publish / workflow helpers (reserved for future use)
        STORY_PUBLISH_SM_ARN: storyPublishStateMachine.stateMachineArn,

        // Better stack traces in Node 20
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    // 3) Permissions

    // Read/write creator rows in the shared app table
    table.grantReadWriteData(this.creatorToolsFn);

    // Read/write to the creator media bucket (used by presign + cleanup)
    this.creatorMediaBucket.grantReadWrite(this.creatorToolsFn);

    // Allow Lambda to start the story publish state machine
    storyPublishStateMachine.grantStartExecution(this.creatorToolsFn);
  }
}
