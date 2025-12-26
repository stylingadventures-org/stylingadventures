# POST-DEPLOYMENT SETUP GUIDE

## 🎯 What to Do After Deployment Completes

Your AWS infrastructure is currently being deployed. Once CloudFormation finishes creating all stacks (30-45 minutes), follow these steps to complete the setup.

---

## Step 1️⃣: Wait for Deployment to Complete

### Monitor Progress

#### Via AWS Console (Easiest)
1. Go to **AWS Console** → **CloudFormation**
2. Look for these stacks:
   - `WebStack` (S3 + CloudFront)
   - `DataStack` (DynamoDB)
   - `IdentityV2Stack` (Cognito)
   - `ApiStack` (AppSync + Lambda)
   - `UploadsStack` (S3 + presigned URLs)
   - ... and 15 others

3. When ALL stacks show `CREATE_COMPLETE` ✅, proceed

#### Via Terminal
```bash
# Check stack status
aws cloudformation list-stacks \
  --region us-east-1 \
  --query 'StackSummaries[?StackStatus==`CREATE_COMPLETE`].[StackName]' \
  --output text
```

---

## Step 2️⃣: Extract CloudFormation Outputs

These outputs contain critical information your frontend needs.

### Option A: Using npm script (Recommended)
```bash
cd c:\Users\12483\Desktop\stylingadventures\stylingadventures
npm run postdeploy
```

This creates/updates `config.json` with all outputs.

### Option B: Manual AWS Console
1. Go to CloudFormation
2. Click on **ApiStack**
3. Click **Outputs** tab
4. Copy the values:
   - `AppsyncApiUrl` - Your GraphQL endpoint
   - `CognitoUserPoolId` - User pool ID
   - `CognitoClientId` - App client ID
   - `CognitoDomain` - Login domain
   - `AssetsBucketUrl` - S3 bucket URL
   - `UploadsApiUrl` - Upload API endpoint

### Option C: AWS CLI
```bash
# Get ApiStack outputs
aws cloudformation describe-stacks \
  --stack-name ApiStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output json

# Get WebStack outputs
aws cloudformation describe-stacks \
  --stack-name WebStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output json
```

---

## Step 3️⃣: Update Frontend Configuration

You now have all the AWS endpoints. Update the frontend to use them.

### File 1: `site/public/config.json`

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

**Where to get these values:**

| Value | CloudFormation Stack | Output Key |
|-------|----------------------|------------|
| `appsyncUrl` | ApiStack | AppsyncApiUrl |
| `cognitoUserPoolId` | IdentityV2Stack | CognitoUserPoolId |
| `cognitoClientId` | IdentityV2Stack | CognitoClientId |
| `cognitoDomain` | IdentityV2Stack | CognitoDomain |
| `assetsBucketUrl` | UploadsStack | AssetsBucketUrl |
| `uploadsApiUrl` | UploadsStack | UploadsApiUrl |

### File 2: `site/src/api/apollo.js`

Verify the Apollo client config uses the correct AppSync endpoint:

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { AuthContext } from '../contexts/AuthContext'

const config = {
  appsyncUrl: window.CONFIG?.appsyncUrl || 'https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
  awsRegion: window.CONFIG?.awsRegion || 'us-east-1'
}

export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: config.appsyncUrl,
    credentials: 'include',
    headers: {
      authorization: getAuthToken()
    }
  }),
  cache: new InMemoryCache()
})
```

---

## Step 4️⃣: Build Frontend

Build the React app with the new configuration:

```bash
cd c:\Users\12483\Desktop\stylingadventures\stylingadventures

# Install dependencies if needed
npm install

# Build frontend
npm run build:site
```

Expected output:
```
> site@0.0.0 build
> vite build

✓ 53 modules transformed
✓ built in 630ms
```

---

## Step 5️⃣: Deploy Frontend to S3

Your frontend builds to `site/dist/`. Now upload it to the S3 web bucket.

### Get S3 Bucket Name
```bash
# From CloudFormation WebStack Outputs
aws cloudformation describe-stacks \
  --stack-name WebStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`WebBucketName`].OutputValue' \
  --output text
```

### Sync Files to S3
```bash
# Replace YOUR-BUCKET-NAME with actual bucket
aws s3 sync site/dist s3://YOUR-BUCKET-NAME --delete --region us-east-1
```

This:
- Uploads all files from `site/dist`
- Deletes files in S3 that aren't in `site/dist`
- Sets correct content types automatically

---

## Step 6️⃣: Invalidate CloudFront Cache

CloudFront caches files. Force it to serve fresh content.

### Get CloudFront Distribution ID
```bash
# From CloudFormation WebStack Outputs
aws cloudformation describe-stacks \
  --stack-name WebStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text
```

### Create Invalidation
```bash
# Replace DISTRIBUTION-ID with actual ID
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION-ID \
  --paths "/*" \
  --region us-east-1
```

This creates a cache invalidation. Wait a few seconds for it to complete.

---

## Step 7️⃣: Test the Application

### Get Your Frontend URL

```bash
# From CloudFormation WebStack Outputs
aws cloudformation describe-stacks \
  --stack-name WebStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
  --output text
```

Your URL will look like: `https://d1682i07dc1r3k.cloudfront.net`

### Test Authentication
1. Open **https://your-cloudfront-url.cloudfront.net** in browser
2. Click **Sign Up**
3. Enter email and password
4. Check email for verification code
5. Verify code
6. Login with credentials

### Test Creator Cabinet
1. Login as creator
2. Go to **Creator Cabinet** (`/creator/cabinet`)
3. Upload an image
4. Verify it appears in the gallery
5. Try filtering by category
6. Delete the image

