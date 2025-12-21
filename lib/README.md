# CDK Stacks

This directory contains the AWS CDK infrastructure-as-code for Styling Adventures.

## Current Stack Architecture

**Canonical (Active) Stacks:**
- `identity-v2-stack.ts` - Cognito user pool, app clients, groups
- `workflows-v2-stack.ts` - Step Functions for closet approval, story publish, creator workflows
- `uploads-stack.ts` - S3 + presigned URL Lambda with security hardening (Cognito auth)
- `api-stack.ts` - AppSync GraphQL API
- `web-stack.ts` - S3 + CloudFront for frontend deployment

## Deprecated Stacks (Removed)

The following stacks are **no longer used** and have been deleted:
- `identity-stack.ts` → Use `identity-v2-stack.ts` instead
- `workflows-stack.ts` → Use `workflows-v2-stack.ts` instead

**Do not resurrect these files.** All active infrastructure uses the v2 versions.

## Security Notes

### Presigned URLs (uploads-stack.ts)
- ✅ Requires Cognito JWT authentication
- ✅ Content-type allowlist (images, videos, documents only)
- ✅ Key sanitization (no path traversal, control chars)
- ✅ User-scoped uploads (users/{sub}/...)
- ✅ Localhost allowed only in non-production environments

### Admin Endpoints (workflows-v2-stack.ts)
- ✅ AdminApprovalApi requires Cognito authentication
- ✅ IAM scoped to specific state machines (not "*")

### Tokens (Frontend)
- ✅ Never stored in localStorage (XSS protection)
- ✅ Stored in sessionStorage only (memory-backed per tab)
- ⚠️ Refresh tokens never stored client-side (use Cognito Hosted UI)

## Building & Deploying

```bash
# Install dependencies
npm install

# Synthesize CloudFormation templates
npm run cdk -- synth

# Deploy a specific stack
npm run cdk -- deploy ApiStack

# Deploy all stacks
npm run cdk -- deploy --all
```

See `package.json` for more CDK commands.
