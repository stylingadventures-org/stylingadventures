// bin/stylingadventures.ts
import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';

import { IdentityStack } from '../lib/stacks/identity-stack';
import { WorkflowsStack } from '../lib/stacks/workflows-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { UploadsStack } from '../lib/stacks/uploads-stack';
import { WebStack } from '../lib/stacks/web-stack';

// ---- tiny config loader (optional) ----
type Cfg = { webOrigin?: string };
function loadConfig(): Cfg {
  try {
    const p = path.resolve(process.cwd(), 'config.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')) as Cfg;
  } catch {}
  return {};
}

const app = new cdk.App();
const envName = app.node.tryGetContext('env') ?? 'dev';
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};
const cfg = loadConfig();

// ---- Data stack (holds the app table) ----
class DataStack extends cdk.Stack {
  public readonly table: ddb.Table;
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.table = new ddb.Table(this, 'AppTable', {
      tableName: `sa-${envName}-app`,
      partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
      sortKey: { name: 'sk', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy:
        envName === 'prd' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    this.table.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsi1pk', type: ddb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });

    this.table.addGlobalSecondaryIndex({
      indexName: 'gsi2',
      partitionKey: { name: 'gsi2pk', type: ddb.AttributeType.STRING },
      sortKey: { name: 'gsi2sk', type: ddb.AttributeType.STRING },
      projectionType: ddb.ProjectionType.ALL,
    });
  }
}

// 1) Web hosting FIRST so we know the final CloudFront origin (still useful for other stacks)
const web = new WebStack(app, 'WebStack', {
  env,
  description: `Static web hosting (S3 + CloudFront) - ${envName}`,
});
const cloudFrontOrigin = `https://${web.distribution.domainName}`;

// Prefer config.json WEB_ORIGIN if you have a custom domain wired; otherwise use CF
const webOrigin = (cfg.webOrigin || process.env.WEB_ORIGIN || cloudFrontOrigin).replace(/\/+$/,'');

// 2) Identity (Cognito) — receives webOrigin for callback/logout URLs
const identity = new IdentityStack(app, 'IdentityStack', {
  env,
  webOrigin,
  description: `Cognito (user pool, app client, hosted UI, identity pool) - ${envName}`,
});

// 3) Data (DynamoDB)
const data = new DataStack(app, 'DataStack', {
  env,
  description: `Primary application table - ${envName}`,
});

// 4) Workflows (Step Functions)
const wf = new WorkflowsStack(app, 'WorkflowsStack', {
  env,
  table: data.table,
  description: `Closet approval workflow - ${envName}`,
});

// 5) AppSync API
const api = new ApiStack(app, 'ApiStack', {
  env,
  userPool: identity.userPool,
  table: data.table,
  closetApprovalSm: wf.closetApprovalSm,
  description: `AppSync GraphQL API - ${envName}`,
});

// 6) Uploads API + thumbs CDN
// Pull this from your WebStack output, which you posted as:
// WebStack.StaticSiteBucketName = webstack-staticsitebucket8958ee3f-x6o1ifgoyjt1
const webBucketName = 'webstack-staticsitebucket8958ee3f-x6o1ifgoyjt1';
const thumbsOrigin = 'https://d1so4qr6zsby5r.cloudfront.net';

new UploadsStack(app, 'UploadsStack', {
  env,
  userPool: identity.userPool,
  webOrigin: thumbsOrigin,
  cloudFrontOrigin: thumbsOrigin,
  webBucketName, // <-- NEW (required)
  description: `Uploads API, S3, and thumbs CDN - ${envName}`,
});

// ---- Tags ----
cdk.Tags.of(app).add('App', 'stylingadventures');
cdk.Tags.of(app).add('Env', envName);
