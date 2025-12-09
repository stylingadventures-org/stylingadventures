import "dotenv/config";
import "source-map-support/register";
import * as fs from "fs";
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as ddb from "aws-cdk-lib/aws-dynamodb";

// ⬇️ IMPORTANT: use IdentityV2Stack, NOT IdentityStack
import { IdentityV2Stack } from "../lib/identity-v2-stack";
import { WorkflowsV2Stack } from "../lib/workflows-v2-stack";
import { ApiStack } from "../lib/api-stack";
import { UploadsStack } from "../lib/uploads-stack";
import { WebStack } from "../lib/web-stack";

// Besties stacks
import { BestiesClosetStack } from "../lib/besties-closet-stack";
import { BestiesStoriesStack } from "../lib/besties-stories-stack";
import { BestiesEngagementStack } from "../lib/besties-engagement-stack";

// Creator / Pro stacks
import { LivestreamStack } from "../lib/livestream-stack";
import { CreatorToolsStack } from "../lib/creator-tools-stack";
import { CommerceStack } from "../lib/commerce-stack";
import { AnalyticsStack } from "../lib/analytics-stack";

// Collaborator / Promo stacks
import { CollaboratorStack } from "../lib/collaborator-stack";
import { PromoKitStack } from "../lib/promo-kit-stack";

// Admin stack
import { AdminStack } from "../lib/admin-stack";

// 🆕 Prime Studios / Layout / Publishing stacks
import { LayoutEngineStack } from "../lib/layout-engine-stack";
import { PrimeStudiosStack } from "../lib/prime-studios-stack";
import { PublishingStack } from "../lib/publishing-stack";

// ---- tiny config loader ----
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

// 1) Web hosting FIRST so we know the final CloudFront origin / bucket
const web = new WebStack(app, "WebStack", {
  env,
  envName,
  description: `Static web hosting (S3 + CloudFront) - ${envName}`,
});

const webOrigin = (
  cfg.webOrigin ||
  process.env.WEB_ORIGIN ||
  web.webOrigin
).replace(/\/+$/, "");

const webBucketName = web.webBucketName;
const webCloudFrontOrigin = web.cloudFrontOrigin;

// 2) Data (DynamoDB) — MUST be before IdentityV2Stack so we can pass appTable
const data = new DataStack(app, "DataStack", {
  env,
  description: `Primary application table - ${envName}`,
});

// 3) ✅ Identity v2 (Cognito) — uses appTable for tier sync / triggers
const identity = new IdentityV2Stack(app, "IdentityV2Stack", {
  env,
  envName,
  webOrigin,
  appTable: data.table,
  cognitoDomainPrefix: `sa2-${envName}-${env.account ?? "local"}`,
  description: `Cognito v2 (user pool, app client, groups) - ${envName}`,
});

// 4) Core Workflows (approval / background / story publish / Social Pulse)
const workflows = new WorkflowsV2Stack(app, "WorkflowsV2Stack", {
  env,
  table: data.table,
  description: `Closet, story, and creator workflow state machines - ${envName}`,
});

// 5) Uploads API
const uploads = new UploadsStack(app, "UploadsStack", {
  env,
  userPool: identity.userPool,
  webOrigin,
  cloudFrontOrigin: webCloudFrontOrigin,
  webBucketName,
  table: data.table,
  description: `Uploads API, S3, and thumbs CDN - ${envName}`,
});

const uploadsBucket = uploads.uploadsBucket;

// 6) Besties – closet + background change approvals
const bestiesCloset = new BestiesClosetStack(app, "BestiesClosetStack", {
  env,
  table: data.table,
  uploadsBucket,
  description: `Besties closet + background change workflows - ${envName}`,
});

// 7) Besties – stories
const bestiesStories = new BestiesStoriesStack(app, "BestiesStoriesStack", {
  env,
  table: data.table,
  description: `Besties stories compose/publish/schedule workflows - ${envName}`,
});

