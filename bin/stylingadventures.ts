#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { DatabaseStack } from "../lib/stacks/DatabaseStack";
import { IdentityStack } from "../lib/stacks/IdentityStack";
import { UploadsStack } from "../lib/stacks/UploadsStack";
import { ApiStack } from "../lib/stacks/ApiStack";
import { WorkflowsStack } from "../lib/stacks/WorkflowsStack";
import { WebStack } from "../lib/stacks/WebStack";

const app = new cdk.App();

// Read environment (dev or prod)
const envName =
  process.env.ENVIRONMENT ||
  app.node.tryGetContext("env") ||
  "dev";

const isProd = envName === "prod";

// Your AWS account
const account = "637423256673";

// Region
const region = "us-east-1";

// Tags
const baseTags = {
  project: "stylingadventures",
  environment: envName,
};

// ─────────────────────────────────────────
// 1. Database
// ─────────────────────────────────────────
const db = new DatabaseStack(app, `SA-Database-${envName}`, {
  env: { account, region },
});
cdk.Tags.of(db).add("stack", "database");
Object.entries(baseTags).forEach(([k, v]) => cdk.Tags.of(db).add(k, v));

// ─────────────────────────────────────────
// 2. Identity / Cognito
// ─────────────────────────────────────────
const identity = new IdentityStack(app, `SA-Identity-${envName}`, {
  env: { account, region },
  envName,
  cognitoDomainPrefix: `sa-${envName}-637423256673`,
});
cdk.Tags.of(identity).add("stack", "identity");
Object.entries(baseTags).forEach(([k, v]) => cdk.Tags.of(identity).add(k, v));

// ─────────────────────────────────────────
// 3. Uploads + signed upload API
// ─────────────────────────────────────────
const uploads = new UploadsStack(app, `SA-Uploads-${envName}`, {
  env: { account, region },
  userPool: identity.userPool,
});
cdk.Tags.of(uploads).add("stack", "uploads");
Object.entries(baseTags).forEach(([k, v]) => cdk.Tags.of(uploads).add(k, v));

// ─────────────────────────────────────────
// 4. Workflows (Step Functions + EventBridge)
// ─────────────────────────────────────────
const workflows = new WorkflowsStack(app, `SA-Workflows-${envName}`, {
  env: { account, region },
  table: db.table,
});
cdk.Tags.of(workflows).add("stack", "workflows");
Object.entries(baseTags).forEach(([k, v]) => cdk.Tags.of(workflows).add(k, v));

// ─────────────────────────────────────────
// 5. API (AppSync)
// ─────────────────────────────────────────
const api = new ApiStack(app, `SA-API-${envName}`, {
  env: { account, region },
  table: db.table,
  userPool: identity.userPool,
  identityPool: identity.identityPool,
  workflows,
});
cdk.Tags.of(api).add("stack", "api");
Object.entries(baseTags).forEach(([k, v]) => cdk.Tags.of(api).add(k, v));

// ─────────────────────────────────────────
// 6. Frontend Hosting (CloudFront + S3)
// ─────────────────────────────────────────
// Option C behavior:
// dev → default CloudFront domain
// prod → custom domain stylingadventures.com
const web = new WebStack(app, `SA-Web-${envName}`, {
  env: { account, region },
  envName,
  domainName: isProd ? "stylingadventures.com" : undefined,
  hostedZoneDomain: isProd ? "stylingadventures.com" : undefined,
});
cdk.Tags.of(web).add("stack", "web");
Object.entries(baseTags).forEach(([k, v]) => cdk.Tags.of(web).add(k, v));

