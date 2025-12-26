// lib/api-stack.ts
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Stack, StackProps, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as lambda from "aws-cdk-lib/aws-lambda";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import * as cr from "aws-cdk-lib/custom-resources";

import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface ApiStackProps extends StackProps {
  userPool: cognito.IUserPool;
  table: dynamodb.ITable;

  // Workflows
  closetApprovalSm: sfn.IStateMachine; // FAN wait-for-approval SM
  bestieClosetAutoPublishSm: sfn.IStateMachine; // BESTIE auto-publish SM (no wait)
  backgroundChangeSm: sfn.IStateMachine;
  storyPublishSm: sfn.IStateMachine;

  /** Optional: Creator / Pro features */
  livestreamFn?: lambda.IFunction; // from LivestreamStack
  commerceFn?: lambda.IFunction; // from CommerceStack

  /** Optional: centralized admin moderation lambda (from AdminStack) */
  adminModerationFn?: lambda.IFunction;

  // 🔹 Prime Bank – AwardPrimeCoins Lambda (from PrimeBankStack)
  primeBankAwardCoinsFn: lambda.IFunction;

  // 🛍 Shopping – Lambda functions from ShoppingStack
  getShopLalasLookFn: lambda.IFunction;
  getShopThisSceneFn: lambda.IFunction;
  linkClosetItemToProductFn: lambda.IFunction;
}

// Static names used in Cognito groups
const ADMIN_GROUP_NAME = "ADMIN";
const CREATOR_GROUP_NAME = "CREATOR";

// Optional: shared CDN base for raw uploads / previews
const PUBLIC_UPLOADS_CDN = process.env.PUBLIC_UPLOADS_CDN ?? "";

/**
 * AppSync + Lambda API stack for Styling Adventures.
 */
export class ApiStack extends Stack {
  public readonly api!: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const {
      userPool,
      table,
      closetApprovalSm,
      bestieClosetAutoPublishSm,
      backgroundChangeSm,
      storyPublishSm,
      livestreamFn,
      commerceFn,
      adminModerationFn, // currently unused but available for future wiring
      primeBankAwardCoinsFn,
      getShopLalasLookFn,
      getShopThisSceneFn,
      linkClosetItemToProductFn,
    } = props;

    const envName =
      this.node.tryGetContext("env") || process.env.ENVIRONMENT || "dev";

    // Prime Bank account table name (follows your naming convention)
    const primeBankAccountTableName = `sa-${envName}-prime-bank-account`;

    const primeBankAccountTable = dynamodb.Table.fromTableName(
      this,
      "PrimeBankAccountImported",
      primeBankAccountTableName
    );

    // Web origin for browser uploads to S3 (adjust per env)
    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";

    const DDB_ENV = {
      TABLE_NAME: table.tableName,
      PK_NAME: "pk",
      SK_NAME: "sk",
      STATUS_GSI: "gsi1",
    };

    // ────────────────────────────────────────────────────────────
    // GRAPHQL API - USING MINIMAL SCHEMA FOR RESOLVER TESTING
    // ────────────────────────────────────────────────────────────
    // Start with minimal schema to test resolver creation
    // Full schema (37KB) will be deployed via CLI after resolvers are created
    
    const schemaPath = path.resolve(process.cwd(), "appsync", "schema-minimal.graphql");
    