// 8) Besties – engagement
const bestiesEngagement = new BestiesEngagementStack(
  app,
  "BestiesEngagementStack",
  {
    env,
    table: data.table,
    description: `Besties engagement fan-out workflows - ${envName}`,
  },
);

// 9) Pro Creators — livestream infra
const livestream = new LivestreamStack(app, "LivestreamStack", {
  env,
  envName,
  table: data.table,
  description: `Creator livestream infra - ${envName}`,
});

// 10) Pro Creators — scheduling + AI helpers (separate infra stack, still used elsewhere)
const creatorTools = new CreatorToolsStack(app, "CreatorToolsStack", {
  env,
  envName,
  table: data.table,
  // still using BestiesStories for now; Prime Studios can hook in later if desired
  storyPublishStateMachine: bestiesStories.storyPublishStateMachine,
  // NEW: Social Pulse Express state machine from WorkflowsV2
  socialPulseStateMachine: workflows.socialPulseStateMachine,
  description: `Creator scheduling + AI helpers - ${envName}`,
});

// 11) Commerce
const commerce = new CommerceStack(app, "CommerceStack", {
  env,
  envName,
  table: data.table,
  userPool: identity.userPool,
  description: `Commerce + monetisation - ${envName}`,
});

// 12) Analytics
const analytics = new AnalyticsStack(app, "AnalyticsStack", {
  env,
  envName,
  table: data.table,
  description: `Analytics + metrics export - ${envName}`,
});

// 13) Layout Engine — positioning + accessibility validation
const layoutEngine = new LayoutEngineStack(app, "LayoutEngineStack", {
  env,
  envName,
  description: `Layout templates + accessibility validation - ${envName}`,
});

// 14) Prime Studios — episode production + support systems
const primeStudios = new PrimeStudiosStack(app, "PrimeStudiosStack", {
  env,
  envName,
  table: data.table,
  userPool: identity.userPool,
  layoutValidatorFn: layoutEngine.layoutValidatorFn,
  description: `Prime Studios episode production + support systems - ${envName}`,
});

// 15) Publishing — episode publishing pipeline
const publishing = new PublishingStack(app, "PublishingStack", {
  env,
  envName,
  table: data.table,
  layoutValidatorFn: layoutEngine.layoutValidatorFn,
  description: `Prime Studios episode publishing pipeline - ${envName}`,
});

// 16) Collaborators
const collaborators = new CollaboratorStack(app, "CollaboratorStack", {
  env,
  table: data.table,
  uploadsBucket,
  userPool: identity.userPool,
  webOrigin,
  description: `Collaborator portal (invites, uploads, reminders) - ${envName}`,
});

// 17) Promo kits
const promoKit = new PromoKitStack(app, "PromoKitStack", {
  env,
  table: data.table,
  uploadsBucket,
  userPool: identity.userPool,
  collabEventBus: collaborators.collabEventBus,
  webOrigin,
  description: `Promo kit generation + wall of slay - ${envName}`,
});

// 18) Admin
const admin = new AdminStack(app, "AdminStack", {
  env,
  table: data.table,
  uploadsBucket,
  userPool: identity.userPool,
  webOrigin,
  analyticsBucket: analytics.analyticsBucket,
  description: `Platform admin tools (moderation, events, shoutouts, analytics) - ${envName}`,
});

// 19) AppSync API
const api = new ApiStack(app, "ApiStack", {
  env,
  userPool: identity.userPool,
  table: data.table,

  // Use the real Besties closet approval workflow
  closetApprovalSm: bestiesCloset.closetUploadStateMachine,
  backgroundChangeSm: bestiesCloset.backgroundChangeStateMachine,
  storyPublishSm: bestiesStories.storyPublishStateMachine,

  livestreamFn: livestream.livestreamFn,
  // creatorAiFn removed – CreatorTools Lambda now lives inside ApiStack
  commerceFn: commerce.commerceFn,

  adminModerationFn: admin.moderationFn,
});

// ---- Tags ----
cdk.Tags.of(app).add("App", "stylingadventures");
cdk.Tags.of(app).add("Env", envName);
