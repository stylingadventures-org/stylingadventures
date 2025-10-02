# Styling Adventures – Phase-1 Runbook

## Overview
MVP infra: S3+CloudFront, Cognito Hosted UI, AppSync hello, API Gateway+Lambda presigned uploads. Outputs in `outputs.json`.

## Prereqs
Node 18+, AWS CLI v2, CDK v2, jq. Logged in (`aws sts get-caller-identity` shows your Account).

## Deploy (first time)
```bash
npm ci
npm run build
npm run plan
cdk bootstrap aws://<ACCOUNT_ID>/${AWS_REGION:-us-east-1}
cdk deploy IdentityStack ApiStack UploadsStack WebStack --require-approval never
node scripts/write-outputs.js && cat outputs.json
