// lib/admin-stack.ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as events from "aws-cdk-lib/aws-events";
import * as sns from "aws-cdk-lib/aws-sns";
import * as path from "path";

export interface AdminStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
  uploadsBucket: s3.IBucket;
  userPool: cognito.IUserPool;
  webOrigin: string;
  analyticsBucket?: s3.IBucket;
}

/**
 * AdminStack
 *
 * - Moderation API (approve/reject uploads, bios, comments, bg changes, affiliate links)
 * - Community tools (challenges, polls, games)
 * - Shoutouts / targeted invites (SNS)
 * - Admin analytics entrypoint (XP / coins / retention / livestream engagement)
 *
 * All Lambdas are intended to be invoked via AppSync with Cognito User Pool auth
 * and must check the `cognito:groups` claim contains "admin".
 */
export class AdminStack extends cdk.Stack {
  public readonly moderationFn: lambdaNode.NodejsFunction;
  public readonly communityFn: lambdaNode.NodejsFunction;
  public readonly shoutoutsFn: lambdaNode.NodejsFunction;
  public readonly analyticsFn: lambdaNode.NodejsFunction;

  constructor(scope: Construct, id: string, props: AdminStackProps) {
    super(scope, id, props);

    const { table, uploadsBucket, userPool, webOrigin, analyticsBucket } = props;
    const envName = this.node.tryGetContext("env") ?? "dev";

    const BASE_ENV = {
      TABLE_NAME: table.tableName,
      UPLOADS_BUCKET: uploadsBucket.bucketName,
      ANALYTICS_BUCKET: analyticsBucket?.bucketName ?? "",
      USER_POOL_ID: userPool.userPoolId,
      ADMIN_GROUP_NAME: "ADMIN", // match Cognito group name
      WEB_ORIGIN: webOrigin,
      ENV_NAME: envName,
      NODE_OPTIONS: "--enable-source-maps",
    };

    // ─────────────────────────────────────────────
    // 1) Moderation Lambda
    //    - listPending
    //    - approve / reject closet uploads, bios, comments, bg changes, affiliate links
    // ─────────────────────────────────────────────
    this.moderationFn = new lambdaNode.NodejsFunction(this, "AdminModerationFn", {
      entry: path.join(process.cwd(), "lambda/admin/moderation.ts"),
      bundling: {
        format: lambdaNode.OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: {
        ...BASE_ENV,
      },
    });

    table.grantReadWriteData(this.moderationFn);
    uploadsBucket.grantRead(this.moderationFn);

    // ─────────────────────────────────────────────
    // 2) Community / Event tools Lambda
    //    - create challenges / polls / games
    //    - write definitions to DynamoDB
    //    - emit events to EventBridge for fan-out
    // ─────────────────────────────────────────────
    this.communityFn = new lambdaNode.NodejsFunction(this, "AdminCommunityFn", {
      entry: path.join(process.cwd(), "lambda/admin/community-tools.ts"),
      bundling: {
        format: lambdaNode.OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: {
        ...BASE_ENV,
        ADMIN_EVENT_SOURCE: "stylingadventures.admin",
      },
    });

    table.grantReadWriteData(this.communityFn);

    const adminBus = new events.EventBus(this, "AdminEventsBus", {
      eventBusName: `sa-${envName}-admin`,
    });

    adminBus.grantPutEventsTo(this.communityFn);

    // (Other stacks can subscribe to this bus; we just define it here.)

    // ─────────────────────────────────────────────
    // 3) Shoutouts & Targeted Invites
    //    - SNS for email / SMS / mobile push subscribers
    // ─────────────────────────────────────────────
    const shoutoutsTopic = new sns.Topic(this, "AdminShoutoutsTopic", {
      displayName: "StylingAdventures Admin Shoutouts",
    });

    this.shoutoutsFn = new lambdaNode.NodejsFunction(this, "AdminShoutoutsFn", {
      entry: path.join(process.cwd(), "lambda/admin/shoutouts.ts"),
      bundling: {
        format: lambdaNode.OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: {
        ...BASE_ENV,
        SHOUTOUTS_TOPIC_ARN: shoutoutsTopic.topicArn,
      },
    });

    shoutoutsTopic.grantPublish(this.shoutoutsFn);

    // ─────────────────────────────────────────────
    // 4) Admin Analytics Query Lambda
    //    - read-only views over analytics data
    //    - XP, coins, retention, livestream engagement
    // ─────────────────────────────────────────────
    this.analyticsFn = new lambdaNode.NodejsFunction(this, "AdminAnalyticsFn", {
      entry: path.join(process.cwd(), "lambda/admin/analytics.ts"),
      bundling: {
        format: lambdaNode.OutputFormat.CJS,
        minify: true,
        sourceMap: true,
      },
      environment: {
        ...BASE_ENV,
      },
    });

    table.grantReadData(this.analyticsFn);
    if (analyticsBucket) {
      analyticsBucket.grantRead(this.analyticsFn);
    }

    // Tag all admin lambdas to make them easy to find / audit
    [this.moderationFn, this.communityFn, this.shoutoutsFn, this.analyticsFn].forEach(
      (fn) => {
        cdk.Tags.of(fn).add("Access", "Admin");
        cdk.Tags.of(fn).add("App", "stylingadventures");
        cdk.Tags.of(fn).add("Scope", "Admin");
      },
    );
  }
}
