// lib/api-stack.ts
import * as path from "path";
import { Stack, StackProps, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as s3 from "aws-cdk-lib/aws-s3";
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
      primeBankAccountTableName,
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
    this.api = new appsync.GraphqlApi(this, "StylingApi", {
      name: "stylingadventures-api",
      definition: appsync.Definition.fromFile(
        path.join(process.cwd(), "appsync", "schema.graphql"),
      ),
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

    helloDs.createResolver("Hello", {
      typeName: "Query",
      fieldName: "hello",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ────────────────────────────────────────────────────────────
    // QUERY.me (NONE DATA SOURCE)
    // ────────────────────────────────────────────────────────────
    const noneDs = this.api.addNoneDataSource("NoneDs");

    noneDs.createResolver("QueryMeResolver", {
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

    // ────────────────────────────────────────────────────────────
    // CLOSET RESOLVER (Closet + Stories + Community)
    // ────────────────────────────────────────────────────────────
    const closetFn = new NodejsFunction(this, "ClosetResolverFn", {
      entry: "lambda/graphql/index.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,

        // Backwards compatible
        APPROVAL_SM_ARN: closetApprovalSm.stateMachineArn,

        // ✅ Explicit split
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
      }),
    );

    const closetDs = this.api.addLambdaDataSource("ClosetDs", closetFn);

    // Queries
    closetDs.createResolver("MyCloset", {
      typeName: "Query",
      fieldName: "myCloset",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("MyWishlistResolver", {
      typeName: "Query",
      fieldName: "myWishlist",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("QueryBestieClosetItemsResolver", {
      typeName: "Query",
      fieldName: "bestieClosetItems",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("ClosetFeedResolver", {
      typeName: "Query",
      fieldName: "closetFeed",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ✅ Stories (in schema)
    closetDs.createResolver("StoriesResolver", {
      typeName: "Query",
      fieldName: "stories",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("MyStoriesResolver", {
      typeName: "Query",
      fieldName: "myStories",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Mutations
    closetDs.createResolver("CreateClosetItem", {
      typeName: "Mutation",
      fieldName: "createClosetItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("RequestClosetApproval", {
      typeName: "Mutation",
      fieldName: "requestClosetApproval",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("UpdateClosetMediaKey", {
      typeName: "Mutation",
      fieldName: "updateClosetMediaKey",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("UpdateClosetItemStory", {
      typeName: "Mutation",
      fieldName: "updateClosetItemStory",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetDs.createResolver("LikeClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "likeClosetItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("CommentOnClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "commentOnClosetItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("PinHighlightResolver", {
      typeName: "Mutation",
      fieldName: "pinHighlight",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("ToggleWishlistItemResolver", {
      typeName: "Mutation",
      fieldName: "toggleWishlistItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetDs.createResolver("ClosetItemCommentsResolver", {
      typeName: "Query",
      fieldName: "closetItemComments",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("AdminClosetItemLikesResolver", {
      typeName: "Query",
      fieldName: "adminClosetItemLikes",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("AdminClosetItemCommentsResolver", {
      typeName: "Query",
      fieldName: "adminClosetItemComments",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetDs.createResolver("PinnedClosetItemsResolver", {
      typeName: "GameProfile",
      fieldName: "pinnedClosetItems",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetDs.createResolver("RequestBgChangeResolver", {
      typeName: "Mutation",
      fieldName: "requestClosetBackgroundChange",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Story mutations
    closetDs.createResolver("CreateStoryResolver", {
      typeName: "Mutation",
      fieldName: "createStory",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("PublishStoryResolver", {
      typeName: "Mutation",
      fieldName: "publishStory",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetDs.createResolver("AddClosetItemToFeedResolver", {
      typeName: "Mutation",
      fieldName: "addClosetItemToCommunityFeed",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("RemoveClosetItemFromFeedResolver", {
      typeName: "Mutation",
      fieldName: "removeClosetItemFromCommunityFeed",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("ShareClosetItemToPinterestResolver", {
      typeName: "Mutation",
      fieldName: "shareClosetItemToPinterest",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Bestie closet aliases (in schema)
    closetDs.createResolver("BestieCreateClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "bestieCreateClosetItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("BestieUpdateClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "bestieUpdateClosetItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    closetDs.createResolver("BestieDeleteClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "bestieDeleteClosetItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ────────────────────────────────────────────────────────────
    // CLOSET ADMIN (moderation + feed + admin library)
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
      }),
    );

    closetAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["states:SendTaskSuccess", "states:SendTaskFailure"],
        resources: ["*"],
      }),
    );

    const closetAdminSource = this.api.addLambdaDataSource(
      "ClosetAdminSource",
      closetAdminFn,
    );

    closetAdminSource.createResolver("AdminListPendingResolver", {
      typeName: "Query",
      fieldName: "adminListPending",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetAdminSource.createResolver("AdminListClosetItemsResolver", {
      typeName: "Query",
      fieldName: "adminListClosetItems",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetAdminSource.createResolver("AdminCreateClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "adminCreateClosetItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetAdminSource.createResolver("AdminApproveItem", {
      typeName: "Mutation",
      fieldName: "adminApproveItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetAdminSource.createResolver("AdminRejectItem", {
      typeName: "Mutation",
      fieldName: "adminRejectItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetAdminSource.createResolver("AdminSetClosetAudience", {
      typeName: "Mutation",
      fieldName: "adminSetClosetAudience",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    closetAdminSource.createResolver("AdminUpdateClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "adminUpdateClosetItem",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ✅ IMPORTANT: adminPublishClosetItem exists in schema. Wire it here ONCE.
    // Keep the construct id stable ("AdminPublishClosetItem") so CDK/CFN updates the same resolver.
    const adminPublishResolver = closetAdminSource.createResolver(
      "AdminPublishClosetItem",
      {
        typeName: "Mutation",
        fieldName: "adminPublishClosetItem",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      },
    );

    // Optional but useful if you previously hit AlreadyExists:
    // force the CFN Logical ID to match the one already deployed so CFN updates instead of re-creating.
    const adminPublishCfn = adminPublishResolver.node
      .defaultChild as appsync.CfnResolver;
    adminPublishCfn.overrideLogicalId(
      "StylingApiAdminPublishClosetItemResolver0C813E75",
    );

    // ────────────────────────────────────────────────────────────
    // ADMIN SETTINGS
    // ────────────────────────────────────────────────────────────
    const adminSettingsFn = new NodejsFunction(this, "AdminSettingsFn", {
      entry: "lambda/admin/settings.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,
        ADMIN_GROUP_NAME,
        SUPERADMIN_EMAILS: "evonifoster@yahoo.com",
        SKIP_ADMIN_CHECK: process.env.SKIP_ADMIN_CHECK ?? "false",
        NODE_OPTIONS: "--enable-source-maps",
      },
      timeout: Duration.seconds(10),
      memorySize: 256,
    });

    table.grantReadWriteData(adminSettingsFn);

    const adminSettingsDs = this.api.addLambdaDataSource(
      "AdminSettingsDs",
      adminSettingsFn,
    );

    adminSettingsDs.createResolver("GetAdminSettingsResolver", {
      typeName: "Query",
      fieldName: "getAdminSettings",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    adminSettingsDs.createResolver("UpdateAdminSettingsResolver", {
      typeName: "Mutation",
      fieldName: "updateAdminSettings",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ────────────────────────────────────────────────────────────
    // BESTIE / TIER RESOLVERS
    // ────────────────────────────────────────────────────────────
    const bestieFn = new NodejsFunction(this, "BestieFn", {
      entry: "lambda/bestie/index.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,
        USER_POOL_ID: userPool.userPoolId,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
        STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID ?? "",
        BASE_SUCCESS_URL: process.env.BASE_SUCCESS_URL ?? "http://localhost:5173",
        ADMIN_GROUP_NAME,
        NODE_OPTIONS: "--enable-source-maps",
      },
      timeout: Duration.seconds(30),
      memorySize: 512,
    });

    table.grantReadWriteData(bestieFn);
    bestieFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:ListUsers"],
        resources: [userPool.userPoolArn],
      }),
    );

    const bestieDs = this.api.addLambdaDataSource("BestieDs", bestieFn);

    bestieDs.createResolver("MeBestieStatusResolver", {
      typeName: "Query",
      fieldName: "meBestieStatus",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    bestieDs.createResolver("StartBestieCheckoutResolver", {
      typeName: "Mutation",
      fieldName: "startBestieCheckout",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    bestieDs.createResolver("ClaimBestieTrialResolver", {
      typeName: "Mutation",
      fieldName: "claimBestieTrial",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    bestieDs.createResolver("AdminSetBestieResolver", {
      typeName: "Mutation",
      fieldName: "adminSetBestie",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    bestieDs.createResolver("AdminRevokeBestieResolver", {
      typeName: "Mutation",
      fieldName: "adminRevokeBestie",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    bestieDs.createResolver("AdminSetBestieByEmailResolver", {
      typeName: "Mutation",
      fieldName: "adminSetBestieByEmail",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    bestieDs.createResolver("AdminRevokeBestieByEmailResolver", {
      typeName: "Mutation",
      fieldName: "adminRevokeBestieByEmail",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ────────────────────────────────────────────────────────────
    // EPISODE GATE (EARLY ACCESS + UNLOCKS)
    // ────────────────────────────────────────────────────────────
    const episodesGateFn = new NodejsFunction(this, "EpisodesGateFn", {
      entry: "lambda/episodes/gate.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: { ...DDB_ENV, NODE_OPTIONS: "--enable-source-maps" },
    });

    table.grantReadWriteData(episodesGateFn);

    const episodesGateDs = this.api.addLambdaDataSource(
      "EpisodesGateDs",
      episodesGateFn,
    );

    episodesGateDs.createResolver("IsEpisodeEarlyAccessResolver", {
      typeName: "Query",
      fieldName: "isEpisodeEarlyAccess",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    episodesGateDs.createResolver("UnlockEpisodeResolver", {
      typeName: "Mutation",
      fieldName: "unlockEpisode",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    episodesGateDs.createResolver("MyUnlockedEpisodesResolver", {
      typeName: "Query",
      fieldName: "myUnlockedEpisodes",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ────────────────────────────────────────────────────────────
    // EPISODE ADMIN (STUDIO)
    // ────────────────────────────────────────────────────────────
    const episodesAdminFn = new NodejsFunction(this, "EpisodesAdminFn", {
      entry: "lambda/episodes/admin.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true },
      environment: {
        ...DDB_ENV,
        ADMIN_GROUP_NAME,
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    table.grantReadWriteData(episodesAdminFn);

    const episodesAdminDs = this.api.addLambdaDataSource(
      "EpisodesAdminDs",
      episodesAdminFn,
    );

    episodesAdminDs.createResolver("AdminCreateEpisodeResolver", {
      typeName: "Mutation",
      fieldName: "adminCreateEpisode",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    episodesAdminDs.createResolver("AdminUpdateEpisodeResolver", {
      typeName: "Mutation",
      fieldName: "adminUpdateEpisode",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    episodesAdminDs.createResolver("AdminListEpisodesResolver", {
      typeName: "Query",
      fieldName: "adminListEpisodes",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ────────────────────────────────────────────────────────────
    // GAME / ECONOMY / PRIME BANK RESOLVERS
    // ────────────────────────────────────────────────────────────
    const gameEnv = { ...DDB_ENV, NODE_OPTIONS: "--enable-source-maps" };

    const gameplayFn = new NodejsFunction(this, "GameplayFn", {
      entry: "lambda/game/gameplay.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true },
      environment: {
        ...gameEnv,
        ADMIN_GROUP_NAME,
        AWARD_PRIME_COINS_FN_NAME: primeBankAwardCoinsFn.functionName,
      },
    });

    const leaderboardFn = new NodejsFunction(this, "LeaderboardFn", {
      entry: "lambda/game/leaderboard.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true },
      environment: gameEnv,
    });

    const pollsFn = new NodejsFunction(this, "PollsFn", {
      entry: "lambda/game/polls.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true },
      environment: { ...gameEnv, ADMIN_GROUP_NAME },
    });

    const profileFn = new NodejsFunction(this, "ProfileFn", {
      entry: "lambda/game/profile.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true },
      environment: { ...gameEnv, ADMIN_GROUP_NAME },
    });

    const gameEconomyFn = new NodejsFunction(this, "GameEconomyFn", {
      entry: "lambda/api/game-economy.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true },
      environment: {
        ...gameEnv,
        ADMIN_GROUP_NAME,
        AWARD_PRIME_COINS_FN_NAME: primeBankAwardCoinsFn.functionName,
        PRIME_BANK_ACCOUNT_TABLE_NAME: primeBankAccountTableName,
      },
    });

    table.grantReadWriteData(gameplayFn);
    table.grantReadData(leaderboardFn);
    table.grantReadWriteData(pollsFn);
    table.grantReadWriteData(profileFn);
    table.grantReadWriteData(gameEconomyFn);

    primeBankAccountTable.grantReadWriteData(gameEconomyFn);

    primeBankAwardCoinsFn.grantInvoke(gameEconomyFn);
    primeBankAwardCoinsFn.grantInvoke(gameplayFn);

    const gameplayDs = this.api.addLambdaDataSource("GameplayDs", gameplayFn);
    const leaderboardDs = this.api.addLambdaDataSource(
      "LeaderboardDs",
      leaderboardFn,
    );
    const pollsDs = this.api.addLambdaDataSource("PollsDs", pollsFn);
    const profileDs = this.api.addLambdaDataSource("ProfileDs", profileFn);
    const gameEconomyDs = this.api.addLambdaDataSource(
      "GameEconomyDs",
      gameEconomyFn,
    );

    gameplayDs.createResolver("LogGameEventResolver", {
      typeName: "Mutation",
      fieldName: "logGameEvent",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    gameplayDs.createResolver("AwardCoinsResolver", {
      typeName: "Mutation",
      fieldName: "awardCoins",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    pollsDs.createResolver("CreatePoll", {
      typeName: "Mutation",
      fieldName: "createPoll",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    pollsDs.createResolver("VotePoll", {
      typeName: "Mutation",
      fieldName: "votePoll",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    profileDs.createResolver("GrantBadge", {
      typeName: "Mutation",
      fieldName: "grantBadge",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    profileDs.createResolver("SetDisplayName", {
      typeName: "Mutation",
      fieldName: "setDisplayName",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    profileDs.createResolver("UpdateProfile", {
      typeName: "Mutation",
      fieldName: "updateProfile",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    leaderboardDs.createResolver("TopXP", {
      typeName: "Query",
      fieldName: "topXP",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    leaderboardDs.createResolver("TopCoins", {
      typeName: "Query",
      fieldName: "topCoins",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    pollsDs.createResolver("GetPoll", {
      typeName: "Query",
      fieldName: "getPoll",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    profileDs.createResolver("GetMyProfile", {
      typeName: "Query",
      fieldName: "getMyProfile",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    gameEconomyDs.createResolver("GetGameEconomyConfigResolver", {
      typeName: "Query",
      fieldName: "getGameEconomyConfig",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    gameEconomyDs.createResolver("UpdateGameEconomyConfigResolver", {
      typeName: "Mutation",
      fieldName: "updateGameEconomyConfig",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    gameEconomyDs.createResolver("GetPrimeBankAccountResolver", {
      typeName: "Query",
      fieldName: "getPrimeBankAccount",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    gameEconomyDs.createResolver("DailyLoginResolver", {
      typeName: "Mutation",
      fieldName: "dailyLogin",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ────────────────────────────────────────────────────────────
    // 🛍 SHOPPING
    // ────────────────────────────────────────────────────────────
    const shopLalasLookDs = this.api.addLambdaDataSource(
      "ShopLalasLookDataSource",
      getShopLalasLookFn,
    );

    const shopThisSceneDs = this.api.addLambdaDataSource(
      "ShopThisSceneDataSource",
      getShopThisSceneFn,
    );

    const linkClosetItemToProductDs = this.api.addLambdaDataSource(
      "LinkClosetItemToProductDataSource",
      linkClosetItemToProductFn,
    );

    shopLalasLookDs.createResolver("ShopLalasLookResolver", {
      typeName: "Query",
      fieldName: "shopLalasLook",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    shopThisSceneDs.createResolver("ShopThisSceneResolver", {
      typeName: "Query",
      fieldName: "shopThisScene",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    linkClosetItemToProductDs.createResolver("LinkClosetItemToProductResolver", {
      typeName: "Mutation",
      fieldName: "linkClosetItemToProduct",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ────────────────────────────────────────────────────────────
    // CREATOR / LIVESTREAM / COMMERCE
    // ────────────────────────────────────────────────────────────
    if (livestreamFn) {
      const creatorLiveDs = this.api.addLambdaDataSource(
        "CreatorLivestreamDs",
        livestreamFn,
      );

      creatorLiveDs.createResolver("GetCreatorLivestreamInfoResolver", {
        typeName: "Query",
        fieldName: "getCreatorLivestreamInfo",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      });

      creatorLiveDs.createResolver("PinLivestreamHighlightResolver", {
        typeName: "Mutation",
        fieldName: "pinLivestreamHighlight",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      });
    }

    // ✅ Commerce (creatorRevenue* + affiliate click)
    if (commerceFn) {
      const commerceDs = this.api.addLambdaDataSource("CommerceDs", commerceFn);

      commerceDs.createResolver("CreatorRevenueSummaryResolver", {
        typeName: "Query",
        fieldName: "creatorRevenueSummary",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      });

      commerceDs.createResolver("CreatorRevenueByPlatformResolver", {
        typeName: "Query",
        fieldName: "creatorRevenueByPlatform",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      });

      commerceDs.createResolver("RecordAffiliateClickResolver", {
        typeName: "Mutation",
        fieldName: "recordAffiliateClick",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      });
    }

    // ────────────────────────────────────────────────────────────
    // CREATOR TOOLS (AI + Cabinets)
    // ────────────────────────────────────────────────────────────
    const creatorToolsFn = new NodejsFunction(this, "CreatorToolsFn", {
      entry: "lambda/creator-tools/index.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,
        CREATOR_MEDIA_BUCKET: creatorMediaBucket.bucketName,
        PUBLIC_UPLOADS_CDN,
        NODE_OPTIONS: "--enable-source-maps",
      },
      timeout: Duration.seconds(20),
      memorySize: 512,
    });

    table.grantReadWriteData(creatorToolsFn);
    creatorMediaBucket.grantReadWrite(creatorToolsFn);

    const creatorAiDs = this.api.addLambdaDataSource(
      "CreatorAiDs",
      creatorToolsFn,
    );

    creatorAiDs.createResolver("CreatorAiSuggestResolver", {
      typeName: "Mutation",
      fieldName: "creatorAiSuggest",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    creatorAiDs.createResolver("CreatorCabinetsResolver", {
      typeName: "Query",
      fieldName: "creatorCabinets",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    creatorAiDs.createResolver("CreatorCabinetResolver", {
      typeName: "Query",
      fieldName: "creatorCabinet",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    creatorAiDs.createResolver("CreatorCabinetAssetsResolver", {
      typeName: "Query",
      fieldName: "creatorCabinetAssets",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    creatorAiDs.createResolver("CreateCreatorCabinetResolver", {
      typeName: "Mutation",
      fieldName: "createCreatorCabinet",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    creatorAiDs.createResolver("UpdateCreatorCabinetResolver", {
      typeName: "Mutation",
      fieldName: "updateCreatorCabinet",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    creatorAiDs.createResolver("DeleteCreatorCabinetResolver", {
      typeName: "Mutation",
      fieldName: "deleteCreatorCabinet",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    creatorAiDs.createResolver("CreateCreatorAssetUploadResolver", {
      typeName: "Mutation",
      fieldName: "createCreatorAssetUpload",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    creatorAiDs.createResolver("CreatorCabinetFoldersResolver", {
      typeName: "Query",
      fieldName: "creatorCabinetFolders",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    creatorAiDs.createResolver("CreateCreatorFolderResolver", {
      typeName: "Mutation",
      fieldName: "createCreatorFolder",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    creatorAiDs.createResolver("RenameCreatorFolderResolver", {
      typeName: "Mutation",
      fieldName: "renameCreatorFolder",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    creatorAiDs.createResolver("DeleteCreatorFolderResolver", {
      typeName: "Mutation",
      fieldName: "deleteCreatorFolder",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    creatorAiDs.createResolver("UpdateCreatorAssetResolver", {
      typeName: "Mutation",
      fieldName: "updateCreatorAsset",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    creatorAiDs.createResolver("DeleteCreatorAssetResolver", {
      typeName: "Mutation",
      fieldName: "deleteCreatorAsset",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    creatorAiDs.createResolver("MoveCreatorAssetResolver", {
      typeName: "Mutation",
      fieldName: "moveCreatorAsset",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // ────────────────────────────────────────────────────────────
    // OUTPUTS
    // ────────────────────────────────────────────────────────────
    new CfnOutput(this, "GraphQlApiUrl", { value: this.api.graphqlUrl });
    new CfnOutput(this, "GraphQlApiId", { value: this.api.apiId });
    new CfnOutput(this, "CreatorMediaBucketName", {
      value: creatorMediaBucket.bucketName,
    });

    // Keep this around for future wiring if you want to attach it
    void adminModerationFn;
  }
}

