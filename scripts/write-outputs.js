"use strict";

const fs = require("fs");
const path = require("path");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function pick(obj, key, fallback = null) {
  return obj && obj[key] != null ? obj[key] : fallback;
}

function resolveOutputsFile() {
  // 1) Explicit env override (best for CI)
  if (process.env.CDK_OUTPUTS_FILE && fs.existsSync(process.env.CDK_OUTPUTS_FILE)) {
    return process.env.CDK_OUTPUTS_FILE;
  }

  // 2) Common defaults (CDK supports --outputs-file)
  const candidates = [
    "cdk-outputs.json",
    "cdk.outputs.json",
    path.join("cdk.out", "outputs.json"),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return null;
}

const outputsFile = resolveOutputsFile();
if (!outputsFile) {
  console.error(
    "No CDK outputs file found. Expected one of: CDK_OUTPUTS_FILE, cdk-outputs.json, cdk.outputs.json, cdk.out/outputs.json",
  );
  process.exit(1);
}

const raw = readJson(outputsFile);

// Helper: stack-safe accessor
function stack(name) {
  return raw[name] || {};
}

// --- Web ---
const web = stack("WebStack");
const cloudFrontDomain =
  pick(web, "CloudFrontDistributionDomainName") ||
  pick(web, "CloudFrontDomainName") ||
  null;

// --- Identity (your project seems to have IdentityV2Stack now) ---
const identity =
  raw["IdentityV2Stack"] ||
  raw["IdentityStack"] ||
  {}; // tolerate either

// --- API ---
const api = stack("ApiStack");

// --- Uploads ---
const uploads = stack("UploadsStack");

// --- Closet ---
const closet = stack("BestiesClosetStack");

const out = {
  Meta: {
    generatedAt: new Date().toISOString(),
    outputsFile,
  },

  Web: {
    cloudFrontUrl: cloudFrontDomain ? `https://${cloudFrontDomain}` : null,
    cloudFrontDomain: cloudFrontDomain,
    staticBucket:
      pick(web, "StaticSiteBucketName") ||
      pick(web, "WebBucketName") ||
      null,
  },

  Identity: {
    userPoolId: pick(identity, "UserPoolId"),
    userPoolClientId: pick(identity, "UserPoolClientId"),
    identityPoolId: pick(identity, "IdentityPoolId"),
    hostedUiDomain: pick(identity, "HostedUiDomain"),
    hostedUiUrl: pick(identity, "HostedUiUrl"),
  },

  Api: {
    appSyncApiId: pick(api, "AppSyncApiId"),
    appSyncUrl: pick(api, "AppSyncUrl"),
  },

  Uploads: {
    uploadsBucket: pick(uploads, "UploadsBucketName") || pick(uploads, "uploadsBucket"),
    uploadsApiUrl: pick(uploads, "UploadsApiUrl") || pick(uploads, "UploadsApiEndpoint"),
  },

  Closet: {
    adminApiUrl: pick(closet, "AdminApiUrl"),
    appTableName: pick(closet, "AppTableName"),
    uploadsBucketName: pick(closet, "UploadsBucketName"),
    closetUploadApprovalStateMachineArn: pick(closet, "ClosetUploadApprovalStateMachineArn"),
    bestieAutoPublishStateMachineArn: pick(
      closet,
      "BestieClosetUploadAutoPublishStateMachineArn",
    ),
    backgroundChangeApprovalStateMachineArn: pick(
      closet,
      "BackgroundChangeApprovalStateMachineArn",
    ),
    closetDashboardName: pick(closet, "ClosetDashboardName"),
    opsTopicArn: pick(closet, "ClosetOpsTopicArn"),
  },
};

// Also emit a flat file for CI / scripts that hate nesting
function flatten(prefix, obj, acc) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(key, v, acc);
    else acc[key] = v;
  }
  return acc;
}

const flat = flatten("", out, {});

fs.writeFileSync("outputs.json", JSON.stringify(out, null, 2));
fs.writeFileSync("outputs.flat.json", JSON.stringify(flat, null, 2));
console.log(`Wrote outputs.json and outputs.flat.json (from ${outputsFile})`);
