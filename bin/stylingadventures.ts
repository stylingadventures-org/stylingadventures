#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { DatabaseStack } from "../lib/database-stack";
import { IdentityStack } from "../lib/identity-stack";
import { UploadsStack } from "../lib/uploads-stack";
import { ApiStack } from "../lib/api-stack";
import { WorkflowsStack } from "../lib/workflows-stack";
import { WebStack } from "../lib/web-stack";

const app = new cdk.App();

// Read environment (dev or prod)
const envName =
  process.env.ENVIRONMENT ||
  app.node.tryGetContext("env") ||
  "dev";

const isProd = envName === "prod";

// Your AWS account & region
const account = "637423256673";
const region = "us-east-1";

const env = { account, region };

// Common tags
const baseTags: Record<string, string> = {
  project: "stylingadventures",
  environment: envName,
};

function tag(stack: cdk.Stack, stackName: string) {
  cdk.Tags.of(stack).add("stack", stackName);
  Object.entries(baseTags).forEach(([k, v]) => cdk.Tags.of(stack).add(k, v));
}

// 1. Database
const db = new DatabaseStack(app, `SA-Database-${envName}`, {
  env,
});
tag(db, "database");

// 2. Web (CloudFront / static site)
// Exposes webOrigin, cloudFrontOrigin, webBucketName for other stacks.
const web = new WebStack(app, `SA-Web-${envName}`, {
  env,
  envName,
  domainName: isProd ? "stylingadventures.com" : undefined,
  hostedZoneDomain: isProd ? "stylingadventures.com" : undefined,
});
tag(web, "web");

// 3. Identity (Cognito), wired to webOrigin for OAuth callback/logout URLs
const identity = new IdentityStack(app, `SA-Identity-${envName}`, {
  env,
  envName,
  cognitoDomainPrefix: `sa-${envName}-style2`,
  webOrigin: web.webOrigin,
});
tag(identity, "identity");

// 4. Uploads – S3 uploads bucket + any presign/related config
const uploads = new UploadsStack(app, `SA-Uploads-${envName}`, {
  env,
  userPool: identity.userPool,
  webOrigin: web.webOrigin,
  cloudFrontOrigin: web.cloudFrontOrigin,
  webBucketName: web.webBucketName,
  table: db.table,
});
tag(uploads, "uploads");

// 5. Workflows – Step Functions state machines
const workflows = new WorkflowsStack(app, `SA-Workflows-${envName}`, {
  env,
  table: db.table,
});
tag(workflows, "workflows");

// 6. API – AppSync + Lambdas, wired to specific state machines
const api = new ApiStack(app, `SA-API-${envName}`, {
  env,
  table: db.table,
  userPool: identity.userPool,
  closetApprovalSm: workflows.closetApprovalSm,
  backgroundChangeSm: workflows.backgroundChangeSm,
  storyPublishSm: workflows.storyPublishSm,
});
tag(api, "api");