### Test Fashion Game
1. Go to **Fashion Game** (`/game`)
2. See first challenge
3. Select an outfit
4. Submit outfit
5. See score
6. Check leaderboard

### Test Episodes
1. Go to **Episodes** (`/episodes`)
2. Find episode
3. Play video
4. Add comment
5. Add reaction
6. See other reactions

### Test GraphQL API
1. Open AppSync console
2. Go to **Queries**
3. Test query:
```graphql
query {
  listEpisodes(limit: 10) {
    items {
      id
      title
      creatorId
    }
  }
}
```

---

## Step 8️⃣: Monitor & Troubleshoot

### Check CloudWatch Logs

View logs for any Lambda functions:

```bash
# List all log groups
aws logs describe-log-groups --region us-east-1 --output table

# View specific log
aws logs tail /aws/lambda/ApiStack-AssetsFn --region us-east-1 --follow
```

### Check AppSync API

1. Go to **AWS Console** → **AppSync**
2. Click your API
3. Check **Queries** and **Mutations**
4. Test queries directly in console

### Check DynamoDB

1. Go to **AWS Console** → **DynamoDB**
2. Look for tables created
3. Click **Explore items** to view data

### Check S3 Uploads

1. Go to **AWS Console** → **S3**
2. Find `styling-adventures-assets-xxxxx` bucket
3. Verify your uploaded files appear

---

## 🔧 Troubleshooting

### Blank Page on Frontend
**Problem**: CloudFront URL shows blank page
**Solution**:
```bash
# 1. Verify S3 bucket has files
aws s3 ls s3://YOUR-BUCKET-NAME --recursive

# 2. Check S3 bucket policy allows public access
aws s3api get-bucket-policy --bucket YOUR-BUCKET-NAME

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id ID --paths "/*"

# 4. Wait 5 minutes, refresh browser hard (Ctrl+Shift+R)
```

### Login Not Working
**Problem**: Cognito login fails
**Solution**:
```bash
# 1. Verify config.json has correct Cognito domain
cat site/public/config.json | grep cognitoDomain

# 2. Check Cognito user pool exists
aws cognito-idp list-user-pools --region us-east-1 --max-results 10

# 3. Verify callback URLs in app client
aws cognito-idp describe-user-pool-client \
  --user-pool-id YOUR-POOL-ID \
  --client-id YOUR-CLIENT-ID \
  --region us-east-1
```

### GraphQL Errors
**Problem**: API returns errors
**Solution**:
```bash
# 1. Check Lambda logs
aws logs tail /aws/lambda/ApiStack-xxxx --region us-east-1 --follow

# 2. Check AppSync errors
aws logs tail /aws/appsync/apis/xxxxx --region us-east-1 --follow

# 3. Verify DynamoDB tables exist
aws dynamodb list-tables --region us-east-1
```

### File Uploads Fail
**Problem**: Can't upload files
**Solution**:
```bash
# 1. Verify presigned URL endpoint
curl https://YOUR-UPLOADS-API/presigned

# 2. Check S3 bucket CORS
aws s3api get-bucket-cors --bucket YOUR-ASSETS-BUCKET

# 3. Verify Lambda permissions
aws lambda get-policy --function-name UploadApiFn --region us-east-1
```

---

## ✅ Verification Checklist

After completing all steps:

- [ ] All CloudFormation stacks are CREATE_COMPLETE
- [ ] config.json has been updated with outputs
- [ ] Frontend built successfully (npm run build:site)
- [ ] Files synced to S3 (aws s3 sync)
- [ ] CloudFront invalidated
- [ ] Frontend URL loads in browser
- [ ] Can sign up via Cognito
- [ ] Can login with credentials
- [ ] Creator Cabinet page loads
- [ ] Can upload a file
- [ ] File appears in gallery
- [ ] Fashion Game initializes
- [ ] Can select outfit and submit
- [ ] Leaderboard displays
- [ ] Episodes page loads
- [ ] Can play video
- [ ] Can add comments
- [ ] GraphQL queries work in AppSync console
- [ ] No Lambda errors in CloudWatch
- [ ] No AppSync errors in logs

---

## 📊 URLs You'll Use

- **Frontend**: `https://dxxxxx.cloudfront.net`
- **GraphQL API**: `https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql`
- **Cognito Login**: `https://sa-dev-xxxxx.auth.us-east-1.amazoncognito.com/login`
- **S3 Assets**: `https://styling-adventures-assets-xxxxx.s3.us-east-1.amazonaws.com`
- **API Gateway**: `https://xxxxx.execute-api.us-east-1.amazonaws.com/prod`

---

## 🚀 What's Next

### Immediate
- Monitor CloudWatch for errors
- Test thoroughly
- Gather user feedback

### This Week
- Configure custom domain (Route53)
- Setup email notifications
- Create sample data

### This Month
- Add real-time features
- Implement analytics
- Optimize performance

---

## 💡 Pro Tips

1. **Keep config.json secret** - Don't commit with real URLs
2. **Monitor costs** - Check AWS Billing regularly
3. **Setup alarms** - CloudWatch alarms for errors
4. **Backup database** - Enable DynamoDB backups
5. **Version your API** - Plan for breaking changes

---

## 📞 Need Help?

If something doesn't work:

1. **Check CloudWatch logs** - Most errors logged there
2. **Verify config.json** - Wrong endpoints cause most issues
3. **Check IAM permissions** - Lambda needs S3, DynamoDB access
4. **Look at CloudFormation events** - Shows what failed
5. **Consult documentation** - See BUILD_GUIDE.md

---

**You're almost there! 🎉**

Once deployment completes, follow these steps and your app will be live!

---

*Last updated: Before deployment completion*
*Next: Monitor CloudFormation progress*
