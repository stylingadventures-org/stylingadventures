# 🚀 DEPLOYMENT GUIDE - Styling Adventures

## Prerequisites Checklist

Before starting deployment, ensure you have:

- [ ] **AWS Account** - with appropriate permissions
- [ ] **AWS CLI** - version 2.x+ installed (`aws --version`)
- [ ] **AWS Credentials** - configured locally (`aws configure`)
- [ ] **Node.js** - version 18+ installed (`node --version`)
- [ ] **npm** - version 8+ installed (`npm --version`)
- [ ] **CDK Bootstrap** - run once per region (`cdk bootstrap`)

---

## Step 1️⃣: Verify AWS Setup

### Check AWS CLI
```bash
aws --version
aws sts get-caller-identity
```

Should show your AWS account ID and user.

### Set Your Region (if needed)
```bash
export AWS_REGION=us-east-1
# or add to .env or ~/.aws/config
```

### Bootstrap CDK (first time only)
```bash
npx cdk bootstrap aws://ACCOUNT_ID/REGION
# Example:
# npx cdk bootstrap aws://123456789012/us-east-1
```

---

## Step 2️⃣: Prepare the Application

### Install Dependencies
```bash
npm install
```

### Verify Schema
```bash
npm run schema:verify
```

### Build Infrastructure Code
```bash
npm run build:infra
```

---

## Step 3️⃣: Review Deployment Plan

### See What Will Be Created
```bash
npm run cdk:synth
```

This creates CloudFormation templates in `cdk.out/` directory.

### See Differences (if re-deploying)
```bash
npm run cdk:diff
```

Shows what will be changed/added/removed.

---

## Step 4️⃣: Deploy Infrastructure

### Deploy All Stacks
```bash
npm run cdk:deploy:all
```

This will:
1. Build the code
2. Create CloudFormation stacks
3. Deploy Lambda functions
4. Create DynamoDB tables
5. Setup API Gateway
6. Configure Cognito

**Duration**: 10-15 minutes (first time)

### Or Deploy Specific Stack
```bash
# Just the API
npm run deploy:api

# Just a specific stack
npx cdk deploy ApiStack
```

---

## Step 5️⃣: Get Outputs

After deployment completes, outputs are automatically written to `config.json`:

```bash
npm run postdeploy
```

Or manually view outputs:
```bash
aws cloudformation describe-stacks --stack-name ApiStack --query 'Stacks[0].Outputs'
```

Key outputs you'll need:
- `appsyncUrl` - GraphQL endpoint
- `cognitoUserPoolId` - Cognito pool ID
- `cognitoClientId` - Cognito client ID
- `assetsBucketUrl` - S3 bucket URL
- `uploadsApiUrl` - Upload API endpoint

---

## Step 6️⃣: Configure AppSync Resolvers

AppSync is deployed but needs resolvers to connect GraphQL to Lambda.

### Option A: Use AWS Console

1. Go to **AppSync** → Your API
2. For each mutation/query, create a resolver:
   - **Data Source**: Lambda function
   - **Resolver**: Attach to appropriate Lambda

### Option B: Use Infrastructure as Code

Add resolver definitions to CDK stack:

```typescript
const api = new AppSync.GraphqlApi(...);
const assetLambda = new Lambda.Function(...);

api.addResourceAt('assets')
  .createResolver({
    typeName: 'Mutation',
    fieldName: 'createAsset',
    dataSource: api.addLambdaDataSource('AssetLambda', assetLambda),
  });
```

See `lib/api-stack.ts` for examples.

---

## Step 7️⃣: Configure Frontend

### Update config.json

Ensure `site/public/config.json` has correct values:

```json
{
  "awsRegion": "us-east-1",
  "appsyncUrl": "https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql",
  "cognitoUserPoolId": "us-east-1_xxxxx",
  "cognitoClientId": "xxxxxxxxxxxxx",
  "cognitoDomain": "https://sa-dev-xxxxx.auth.us-east-1.amazoncognito.com",
  "identityPoolId": "us-east-1:xxxxx-xxxxx",
  "assetsBucketUrl": "https://styling-adventures-assets-xxxxx.s3.us-east-1.amazonaws.com",
  "uploadsApiUrl": "https://xxxxx.execute-api.us-east-1.amazonaws.com/prod"
}
```

### Build Frontend
```bash
npm run build:site
```

