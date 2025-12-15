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

  // 🛍 Shopping – Lamba functions from ShoppingStack
  getShopLalasLookFn: lambda.IFunction;
  getShopThisSceneFn: lambda.IFunction;
  linkClosetItemToProductFn: lambda.IFunction;
}

// Static names used in Cognito groups
// NOTE: your Cognito group is literally named "ADMIN"
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
      // 🛍 Shopping lambdas from ShoppingStack
      getShopLalasLookFn,
      getShopThisSceneFn,
      linkClosetItemToProductFn,
    } = props;

    // Derive env name (shared convention with DatabaseStack)
    const envName =
      this.node.tryGetContext("env") || process.env.ENVIRONMENT || "dev";

    // 🔹 Prime Bank account table name (follows your naming convention)
    const primeBankAccountTableName = `sa-${envName}-prime-bank-account`;

    // Import PrimeBankAccount table by name so we can grant IAM to lambdas
    const primeBankAccountTable = dynamodb.Table.fromTableName(
      this,
      "PrimeBankAccountImported",
      primeBankAccountTableName,
    );

    // Web origin for browser uploads to S3 (adjust per env)
    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";

    // Shared DynamoDB env for all Lambdas using the single-table design.
    const DDB_ENV = {
      TABLE_NAME: table.tableName,
      PK_NAME: "pk",
      SK_NAME: "sk",
      STATUS_GSI: "gsi1", // gsi1: closet status + creator tools (cabinets/assets)
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
    // CLOSET RESOLVER (FAN/BESTIE CLOSET + APPROVAL REQUEST)
    // ────────────────────────────────────────────────────────────
    const closetFn = new NodejsFunction(this, "ClosetResolverFn", {
      entry: "lambda/graphql/index.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,

        // Backwards compatible (some code may still read this)
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

    // Allow GraphQL resolver to start both workflows
    closetApprovalSm.grantStartExecution(closetFn);
    bestieClosetAutoPublishSm.grantStartExecution(closetFn);
    backgroundChangeSm.grantStartExecution(closetFn);
    storyPublishSm.grantStartExecution(closetFn);

    closetFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["events:PutEvents"],
        resources: ["*"], // default event bus
      }),
    );

    const closetDs = this.api.addLambdaDataSource("ClosetDs", closetFn);

    closetDs.createResolver("MyCloset", {
      typeName: "Query",
      fieldName: "myCloset",
    });

    closetDs.createResolver("MyWishlistResolver", {
      typeName: "Query",
      fieldName: "myWishlist",
    });

    closetDs.createResolver("QueryBestieClosetItemsResolver", {
      typeName: "Query",
      fieldName: "bestieClosetItems",
    });

    closetDs.createResolver("CreateClosetItem", {
      typeName: "Mutation",
      fieldName: "createClosetItem",
    });

    closetDs.createResolver("RequestClosetApproval", {
      typeName: "Mutation",
      fieldName: "requestClosetApproval",
    });

    closetDs.createResolver("UpdateClosetMediaKey", {
      typeName: "Mutation",
      fieldName: "updateClosetMediaKey",
    });

    closetDs.createResolver("UpdateClosetItemStory", {
      typeName: "Mutation",
      fieldName: "updateClosetItemStory",
    });

    closetDs.createResolver("LikeClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "likeClosetItem",
    });

    closetDs.createResolver("CommentOnClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "commentOnClosetItem",
    });

    closetDs.createResolver("PinHighlightResolver", {
      typeName: "Mutation",
      fieldName: "pinHighlight",
    });

    closetDs.createResolver("ToggleWishlistItemResolver", {
      typeName: "Mutation",
      fieldName: "toggleWishlistItem",
    });

    closetDs.createResolver("ClosetItemCommentsResolver", {
      typeName: "Query",
      fieldName: "closetItemComments",
    });

    closetDs.createResolver("AdminClosetItemLikesResolver", {
      typeName: "Query",
      fieldName: "adminClosetItemLikes",
    });

    closetDs.createResolver("AdminClosetItemCommentsResolver", {
      typeName: "Query",
      fieldName: "adminClosetItemComments",
    });

    closetDs.createResolver("PinnedClosetItemsResolver", {
      typeName: "GameProfile",
      fieldName: "pinnedClosetItems",
    });

    closetDs.createResolver("RequestBgChangeResolver", {
      typeName: "Mutation",
      fieldName: "requestClosetBackgroundChange",
    });

    closetDs.createResolver("CreateStoryResolver", {
      typeName: "Mutation",
      fieldName: "createStory",
    });

    closetDs.createResolver("PublishStoryResolver", {
      typeName: "Mutation",
      fieldName: "publishStory",
    });

    closetDs.createResolver("AddClosetItemToFeedResolver", {
      typeName: "Mutation",
      fieldName: "addClosetItemToCommunityFeed",
    });

    closetDs.createResolver("RemoveClosetItemFromFeedResolver", {
      typeName: "Mutation",
      fieldName: "removeClosetItemFromCommunityFeed",
    });

    closetDs.createResolver("ShareClosetItemToPinterestResolver", {
      typeName: "Mutation",
      fieldName: "shareClosetItemToPinterest",
    });

    // ────────────────────────────────────────────────────────────
    // CLOSET ADMIN (moderation + public feed + admin library)
    // ────────────────────────────────────────────────────────────
    const closetAdminFn = new NodejsFunction(this, "ClosetAdminFn", {
      entry: "lambda/closet/admin.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,

        // Backwards compatible
        APPROVAL_SM_ARN: closetApprovalSm.stateMachineArn,

        // ✅ New explicit name (recommended for fan flow)
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
    });

    closetAdminSource.createResolver("AdminListClosetItemsResolver", {
      typeName: "Query",
      fieldName: "adminListClosetItems",
    });

    closetAdminSource.createResolver("ClosetFeedResolver", {
      typeName: "Query",
      fieldName: "closetFeed",
    });

    closetAdminSource.createResolver("AdminCreateClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "adminCreateClosetItem",
    });

    closetAdminSource.createResolver("AdminApproveItem", {
      typeName: "Mutation",
      fieldName: "adminApproveItem",
    });

    closetAdminSource.createResolver("AdminRejectItem", {
      typeName: "Mutation",
      fieldName: "adminRejectItem",
    });

    closetAdminSource.createResolver("AdminSetClosetAudience", {
      typeName: "Mutation",
      fieldName: "adminSetClosetAudience",
    });

    closetAdminSource.createResolver("AdminUpdateClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "adminUpdateClosetItem",
    });

    // ────────────────────────────────────────────────────────────
    // ADMIN SETTINGS (NEW)
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
    });

    adminSettingsDs.createResolver("UpdateAdminSettingsResolver", {
      typeName: "Mutation",
      fieldName: "updateAdminSettings",
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
        BASE_SUCCESS_URL:
          process.env.BASE_SUCCESS_URL ?? "http://localhost:5173",
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
    });

    bestieDs.createResolver("StartBestieCheckoutResolver", {
      typeName: "Mutation",
      fieldName: "startBestieCheckout",
    });

    bestieDs.createResolver("ClaimBestieTrialResolver", {
      typeName: "Mutation",
      fieldName: "claimBestieTrial",
    });

    bestieDs.createResolver("AdminSetBestieResolver", {
      typeName: "Mutation",
      fieldName: "adminSetBestie",
    });

    bestieDs.createResolver("AdminRevokeBestieResolver", {
      typeName: "Mutation",
      fieldName: "adminRevokeBestie",
    });

    bestieDs.createResolver("AdminSetBestieByEmailResolver", {
      typeName: "Mutation",
      fieldName: "adminSetBestieByEmail",
    });

    bestieDs.createResolver("AdminRevokeBestieByEmailResolver", {
      typeName: "Mutation",
      fieldName: "adminRevokeBestieByEmail",
    });

    // ────────────────────────────────────────────────────────────
    // EPISODE GATE (EARLY ACCESS + UNLOCKS)
    // ────────────────────────────────────────────────────────────
    const episodesGateFn = new NodejsFunction(this, "EpisodesGateFn", {
      entry: "lambda/episodes/gate.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        ...DDB_ENV,
        NODE_OPTIONS: "--enable-source-maps",
      },
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
    });

    episodesAdminDs.createResolver("AdminUpdateEpisodeResolver", {
      typeName: "Mutation",
      fieldName: "adminUpdateEpisode",
    });

    episodesAdminDs.createResolver("AdminListEpisodesResolver", {
      typeName: "Query",
      fieldName: "adminListEpisodes",
    });

    // ────────────────────────────────────────────────────────────
    // GAME / ECONOMY / PRIME BANK RESOLVERS
    // ────────────────────────────────────────────────────────────
    const gameEnv = {
      ...DDB_ENV,
      NODE_OPTIONS: "--enable-source-maps",
    };

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
      environment: {
        ...gameEnv,
        ADMIN_GROUP_NAME,
      },
    });

    const profileFn = new NodejsFunction(this, "ProfileFn", {
      entry: "lambda/game/profile.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true },
      environment: {
        ...gameEnv,
        ADMIN_GROUP_NAME,
      },
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
    });

    gameplayDs.createResolver("AwardCoinsResolver", {
      typeName: "Mutation",
      fieldName: "awardCoins",
    });

    pollsDs.createResolver("CreatePoll", {
      typeName: "Mutation",
      fieldName: "createPoll",
    });

    pollsDs.createResolver("VotePoll", {
      typeName: "Mutation",
      fieldName: "votePoll",
    });

    profileDs.createResolver("GrantBadge", {
      typeName: "Mutation",
      fieldName: "grantBadge",
    });

    profileDs.createResolver("SetDisplayName", {
      typeName: "Mutation",
      fieldName: "setDisplayName",
    });

    profileDs.createResolver("UpdateProfile", {
      typeName: "Mutation",
      fieldName: "updateProfile",
    });

    leaderboardDs.createResolver("TopXP", {
      typeName: "Query",
      fieldName: "topXP",
    });

    leaderboardDs.createResolver("TopCoins", {
      typeName: "Query",
      fieldName: "topCoins",
    });

    pollsDs.createResolver("GetPoll", {
      typeName: "Query",
      fieldName: "getPoll",
    });

    profileDs.createResolver("GetMyProfile", {
      typeName: "Query",
      fieldName: "getMyProfile",
    });

    gameEconomyDs.createResolver("GetGameEconomyConfigResolver", {
      typeName: "Query",
      fieldName: "getGameEconomyConfig",
    });

    gameEconomyDs.createResolver("UpdateGameEconomyConfigResolver", {
      typeName: "Mutation",
      fieldName: "updateGameEconomyConfig",
    });

    gameEconomyDs.createResolver("GetPrimeBankAccountResolver", {
      typeName: "Query",
      fieldName: "getPrimeBankAccount",
    });

    gameEconomyDs.createResolver("DailyLoginResolver", {
      typeName: "Mutation",
      fieldName: "dailyLogin",
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
    });

    shopThisSceneDs.createResolver("ShopThisSceneResolver", {
      typeName: "Query",
      fieldName: "shopThisScene",
    });

    linkClosetItemToProductDs.createResolver(
      "LinkClosetItemToProductResolver",
      {
        typeName: "Mutation",
        fieldName: "linkClosetItemToProduct",
      },
    );

    // ────────────────────────────────────────────────────────────
    // CREATOR / LIVESTREAM / AI / COMMERCE / CABINETS
    // ────────────────────────────────────────────────────────────
    if (livestreamFn) {
      const creatorLiveDs = this.api.addLambdaDataSource(
        "CreatorLivestreamDs",
        livestreamFn,
      );

      creatorLiveDs.createResolver("GetCreatorLivestreamInfoResolver", {
        typeName: "Query",
        fieldName: "getCreatorLivestreamInfo",
      });

      creatorLiveDs.createResolver("PinLivestreamHighlightResolver", {
        typeName: "Mutation",
        fieldName: "pinLivestreamHighlight",
      });
    }

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

    const creatorAiDs = this.api.addLambdaDataSource("CreatorAiDs", creatorToolsFn);

    creatorAiDs.createResolver("CreatorAiSuggestResolver", {
      typeName: "Mutation",
      fieldName: "creatorAiSuggest",
    });

    creatorAiDs.createResolver("CreatorCabinetsResolver", {
      typeName: "Query",
      fieldName: "creatorCabinets",
    });

    creatorAiDs.createResolver("CreatorCabinetResolver", {
      typeName: "Query",
      fieldName: "creatorCabinet",
    });

    creatorAiDs.createResolver("CreatorCabinetAssetsResolver", {
      typeName: "Query",
      fieldName: "creatorCabinetAssets",
    });

    creatorAiDs.createResolver("CreateCreatorCabinetResolver", {
      typeName: "Mutation",
      fieldName: "createCreatorCabinet",
    });

    creatorAiDs.createResolver("UpdateCreatorCabinetResolver", {
      typeName: "Mutation",
      fieldName: "updateCreatorCabinet",
    });

    creatorAiDs.createResolver("DeleteCreatorCabinetResolver", {
      typeName: "Mutation",
      fieldName: "deleteCreatorCabinet",
    });

    creatorAiDs.createResolver("CreateCreatorAssetUploadResolver", {
      typeName: "Mutation",
      fieldName: "createCreatorAssetUpload",
    });

    creatorAiDs.createResolver("CreatorCabinetFoldersResolver", {
      typeName: "Query",
      fieldName: "creatorCabinetFolders",
    });

    creatorAiDs.createResolver("CreateCreatorFolderResolver", {
      typeName: "Mutation",
      fieldName: "createCreatorFolder",
    });

    creatorAiDs.createResolver("RenameCreatorFolderResolver", {
      typeName: "Mutation",
      fieldName: "renameCreatorFolder",
    });

    creatorAiDs.createResolver("DeleteCreatorFolderResolver", {
      typeName: "Mutation",
      fieldName: "deleteCreatorFolder",
    });

    creatorAiDs.createResolver("UpdateCreatorAssetResolver", {
      typeName: "Mutation",
      fieldName: "updateCreatorAsset",
    });

    creatorAiDs.createResolver("DeleteCreatorAssetResolver", {
      typeName: "Mutation",
      fieldName: "deleteCreatorAsset",
    });

    creatorAiDs.createResolver("MoveCreatorAssetResolver", {
      typeName: "Mutation",
      fieldName: "moveCreatorAsset",
    });

    // ────────────────────────────────────────────────────────────
    // OUTPUTS
    // ────────────────────────────────────────────────────────────
    new CfnOutput(this, "GraphQlApiUrl", { value: this.api.graphqlUrl });
    new CfnOutput(this, "GraphQlApiId", { value: this.api.apiId });
    new CfnOutput(this, "CreatorMediaBucketName", {
      value: creatorMediaBucket.bucketName,
    });
  }
}

