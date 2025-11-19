import * as path from "path";
import { Stack, StackProps, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as iam from "aws-cdk-lib/aws-iam";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface ApiStackProps extends StackProps {
  userPool: cognito.IUserPool;
  table: dynamodb.ITable;
  closetApprovalSm: sfn.IStateMachine;
}

export class ApiStack extends Stack {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userPool, table, closetApprovalSm } = props;

    // ────────────────────────────────────────────────────────────
    // GRAPHQL API
    // ────────────────────────────────────────────────────────────
    this.api = new appsync.GraphqlApi(this, "StylingApi", {
      name: "stylingadventures-api",
      definition: appsync.Definition.fromFile(
        path.join(process.cwd(), "lib/stacks/schema.graphql"),
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
    // SIMPLE HELLO TEST ENDPOINT
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
    // USER ROLES
    // ────────────────────────────────────────────────────────────
    const rolesFn = new NodejsFunction(this, "RolesFn", {
      entry: "lambda/roles/index.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        TABLE_NAME: table.tableName,
        PK_NAME: "pk",
        SK_NAME: "sk",
      },
    });

    table.grantReadWriteData(rolesFn);

    const rolesDs = this.api.addLambdaDataSource("RolesDs", rolesFn);

    rolesDs.createResolver("SetUserRole", {
      typeName: "Mutation",
      fieldName: "setUserRole",
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
      requestMappingTemplate: appsync.MappingTemplate.fromString(`{
        "version": "2017-02-28"
      }`),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson({
          "id": $ctx.identity.sub,
          "email": $util.defaultIfNull($ctx.identity.claims.email, ""),
          "role": "FAN",
          "tier": "FREE"
        })
      `),
    });

    // ────────────────────────────────────────────────────────────
    // CLOSET RESOLVER (FAN-OWNED CLOSET + APPROVAL REQUEST)
    // ────────────────────────────────────────────────────────────
    const closetFn = new NodejsFunction(this, "ClosetResolverFn", {
      entry: "lambda/graphql/index.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        TABLE_NAME: table.tableName,
        APPROVAL_SM_ARN: closetApprovalSm.stateMachineArn,
        STATUS_GSI: "gsi1",
      },
    });

    table.grantReadWriteData(closetFn);
    closetApprovalSm.grantStartExecution(closetFn);

    const closetDs = this.api.addLambdaDataSource("ClosetDs", closetFn);

    closetDs.createResolver("MyCloset", {
      typeName: "Query",
      fieldName: "myCloset",
    });

    // closetFeed comes from ClosetAdminFn (see below), not from this Lambda.

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

    // ────────────────────────────────────────────────────────────
    // CLOSET ADMIN (moderation + public feed + admin library)
    // ────────────────────────────────────────────────────────────
    const closetAdminFn = new NodejsFunction(this, "ClosetAdminFn", {
      entry: "lambda/closet/admin.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        TABLE_NAME: table.tableName,
        STATUS_GSI: "gsi1",
        APPROVAL_SM_ARN: closetApprovalSm.stateMachineArn,
      },
      timeout: Duration.seconds(10),
      memorySize: 512,
    });

    table.grantReadWriteData(closetAdminFn);

    // DynamoDB access (query/scan/update)
    closetAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
        ],
        resources: [table.tableArn, `${table.tableArn}/index/*`],
      }),
    );

    // Step Functions callbacks for human approval (SendTaskSuccess/Failure)
    closetAdminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["states:SendTaskSuccess", "states:SendTaskFailure"],
        resources: ["*"], // task token APIs require "*" in most patterns
      }),
    );

    const closetAdminSource = this.api.addLambdaDataSource(
      "ClosetAdminSource",
      closetAdminFn,
    );

    // Admin moderation queue
    closetAdminSource.createResolver("AdminListPendingResolver", {
      typeName: "Query",
      fieldName: "adminListPending",
    });

    // NEW: Admin library / Closet library page
    closetAdminSource.createResolver("AdminListClosetItemsResolver", {
      typeName: "Query",
      fieldName: "adminListClosetItems",
    });

    // Fan-facing + Bestie-facing closet feed (NEWEST / MOST_LOVED)
    closetAdminSource.createResolver("ClosetFeedResolver", {
      typeName: "Query",
      fieldName: "closetFeed",
    });

    // Small leaderboard snippet for “Top looks”
    closetAdminSource.createResolver("TopClosetLooksResolver", {
      typeName: "Query",
      fieldName: "topClosetLooks",
    });

    // NEW: admin create
    closetAdminSource.createResolver("AdminCreateClosetItemResolver", {
      typeName: "Mutation",
      fieldName: "adminCreateClosetItem",
    });

    // Moderation mutations
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

    // ────────────────────────────────────────────────────────────
    // BESTIE / TIER RESOLVERS
    // ────────────────────────────────────────────────────────────
    const bestieFn = new NodejsFunction(this, "BestieFn", {
      entry: "lambda/bestie/index.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        TABLE_NAME: table.tableName,
        USER_POOL_ID: userPool.userPoolId,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
        STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID ?? "",
        BASE_SUCCESS_URL:
          process.env.BASE_SUCCESS_URL ?? "http://localhost:5173",
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

    // Queries
    bestieDs.createResolver("MeBestieStatusResolver", {
      typeName: "Query",
      fieldName: "meBestieStatus",
    });

    // Mutations
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
    // EPISODE GATE (EARLY ACCESS)
    // ────────────────────────────────────────────────────────────
    const episodesGateFn = new NodejsFunction(this, "EpisodesGateFn", {
      entry: "lambda/episodes/gate.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true, sourceMap: true },
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadData(episodesGateFn);

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

    // ────────────────────────────────────────────────────────────
    // GAME RESOLVERS
    // ────────────────────────────────────────────────────────────
    const gameEnv = {
      TABLE_NAME: table.tableName,
    };

    const gameplayFn = new NodejsFunction(this, "GameplayFn", {
      entry: "lambda/game/gameplay.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true },
      environment: gameEnv,
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
      environment: gameEnv,
    });

    const profileFn = new NodejsFunction(this, "ProfileFn", {
      entry: "lambda/game/profile.ts",
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { format: OutputFormat.CJS, minify: true },
      environment: gameEnv,
    });

    table.grantReadWriteData(gameplayFn);
    table.grantReadData(leaderboardFn);
    table.grantReadWriteData(pollsFn);
    table.grantReadWriteData(profileFn);

    const gameplayDS = this.api.addLambdaDataSource("GameplayDS", gameplayFn);
    const leaderboardDs = this.api.addLambdaDataSource(
      "LeaderboardDs",
      leaderboardFn,
    );
    const pollsDs = this.api.addLambdaDataSource("PollsDs", pollsFn);
    const profileDs = this.api.addLambdaDataSource("ProfileDs", profileFn);

    gameplayDS.createResolver("LogGameEventResolver", {
      typeName: "Mutation",
      fieldName: "logGameEvent",
    });

    gameplayDS.createResolver("AwardCoinsResolver", {
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

    // ────────────────────────────────────────────────────────────
    // OUTPUTS
    // ────────────────────────────────────────────────────────────
    new CfnOutput(this, "GraphQlApiUrl", { value: this.api.graphqlUrl });
    new CfnOutput(this, "GraphQlApiId", { value: this.api.apiId });
  }
}