### Deploy to CloudFront
```bash
# Get the CloudFront distribution ID from outputs
aws s3 sync site/dist s3://styling-adventures-web-xxxxx --delete

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id XXXXX \
  --paths "/*"
```

---

## Step 8️⃣: Test Everything

### Test Authentication
```bash
# Visit your CloudFront URL
https://dxxxxx.cloudfront.net

# Click "Sign Up" 
# Complete Cognito signup
```

### Test GraphQL
```bash
# Open AppSync console
# Run test query:
query {
  getLeaderboard(limit: 10) {
    items {
      userId
      username
      coins
    }
  }
}
```

### Test Game
```bash
# Navigate to /game in your app
# Should initialize game and load challenges
```

### Test Asset Upload
```bash
# Navigate to /creator/cabinet
# Try uploading a file
# Should appear in S3
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] CloudFormation stacks created successfully
- [ ] Lambda functions deployed (check console)
- [ ] DynamoDB tables created (check console)
- [ ] AppSync API available (check console)
- [ ] Cognito user pool created (check console)
- [ ] S3 bucket created (check console)
- [ ] config.json has correct values
- [ ] Frontend builds without errors
- [ ] Can sign up with Cognito
- [ ] Can upload files to S3
- [ ] GraphQL queries work
- [ ] Game initializes
- [ ] Comments work

---

## 🔧 Troubleshooting

### Deployment Fails
```bash
# Check logs
npx cdk deploy --all --debug

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name ApiStack
```

### Lambda doesn't execute
```bash
# Check Lambda logs
aws logs tail /aws/lambda/function-name --follow
```

### GraphQL errors
```bash
# Check AppSync logs
aws logs tail /aws/appsync/apis/api-id --follow
```

### S3 upload fails
```bash
# Check bucket CORS
aws s3api get-bucket-cors --bucket bucket-name

# Check presigned URL expiration
# Should be at least 3600 seconds
```

---

## 🚀 Deployment Complete!

Your Styling Adventures app is now:
- ✅ Deployed to AWS
- ✅ GraphQL API live
- ✅ Cognito authentication ready
- ✅ S3 uploads working
- ✅ Database ready
- ✅ Frontend deployed

### Next Steps
1. Test all features thoroughly
2. Set up monitoring (CloudWatch alarms)
3. Configure auto-scaling (if needed)
4. Setup custom domain (Route53)
5. Enable CloudFront caching
6. Monitor costs

---

## 📊 Key Resources

| Resource | Location |
|----------|----------|
| CloudFormation | AWS Console → CloudFormation → Stacks |
| Lambda | AWS Console → Lambda → Functions |
| DynamoDB | AWS Console → DynamoDB → Tables |
| AppSync | AWS Console → AppSync → APIs |
| Cognito | AWS Console → Cognito → User Pools |
| S3 | AWS Console → S3 → Buckets |
| CloudWatch | AWS Console → CloudWatch → Logs |

---

## 💰 Estimated Costs

**Monthly estimates** (low volume):
- Lambda: $0.20
- DynamoDB: $1-5
- S3: $0.50
- AppSync: $0.50-2
- Cognito: Free (up to 50K users)
- **Total**: ~$2-10/month (very low usage)

Scales up as you grow. Monitor with Cost Explorer.

---

## 🆘 Need Help?

Check these resources:
1. [INFRASTRUCTURE_CHECKLIST.md](INFRASTRUCTURE_CHECKLIST.md) - Detailed setup
2. [BUILD_GUIDE.md](BUILD_GUIDE.md) - Architecture overview
3. AWS CDK docs: https://docs.aws.amazon.com/cdk/
4. AWS AppSync docs: https://docs.aws.amazon.com/appsync/
5. Cognito docs: https://docs.aws.amazon.com/cognito/

---

## ⚠️ IMPORTANT NOTES

1. **First Deployment Takes Longer**
   - Especially if CloudFront distribution is new
   - Can take 15-30 minutes

2. **CDK Bootstrap Required**
   - Run once per region per account
   - Creates S3 bucket for CDK artifacts

3. **Costs**
   - Even with no usage, you'll pay minimum (usually <$1/month)
   - Monitor with CloudWatch and Cost Explorer

4. **Credentials Security**
   - Never commit `.env` files
   - Use IAM roles in production
   - Rotate credentials regularly

5. **Schema Changes**
   - DynamoDB doesn't auto-migrate
   - Plan schema carefully before production
   - Test in dev environment first

---

**Ready? Run `npm run cdk:deploy:all` and watch it deploy! 🚀**