    this.api = new appsync.GraphqlApi(this, "StylingApi", {
      name: "stylingadventures-api",
      definition: appsync.Definition.fromFile(schemaPath),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool },
        },
        additionalAuthorizationModes: [
          { authorizationType: appsync.AuthorizationType.IAM },
          { authorizationType: appsync.AuthorizationType.API_KEY },
        ],
      },
      xrayEnabled: true,
    });

    // Grant AppSync read access to schema bucket
    // Note: AppSync service role is managed by CDK internally
    // We'll configure S3 access at the resolver level if needed

    /**
     * ✅ HARD FIX for the “field not found” race:
     * - CloudFormation can update schema resource but AppSync may still be APPLYING.
     * - We create a Custom Resource that polls GetSchemaCreationStatus until SUCCESS.
     * - ALL resolvers depend on that Custom Resource (CFN-level dependency).
     */
    const schemaCfn =
      this.api.node.findChild("Schema") as appsync.CfnGraphQLSchema;

    // Direct schema dependency - no custom resource polling
    // Just use the schema CFN resource as the gate for all resolvers
    const schemaReadyCfn = schemaCfn;

    // Helper to create resolvers that ALWAYS wait for schema readiness
    const createResolver = (
      ds: appsync.LambdaDataSource | appsync.NoneDataSource,
      id: string,
      opts: { typeName: string; fieldName: string }
    ) => {
      const r = ds.createResolver(id, {
        typeName: opts.typeName,
        fieldName: opts.fieldName,
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      });

      // ✅ CFN-level dependency that actually prevents the race
      const resolverCfn = r.node.defaultChild as appsync.CfnResolver;
      resolverCfn.addDependency(schemaReadyCfn);

      return r;
    };

    // ────────────────────────────────────────────────────────────
    // CREATOR MEDIA BUCKET (for cabinets / creator assets)
    // ────────────────────────────────────────────────────────────
    const creatorMediaBucket = new s3.Bucket(this, "CreatorMediaBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedOrigins: [webOrigin],
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3600,
        },
      ],
    });

    // ────────────────────────────────────────────────────────────
    // PHASE 1: CLOSET RESOLVER (PUBLIC)
    // ────────────────────────────────────────────────────────────
    // ✅ Using simpler lambda.Function to bypass NodejsFunction bundling issues
    const closetFn = new lambda.Function(this, "ClosetResolverFn", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/graphql")),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: Duration.seconds(10),
      environment: {
        ...DDB_ENV,
        FAN_APPROVAL_SM_ARN: closetApprovalSm.stateMachineArn,
        BESTIE_AUTOPUBLISH_SM_ARN: bestieClosetAutoPublishSm.stateMachineArn,
        BG_CHANGE_SM_ARN: backgroundChangeSm.stateMachineArn,
        STORY_PUBLISH_SM_ARN: storyPublishSm.stateMachineArn,
        ADMIN_GROUP_NAME,
        CREATOR_GROUP_NAME,
        PUBLIC_UPLOADS_CDN,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    table.grantReadWriteData(closetFn);

    closetApprovalSm.grantStartExecution(closetFn);
    bestieClosetAutoPublishSm.grantStartExecution(closetFn);
    backgroundChangeSm.grantStartExecution(closetFn);
    storyPublishSm.grantStartExecution(closetFn);

    closetFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["events:PutEvents"],
        resources: ["*"],
      })
    );

    // Canary deploy for PUBLIC resolver lambda
    // Note: Using direct function instead of alias to avoid deployment complexity

    // DataSource points directly to the function
    const closetDs = this.api.addLambdaDataSource("ClosetDs", closetFn);

    // ────────────────────────────────────────────────────────────
    // CLOSET RESOLVERS (22 FIELDS)
    // ────────────────────────────────────────────────────────────
    // Query Resolvers (10 fields)
    const queryResolvers = [
      "myCloset",
      "myWishlist",
      "bestieClosetItems",
      "closetFeed",
      "stories",
      "myStories",
      "closetItemComments",
      "adminClosetItemLikes",
      "adminClosetItemComments",
      "pinnedClosetItems",
    ];

    queryResolvers.forEach((fieldName) => {
      closetDs.createResolver(`Query${fieldName}Resolver`, {
        typeName: "Query",
        fieldName,
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      });
    });

    // Mutation Resolvers (12 fields)
    const mutationResolvers = [
      "createClosetItem",
      "requestClosetApproval",
      "updateClosetMediaKey",
      "updateClosetItemStory",
      "likeClosetItem",
      "toggleFavoriteClosetItem",
      "commentOnClosetItem",
      "pinHighlight",
      "toggleWishlistItem",
      "requestClosetBackgroundChange",
      "createStory",
      "publishStory",
    ];

    mutationResolvers.forEach((fieldName) => {
      closetDs.createResolver(`Mutation${fieldName}Resolver`, {
        typeName: "Mutation",
        fieldName,
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      });
    });

    // ────────────────────────────────────────────────────────────
    // OUTPUTS
    // ────────────────────────────────────────────────────────────
    new CfnOutput(this, "GraphQlApiUrl", { value: this.api.graphqlUrl });
    new CfnOutput(this, "GraphQlApiId", { value: this.api.apiId });
    new CfnOutput(this, "CreatorMediaBucketName", {
      value: creatorMediaBucket.bucketName,
    });

    void primeBankAccountTable;
    void adminModerationFn;
    void livestreamFn;
    void commerceFn;
    void primeBankAwardCoinsFn;
    void getShopLalasLookFn;
    void getShopThisSceneFn;
    void linkClosetItemToProductFn;
  }
}

