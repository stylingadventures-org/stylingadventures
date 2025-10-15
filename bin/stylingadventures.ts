// bin/stylingadventures.ts
import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';

import { IdentityStack } from '../lib/stacks/identity-stack';
import { UploadsStack } from '../lib/stacks/uploads-stack';
import { WebStack } from '../lib/stacks/web-stack';

// Load config.json from repo root (NOT from dist/)
type Cfg = { webOrigin?: string };
function loadConfig(): Cfg {
  try {
    const p = path.resolve(process.cwd(), 'config.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8')) as Cfg;
    }
  } catch {}
  return {};
}

const app = new cdk.App();
const cfg = loadConfig();

// 1) Identity (no changes)
const identity = new IdentityStack(app, 'IdentityStack', {
  description: 'Cognito (user pool, app client, hosted UI, identity pool)',
});

// 2) Uploads API + S3 + SQS + Thumbs CF distro (reads web origin from config/env)
const webOrigin =
  cfg.webOrigin ||
  process.env.WEB_ORIGIN || // allow override via env if you want
  'http://localhost:5173';

new UploadsStack(app, 'UploadsStack', {
  description: 'Private uploads bucket, API, SQS worker, and thumbs CDN',
  userPool: identity.userPool,
  webOrigin, // used for CORS on API Gateway
});

// 3) Static web (NO reference to uploads; no thumbs behavior here)
new WebStack(app, 'WebStack', {
  description: 'Static web hosting (S3 + CloudFront for the site only)',
});

// Optional tags
cdk.Tags.of(app).add('App', 'stylingadventures');
