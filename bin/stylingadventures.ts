import * as cdk from 'aws-cdk-lib';
import { WebStack } from '../lib/stacks/web-stack';
import { IdentityStack } from '../lib/stacks/identity-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { UploadsStack } from '../lib/stacks/uploads-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const identity = new IdentityStack(app, 'IdentityStack', { env });

const api = new ApiStack(app, 'ApiStack', {
  env,
  userPool: identity.userPool,
});

const uploads = new UploadsStack(app, 'UploadsStack', {
  env,
  userPool: identity.userPool,
});

const web = new WebStack(app, 'WebStack', { env });

void api; void uploads; void web; // keep TS quiet about unused locals
