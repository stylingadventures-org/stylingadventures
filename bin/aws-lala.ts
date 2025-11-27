import "dotenv/config"; // load .env into process.env
import "source-map-support/register";
import * as fs from "fs";
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as ddb from "aws-cdk-lib/aws-dynamodb";

import { IdentityStack } from "../lib/identity-stack";
import { WorkflowsStack } from "../lib/workflows-stack";
import { ApiStack } from "../lib/api-stack";
import { UploadsStack } from "../lib/uploads-stack";
import { WebStack } from "../lib/web-stack";

// 👇 Besties stacks
import { BestiesClosetStack } from "../lib/besties-closet-stack";
import { BestiesStoriesStack } from "../lib/besties-stories-stack";
import { BestiesEngagementStack } from "../lib/besties-engagement-stack";

// ---- tiny config loader (optional) ----
type Cfg = { webOrigin?: string };
function loadConfig(): Cfg {
  try {
    const p = path.resolve(process.cwd(), "config.json");
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8")) as Cfg;
    }
  } catch {
    // ignore
  }
  return {};
}

const app = new cdk.App();
const envName = app.node.tryGetContext("env") ?? "dev";
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};
const cfg = loadConfig();

// ---- Data stack (holds the app table) ----
class DataStack extends cdk.Stack {
  public readonly table: ddb.Table;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.table = new ddb.Table(this, "AppTable", {
      tableName: `sa-${envName}-app`,
      partitionKey: { name: "pk", type: ddb.AttributeType.STRING },
      sortKey: { name: "sk", type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy:
        envName === "prd"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: ddb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "gsi2pk", type: ddb.AttributeType.STRING },
      sortKey: { name: "gsi2sk", type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    // GSI for looking up items by rawMediaKey (background-removal pipeline)
    this.table.addGlobalSecondaryIndex({
      indexName: "rawMediaKeyIndex",
      partitionKey: {
        name: "rawMediaKey",
        type: ddb.AttributeType.STRING,
      },
      projectionType: ddb.ProjectionType.ALL,
    });
  }
}

// 1) Web hosting FIRST so we know the final CloudFront origin
const web = new WebStack(app, "WebStack", {
  env,
  description: `Static web hosting (S3 + CloudFront) - ${envName}`,
});
const cloudFrontOrigin = `https://${web.distribution.domainName}`;

// Prefer config.json WEB_ORIGIN if you have a custom domain wired; otherwise use CF
const webOrigin = (
  cfg.webOrigin ||
  process.env.WEB_ORIGIN ||
  cloudFrontOrigin
).replace(/\/+$/, "");

// 2) Identity (Cognito) — receives webOrigin for callback/logout URLs
const identity = new IdentityStack(app, "IdentityStack", {
  env,
  webOrigin,
  description: `Cognito (user pool, app client, hosted UI, identity pool) - ${envName}`,
});

// 3) Data (DynamoDB)
const data = new DataStack(app, "DataStack", {
  env,
  description: `Primary application table - ${envName}`,
});

// 4) Core Workflows (Fan/Fleet closet approvals)
const workflows = new WorkflowsStack(app, "WorkflowsStack", {
  env,
  table: data.table,
  description: `Closet approval workflow - ${envName}`,
});

// 5) Uploads API + thumbs CDN
// NOTE: these two values are from your deployed WebStack / infra;
// if you later output them from WebStack directly, you can replace them.
const webBucketName = "webstack-staticsitebucket8958ee3f-x6o1ifgoyjt1";
const uploadsCdnDomain = "d1so4qr6zsby5r.cloudfront.net";
const uploadsOrigin = `https://${uploadsCdnDomain}`;

const uploads = new UploadsStack(app, "UploadsStack", {
  env,
  userPool: identity.userPool,
  // Origin that the browser JS runs on (your SPA)
  webOrigin,
  // Origin that serves thumbs / uploads CDN
  cloudFrontOrigin: uploadsOrigin,
  webBucketName,
  table: data.table, // let bg-worker update closet items
  description: `Uploads API, S3, and thumbs CDN - ${envName}`,
});
const uploadsBucket = uploads.bucket;

// 6) Besties – closet + background change approvals
const bestiesCloset = new BestiesClosetStack(app, "BestiesClosetStack", {
  env,
  table: data.table,
  uploadsBucket,
  description: `Besties closet + background change workflows - ${envName}`,
});

// 7) Besties – stories compose/publish/schedule
const bestiesStories = new BestiesStoriesStack(app, "BestiesStoriesStack", {
  env,
  table: data.table,
  description: `Besties stories compose/publish/schedule workflows - ${envName}`,
});

// 8) Besties – engagement (likes/wishlist/comments/metrics fan-out)
const bestiesEngagement = new BestiesEngagementStack(
  app,
  "BestiesEngagementStack",
  {
    env,
    table: data.table,
    description: `Besties engagement fan-out workflows - ${envName}`,
  },
);

// 9) AppSync API – wire all workflows
const api = new ApiStack(app, "ApiStack", {
  env,
  userPool: identity.userPool,
  table: data.table,

  // Existing closet approval SM (fan + bestie)
  closetApprovalSm: workflows.closetApprovalSm,

  // 👇 NEW Besties workflows
  backgroundChangeSm: bestiesCloset.backgroundChangeStateMachine,
  storyPublishSm: bestiesStories.storyPublishStateMachine,

  description: `AppSync GraphQL API - ${envName}`,
});

// ---- Tags ----
cdk.Tags.of(app).add("App", "stylingadventures");
cdk.Tags.of(app).add("Env", envName);
