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
      tableName: `sa-${envName}-app`, // e.g. sa-dev-app
      partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
      sortKey:      { name: 'sk', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy:
        envName === 'prd' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI #1 — by owner (used for myCloset)
    this.table.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsi1pk', type: ddb.AttributeType.STRING }, // OWNER#{sub}
      sortKey:      { name: 'gsi1sk', type: ddb.AttributeType.STRING }, // ISO time
      projectionType: ddb.ProjectionType.ALL,
    });

    // GSI #2 — by status (used for moderation queue)
    this.table.addGlobalSecondaryIndex({
      indexName: 'gsi2',
      partitionKey: { name: 'gsi2pk', type: ddb.AttributeType.STRING }, // STATUS#PENDING / #DRAFT / ...
      sortKey:      { name: 'gsi2sk', type: ddb.AttributeType.STRING }, // ISO time
      projectionType: ddb.ProjectionType.ALL,
    });
  }
}

// 1) Identity (Cognito)
const identity = new IdentityStack(app, 'IdentityStack', {
  env,
  description: `Cognito (user pool, app client, hosted UI, identity pool) - ${envName}`,
});

// 2) Data (DynamoDB)
const data = new DataStack(app, 'DataStack', {
  env,
  description: `Primary application table - ${envName}`,
});

// 3) Workflows (Step Functions) – uses the table
const wf = new WorkflowsStack(app, 'WorkflowsStack', {
  env,
  table: data.table,
  description: `Closet approval workflow - ${envName}`,
});

// 4) AppSync API – needs user pool, table, and the approval state machine
new ApiStack(app, 'ApiStack', {
  env,
  userPool: identity.userPool,
  table: data.table,
  closetApprovalSm: wf.closetApprovalSm,
  description: `AppSync GraphQL API - ${envName}`,
});

// 5) Uploads API + thumbs CDN (optional; keep if you use it)
const webOrigin =
  cfg.webOrigin ||
  process.env.WEB_ORIGIN ||
  'http://localhost:5173';

new UploadsStack(app, 'UploadsStack', {
  env,
  userPool: identity.userPool,
  webOrigin,
  description: `Uploads API, S3, SQS worker, thumbs CDN - ${envName}`,
});

// 6) Static web
new WebStack(app, 'WebStack', {
  env,
  description: `Static web hosting (S3 + CloudFront) - ${envName}`,
});

// Tags
cdk.Tags.of(app).add('App', 'stylingadventures');
cdk.Tags.of(app).add('Env', envName);
