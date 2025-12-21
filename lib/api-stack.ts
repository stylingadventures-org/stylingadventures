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
    // GRAPHQL API
    // ────────────────────────────────────────────────────────────
    // ✅ Use project root (process.cwd()) instead of __dirname
    const schemaPath = path.resolve(process.cwd(), "appsync", "schema.graphql");

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
        ],
      },
      xrayEnabled: true,
    });

    /**
     * ✅ HARD FIX for the “field not found” race:
     * - CloudFormation can update schema resource but AppSync may still be APPLYING.
     * - We create a Custom Resource that polls GetSchemaCreationStatus until SUCCESS.
     * - ALL resolvers depend on that Custom Resource (CFN-level dependency).
     */
    const schemaCfn =
      this.api.node.findChild("Schema") as appsync.CfnGraphQLSchema;

    // Custom resource Lambda that polls AppSync schema status until SUCCESS
    const schemaReadyFn = new NodejsFunction(this, "AppSyncSchemaReadyFn", {
      entry: "lambda/internal/appsync-schema-ready.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      timeout: Duration.minutes(10),
      memorySize: 256,
      environment: {
        APPSYNC_API_ID: this.api.apiId,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    // ✅ UPDATED: allow both status + introspection schema checks
    schemaReadyFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "appsync:GetSchemaCreationStatus",
          "appsync:GetIntrospectionSchema",
        ],
        resources: ["*"],
      })
    );

    const schemaReadyProvider = new cr.Provider(this, "SchemaReadyProvider", {
      onEventHandler: schemaReadyFn,
    });

    // This CR is the "gate" that everything should depend on
    const schemaReady = new cdk.CustomResource(this, "SchemaReady", {
      serviceToken: schemaReadyProvider.serviceToken,
      properties: {
        ApiId: this.api.apiId,

        // ✅ Stable bump (NOT Date.now) — change manually when you need to force re-run
        SchemaBump: "v2",
      },
    });

    // ✅ IMPORTANT: make the gate run AFTER the schema resource
    const schemaReadyCfn = schemaReady.node.defaultChild as cdk.CfnResource;
    schemaReadyCfn.addDependency(schemaCfn);

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
    // SIMPLE HELLO TEST ENDPOINT (optional)
    // ────────────────────────────────────────────────────────────
    const helloFn = new lambda.Function(this, "HelloFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/hello"),
      environment: { NODE_OPTIONS: "--enable-source-maps" },
    });

    const helloDs = this.api.addLambdaDataSource("HelloDs", helloFn);
    createResolver(helloDs, "Hello", { typeName: "Query", fieldName: "hello" });

    // ────────────────────────────────────────────────────────────
    // QUERY.me (NONE DATA SOURCE)
    // ────────────────────────────────────────────────────────────
    const noneDs = this.api.addNoneDataSource("NoneDs");

    const queryMe = noneDs.createResolver("QueryMeResolver", {
      typeName: "Query",
      fieldName: "me",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
{
  "version": "2017-02-28",
  "payload": {}
}
`),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
#set($sub = "anonymous")
#set($email = "")

#if($ctx.identity && $ctx.identity.sub)
  #set($sub = $ctx.identity.sub)
#end

#if($ctx.identity && $ctx.identity.claims && $ctx.identity.claims.get("email"))
  #set($email = $ctx.identity.claims.get("email"))
#end

$util.toJson({
  "id": $sub,
  "email": $email,
  "role": "FAN",
  "tier": "FREE"
})
`),
    });

    (queryMe.node.defaultChild as appsync.CfnResolver).addDependency(schemaReadyCfn);

    // ────────────────────────────────────────────────────────────
    // CLOSET RESOLVER (PUBLIC / NON-ADMIN)
    // ────────────────────────────────────────────────────────────
    const closetFn = new NodejsFunction(this, "ClosetResolverFn", {
      entry: "lambda/graphql/index.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,

        // Backwards compatible
        APPROVAL_SM_ARN: closetApprovalSm.stateMachineArn,

        // Explicit split
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

    // ✅ Canary deploy for PUBLIC resolver lambda
    const closetFnAlias = new lambda.Alias(this, "ClosetResolverFnLive", {
      aliasName: "live",
      version: closetFn.currentVersion,
    });

    const closetFnAliasErrorsAlarm = new cloudwatch.Alarm(
      this,
      "ClosetResolverFnAliasErrorsAlarm",
      {
        metric: closetFnAlias.metricErrors({ period: Duration.minutes(1) }),
        threshold: 1,
        evaluationPeriods: 1,
      }
    );

    new codedeploy.LambdaDeploymentGroup(
      this,
      "ClosetResolverFnDeploymentGroup",
      {
        alias: closetFnAlias,
        deploymentConfig:
          codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        alarms: [closetFnAliasErrorsAlarm],
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
          deploymentInAlarm: true,
        },
      }
    );

    // DataSource must point at the ALIAS
    const closetDs = this.api.addLambdaDataSource("ClosetDs", closetFnAlias);

    // Queries
    createResolver(closetDs, "MyCloset", { typeName: "Query", fieldName: "myCloset" });
    createResolver(closetDs, "MyWishlistResolver", { typeName: "Query", fieldName: "myWishlist" });
    createResolver(closetDs, "QueryBestieClosetItemsResolver", { typeName: "Query", fieldName: "bestieClosetItems" });
    createResolver(closetDs, "ClosetFeedResolver", { typeName: "Query", fieldName: "closetFeed" });

    // Stories
    createResolver(closetDs, "StoriesResolver", { typeName: "Query", fieldName: "stories" });
    createResolver(closetDs, "MyStoriesResolver", { typeName: "Query", fieldName: "myStories" });

    // Mutations
    createResolver(closetDs, "CreateClosetItem", { typeName: "Mutation", fieldName: "createClosetItem" });
    createResolver(closetDs, "RequestClosetApproval", { typeName: "Mutation", fieldName: "requestClosetApproval" });
    createResolver(closetDs, "UpdateClosetMediaKey", { typeName: "Mutation", fieldName: "updateClosetMediaKey" });
    createResolver(closetDs, "UpdateClosetItemStory", { typeName: "Mutation", fieldName: "updateClosetItemStory" });
    createResolver(closetDs, "LikeClosetItemResolver", { typeName: "Mutation", fieldName: "likeClosetItem" });
    createResolver(closetDs, "ToggleFavoriteClosetItemResolver", { typeName: "Mutation", fieldName: "toggleFavoriteClosetItem" });
    createResolver(closetDs, "CommentOnClosetItemResolver", { typeName: "Mutation", fieldName: "commentOnClosetItem" });
    createResolver(closetDs, "PinHighlightResolver", { typeName: "Mutation", fieldName: "pinHighlight" });
    createResolver(closetDs, "ToggleWishlistItemResolver", { typeName: "Mutation", fieldName: "toggleWishlistItem" });

    createResolver(closetDs, "ClosetItemCommentsResolver", { typeName: "Query", fieldName: "closetItemComments" });
    createResolver(closetDs, "AdminClosetItemLikesResolver", { typeName: "Query", fieldName: "adminClosetItemLikes" });
    createResolver(closetDs, "AdminClosetItemCommentsResolver", { typeName: "Query", fieldName: "adminClosetItemComments" });
    createResolver(closetDs, "PinnedClosetItemsResolver", { typeName: "Query", fieldName: "pinnedClosetItems" });

    createResolver(closetDs, "RequestBgChangeResolver", { typeName: "Mutation", fieldName: "requestClosetBackgroundChange" });
    createResolver(closetDs, "CreateStoryResolver", { typeName: "Mutation", fieldName: "createStory" });
    createResolver(closetDs, "PublishStoryResolver", { typeName: "Mutation", fieldName: "publishStory" });

    createResolver(closetDs, "AddClosetItemToFeedResolver", { typeName: "Mutation", fieldName: "addClosetItemToCommunityFeed" });
    createResolver(closetDs, "RemoveClosetItemFromFeedResolver", { typeName: "Mutation", fieldName: "removeClosetItemFromCommunityFeed" });
    createResolver(closetDs, "ShareClosetItemToPinterestResolver", { typeName: "Mutation", fieldName: "shareClosetItemToPinterest" });

    createResolver(closetDs, "BestieCreateClosetItemResolver", { typeName: "Mutation", fieldName: "bestieCreateClosetItem" });
    createResolver(closetDs, "BestieUpdateClosetItemResolver", { typeName: "Mutation", fieldName: "bestieUpdateClosetItem" });
    createResolver(closetDs, "BestieDeleteClosetItemResolver", { typeName: "Mutation", fieldName: "bestieDeleteClosetItem" });

    // ────────────────────────────────────────────────────────────
    // CLOSET ADMIN (ADMIN-ONLY)
    // ────────────────────────────────────────────────────────────
    const closetAdminFn = new NodejsFunction(this, "ClosetAdminFn", {
      entry: "lambda/closet/admin.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,
        APPROVAL_SM_ARN: closetApprovalSm.stateMachineArn,
        FAN_APPROVAL_SM_ARN: closetApprovalSm.stateMachineArn,
        ADMIN_GROUP_NAME,
        PUBLIC_UPLOADS_CDN,
        NODE_OPTIONS: "--enable-source-maps",
      },
      timeout: Duration.seconds(10),
      memorySize: 512,
    });

    table.grantReadWriteData(closetAdminFn);
    closetApprovalSm.grantStartExecution(closetAdminFn);

    closetAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
        ],
        resources: [table.tableArn, `${table.tableArn}/index/*`],
      })
    );

    closetAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["states:SendTaskSuccess", "states:SendTaskFailure"],
        resources: ["*"],
      })
    );

    // ✅ Canary deploy for ADMIN resolver lambda
    const closetAdminAlias = new lambda.Alias(this, "ClosetAdminFnLive", {
      aliasName: "live",
      version: closetAdminFn.currentVersion,
    });

    const closetAdminAliasErrorsAlarm = new cloudwatch.Alarm(
      this,
      "ClosetAdminFnAliasErrorsAlarm",
      {
        metric: closetAdminAlias.metricErrors({ period: Duration.minutes(1) }),
        threshold: 1,
        evaluationPeriods: 1,
      }
    );

    new codedeploy.LambdaDeploymentGroup(
      this,
      "ClosetAdminFnDeploymentGroup",
      {
        alias: closetAdminAlias,
        deploymentConfig:
          codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        alarms: [closetAdminAliasErrorsAlarm],
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
          deploymentInAlarm: true,
        },
      }
    );

    const closetAdminSource = this.api.addLambdaDataSource(
      "ClosetAdminSource",
      closetAdminAlias
    );

    createResolver(closetAdminSource, "AdminListPendingResolver", { typeName: "Query", fieldName: "adminListPending" });
    createResolver(closetAdminSource, "AdminListClosetItemsResolver", { typeName: "Query", fieldName: "adminListClosetItems" });
    createResolver(closetAdminSource, "AdminListBestieClosetItemsResolver", { typeName: "Query", fieldName: "adminListBestieClosetItems" });

    createResolver(closetAdminSource, "AdminCreateClosetItemResolver", { typeName: "Mutation", fieldName: "adminCreateClosetItem" });
    createResolver(closetAdminSource, "AdminApproveItem", { typeName: "Mutation", fieldName: "adminApproveItem" });
    createResolver(closetAdminSource, "AdminRejectItem", { typeName: "Mutation", fieldName: "adminRejectItem" });
    createResolver(closetAdminSource, "AdminSetClosetAudience", { typeName: "Mutation", fieldName: "adminSetClosetAudience" });
    createResolver(closetAdminSource, "AdminUpdateClosetItemResolver", { typeName: "Mutation", fieldName: "adminUpdateClosetItem" });

    createResolver(closetAdminSource, "AdminPublishClosetItem", { typeName: "Mutation", fieldName: "adminPublishClosetItem" });

    // ────────────────────────────────────────────────────────────
    // PHASE 3: TEA REPORT RESOLVER (PRIME-ONLY)
    // ────────────────────────────────────────────────────────────
    const teaReportFn = new NodejsFunction(this, "TeaReportResolverFn", {
      entry: "lambda/prime/tea-report-resolver.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,
        NODE_OPTIONS: "--enable-source-maps",
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
    });

    table.grantReadWriteData(teaReportFn);

    const teaReportAlias = new lambda.Alias(this, "TeaReportResolverFnLive", {
      aliasName: "live",
      version: teaReportFn.currentVersion,
    });

    const teaReportDs = this.api.addLambdaDataSource("TeaReportDs", teaReportAlias);

    // Queries
    createResolver(teaReportDs, "LatestTeaReportResolver", { typeName: "Query", fieldName: "latestTeaReport" });
    createResolver(teaReportDs, "TeaReportHistoryResolver", { typeName: "Query", fieldName: "teaReportHistory" });
    createResolver(teaReportDs, "CharacterDramaResolver", { typeName: "Query", fieldName: "characterDrama" });
    createResolver(teaReportDs, "RelationshipStatusResolver", { typeName: "Query", fieldName: "relationshipStatus" });

    // Admin Mutations
    createResolver(teaReportDs, "AdminGenerateTeaReportResolver", { typeName: "Mutation", fieldName: "adminGenerateTeaReport" });
    createResolver(teaReportDs, "AdminAddHotTakeResolver", { typeName: "Mutation", fieldName: "adminAddHotTake" });
    createResolver(teaReportDs, "AdminUpdateRelationshipStatusResolver", { typeName: "Mutation", fieldName: "adminUpdateRelationshipStatus" });

    // ────────────────────────────────────────────────────────────
    // PHASE 3: PRIME MAGAZINE RESOLVER (PRIME-ONLY)
    // ────────────────────────────────────────────────────────────
    const magazineFn = new NodejsFunction(this, "MagazineResolverFn", {
      entry: "lambda/prime/magazine-resolver.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,
        NODE_OPTIONS: "--enable-source-maps",
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
    });

    table.grantReadWriteData(magazineFn);

    const magazineAlias = new lambda.Alias(this, "MagazineResolverFnLive", {
      aliasName: "live",
      version: magazineFn.currentVersion,
    });

    const magazineDs = this.api.addLambdaDataSource("MagazineDs", magazineAlias);

    // Queries
    createResolver(magazineDs, "CurrentPrimeMagazineResolver", { typeName: "Query", fieldName: "currentPrimeMagazine" });
    createResolver(magazineDs, "PrimeMagazineArchiveResolver", { typeName: "Query", fieldName: "primeMagazineArchive" });
    createResolver(magazineDs, "PrimeMagazineResolver", { typeName: "Query", fieldName: "primeMagazine" });
    createResolver(magazineDs, "MagazineArticlesResolver", { typeName: "Query", fieldName: "magazineArticles" });

    // Admin Mutations
    createResolver(magazineDs, "AdminCreateMagazineIssueResolver", { typeName: "Mutation", fieldName: "adminCreateMagazineIssue" });
    createResolver(magazineDs, "AdminAddArticleResolver", { typeName: "Mutation", fieldName: "adminAddArticle" });
    createResolver(magazineDs, "AdminCreateFashionEditorialResolver", { typeName: "Mutation", fieldName: "adminCreateFashionEditorial" });
    createResolver(magazineDs, "AdminPublishMagazineResolver", { typeName: "Mutation", fieldName: "adminPublishMagazine" });

    // ────────────────────────────────────────────────────────────
    // PHASE 3: CREATOR FORECAST RESOLVER (CREATOR+)
    // ────────────────────────────────────────────────────────────
    const forecastFn = new NodejsFunction(this, "CreatorForecastResolverFn", {
      entry: "lambda/creator/forecast-resolver.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,
        NODE_OPTIONS: "--enable-source-maps",
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
    });

    table.grantReadWriteData(forecastFn);

    const forecastAlias = new lambda.Alias(this, "CreatorForecastResolverFnLive", {
      aliasName: "live",
      version: forecastFn.currentVersion,
    });

    const forecastDs = this.api.addLambdaDataSource("ForecastDs", forecastAlias);

    // Queries
    createResolver(forecastDs, "CreatorLatestForecastResolver", { typeName: "Query", fieldName: "creatorLatestForecast" });
    createResolver(forecastDs, "CreatorForecastHistoryResolver", { typeName: "Query", fieldName: "creatorForecastHistory" });
    createResolver(forecastDs, "CreatorReportResolver", { typeName: "Query", fieldName: "creatorReport" });
    createResolver(forecastDs, "PlatformTrendPredictionsResolver", { typeName: "Query", fieldName: "platformTrendPredictions" });
    createResolver(forecastDs, "CreatorGrowthRecommendationsResolver", { typeName: "Query", fieldName: "creatorGrowthRecommendations" });

    // Admin Mutations
    createResolver(forecastDs, "AdminGenerateCreatorForecastResolver", { typeName: "Mutation", fieldName: "adminGenerateCreatorForecast" });
    createResolver(forecastDs, "AdminUpdateAnalyticsSnapshotResolver", { typeName: "Mutation", fieldName: "adminUpdateAnalyticsSnapshot" });
    createResolver(forecastDs, "AdminGeneratePlatformTrendsResolver", { typeName: "Mutation", fieldName: "adminGeneratePlatformTrends" });

    // ────────────────────────────────────────────────────────────
    // PHASE 3: SHOPPING RESOLVER
    // ────────────────────────────────────────────────────────────
    const shoppingFn = new NodejsFunction(this, "ShoppingResolverFn", {
      entry: "lambda/commerce/shopping-resolver.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,
        NODE_OPTIONS: "--enable-source-maps",
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
    });

    table.grantReadWriteData(shoppingFn);

    const shoppingAlias = new lambda.Alias(this, "ShoppingResolverFnLive", {
      aliasName: "live",
      version: shoppingFn.currentVersion,
    });

    const shoppingDs = this.api.addLambdaDataSource("ShoppingDs", shoppingAlias);

    // Queries
    createResolver(shoppingDs, "FindExactItemResolver", { typeName: "Query", fieldName: "findExactItem" });
    createResolver(shoppingDs, "SceneShoppableItemsResolver", { typeName: "Query", fieldName: "sceneShoppableItems" });
    createResolver(shoppingDs, "VideoShoppableItemsResolver", { typeName: "Query", fieldName: "videoShoppableItems" });
    createResolver(shoppingDs, "MyShoppingCartResolver", { typeName: "Query", fieldName: "myShoppingCart" });

    // Mutations
    createResolver(shoppingDs, "AddToCartResolver", { typeName: "Mutation", fieldName: "addToCart" });
    createResolver(shoppingDs, "RemoveFromCartResolver", { typeName: "Mutation", fieldName: "removeFromCart" });

    // Admin Mutations
    createResolver(shoppingDs, "AdminCreateShoppableItemResolver", { typeName: "Mutation", fieldName: "adminCreateShoppableItem" });
    createResolver(shoppingDs, "AdminAddAffiliateLinkResolver", { typeName: "Mutation", fieldName: "adminAddAffiliateLink" });

    // ────────────────────────────────────────────────────────────
    // PHASE 3: MUSIC RESOLVER
    // ────────────────────────────────────────────────────────────
    const musicFn = new NodejsFunction(this, "MusicResolverFn", {
      entry: "lambda/episodes/music-resolver.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,
        NODE_OPTIONS: "--enable-source-maps",
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
    });

    table.grantReadWriteData(musicFn);

    const musicAlias = new lambda.Alias(this, "MusicResolverFnLive", {
      aliasName: "live",
      version: musicFn.currentVersion,
    });

    const musicDs = this.api.addLambdaDataSource("MusicDs", musicAlias);

    // Queries
    createResolver(musicDs, "MusicErasResolver", { typeName: "Query", fieldName: "musicEras" });
    createResolver(musicDs, "MusicEraResolver", { typeName: "Query", fieldName: "musicEra" });
    createResolver(musicDs, "EraSongsResolver", { typeName: "Query", fieldName: "eraSongs" });
    createResolver(musicDs, "SongMusicVideosResolver", { typeName: "Query", fieldName: "songMusicVideos" });
    createResolver(musicDs, "MusicVideoResolver", { typeName: "Query", fieldName: "musicVideo" });

    // Admin Mutations
    createResolver(musicDs, "AdminCreateMusicEraResolver", { typeName: "Mutation", fieldName: "adminCreateMusicEra" });
    createResolver(musicDs, "AdminCreateSongResolver", { typeName: "Mutation", fieldName: "adminCreateSong" });
    createResolver(musicDs, "AdminCreateMusicVideoResolver", { typeName: "Mutation", fieldName: "adminCreateMusicVideo" });

    // ────────────────────────────────────────────────────────────
    // ... everything else unchanged (admin settings, bestie, episodes, game, shopping, creator tools)
    // Keep using createResolver(...) everywhere so dependencies apply.
    // ────────────────────────────────────────────────────────────

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

