# AppSync & Infrastructure Setup Checklist

## 📋 GraphQL Schema & Resolvers

### Creator Asset Mutations
- [ ] Create resolver for `createAsset` → Lambda `creator/assets.ts`
- [ ] Create resolver for `deleteAsset` → Lambda `creator/assets.ts`
- [ ] Create query resolver for `listCreatorAssets` → Lambda `creator/assets.ts`

### Game Mutations
- [ ] Create resolver for `initializeGame` → Lambda `game/index.ts`
- [ ] Create resolver for `submitOutfit` → Lambda `game/index.ts`
- [ ] Create query resolver for `getLeaderboard` → Lambda `game/index.ts`
- [ ] Create query resolver for `getChallenge` → Lambda `game/index.ts`

### Episode Mutations
- [ ] Create resolver for `addEpisodeComment` → Lambda `episodes/index.ts`
- [ ] Create query resolver for `getEpisode` → Lambda `episodes/index.ts`
- [ ] Create query resolver for `listEpisodes` → Lambda `episodes/index.ts`

---

## 🗄️ DynamoDB Tables

Create the following tables in CloudFormation:

### AssetsTable
```
Primary Key: id (String)
Sort Key: userId (String)
Attributes:
  - id (String)
  - userId (String)
  - name (String)
  - type (String: image|video|file)
  - url (String)
  - cabinet (String: general|outfits|accessories|hairstyles|tips)
  - createdAt (Number)

GSI 1: userId-createdAt-index
  Partition Key: userId
  Sort Key: createdAt
  (for querying user's assets)

TTL: None (keep assets indefinitely)
```

### GamesTable
```
Primary Key: gameId (String)
Sort Key: userId (String)
Attributes:
  - gameId (String)
  - userId (String)
  - level (Number)
  - xp (Number)
  - coins (Number)
  - outfit (StringSet)
  - challengeId (String)
  - status (String: active|completed|failed)
  - startedAt (Number)
  - completedAt (Number)

GSI 1: userId-coins-index
  Partition Key: userId
  Sort Key: coins
  (for leaderboard sorting)

TTL: None
```

### EpisodesTable
```
Primary Key: id (String)
Attributes:
  - id (String)
  - title (String)
  - description (String)
  - videoUrl (String)
  - creatorId (String)
  - status (String: draft|published|archived)
  - reactions (StringSet)
  - comments (List<Map>) [stored inline or separate table]
  - createdAt (Number)
  - updatedAt (Number)

GSI 1: creatorId-createdAt-index
  Partition Key: creatorId
  Sort Key: createdAt
  (for listing creator's episodes)

TTL: None
```

### EpisodeCommentsTable (Optional, if separating comments)
```
Primary Key: id (String)
Sort Key: episodeId (String)
Attributes:
  - id (String)
  - episodeId (String)
  - userId (String)
  - text (String)
  - createdAt (Number)

GSI 1: episodeId-createdAt-index
  Partition Key: episodeId
  Sort Key: createdAt
  (for loading episode comments)

TTL: None
```

---

## 🪣 S3 Configuration

### AssetsUploadBucket
```
Bucket Name: styling-adventures-assets-[account-id]
Public Access Block: Allow (we use presigned URLs)
CORS Configuration:
  AllowedOrigins: ["https://yourdomain.com", "http://localhost:*"]
  AllowedMethods: [PUT, GET, POST]
  AllowedHeaders: ["*"]
  MaxAgeSeconds: 3000

Lifecycle Policy:
  - Transition to GLACIER after 180 days (optional)

Versioning: Enabled (for safety)
```

### Presigned URL Configuration
```
ExpireTime: 3600 seconds (1 hour)
Path Pattern: assets/{userId}/{timestamp}-{filename}
```

---

## 🔐 IAM Roles & Policies

### AppSync Execution Role
Needs permissions for:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": [
        "arn:aws:lambda:*:*:function:creator-assets-*",
        "arn:aws:lambda:*:*:function:game-*",
        "arn:aws:lambda:*:*:function:episodes-*"
      ]
    }
  ]
}
```

### Lambda Execution Role
Each Lambda needs:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::styling-adventures-assets-*/*"
    }
  ]
}
```

---

## 🔌 API Gateway / Lambda Integration

### Upload Presign Endpoint
```
Endpoint: POST /presign
Lambda: creator/assets.presignUrl
Parameters:
  - filename (string)
  - filetype (string)
Returns:
  - url (string) - presigned S3 URL
  - key (string) - S3 object key
```

---

## 🧪 Testing Checklist

### Authentication
- [ ] Signup flow works with Cognito
- [ ] OAuth callback returns to /callback page
- [ ] User role is set correctly
- [ ] Protected routes redirect unauthenticated users
- [ ] Creator routes require CREATOR role

### Creator Cabinet
- [ ] Can upload image files
- [ ] Can upload video files
- [ ] Presigned URL is generated correctly
- [ ] S3 upload succeeds
- [ ] Asset record created in DynamoDB
- [ ] Assets appear in grid
- [ ] Can filter by cabinet type
- [ ] Can delete assets
- [ ] Assets are user-isolated

### Fashion Game
- [ ] Game initializes with random challenge
- [ ] Challenge displays correctly
- [ ] Can select 5 items
- [ ] Submit button validates item count
- [ ] Outfit is scored correctly
- [ ] Result displays with coins/xp
- [ ] Next challenge loads
- [ ] Leaderboard shows top players
- [ ] User's stats update

### Episode Theater
- [ ] Video plays with controls
- [ ] Episode info displays
- [ ] Can add comments (if logged in)
- [ ] Comments appear immediately
- [ ] Can add reactions
- [ ] Reaction counts update

---

## 📦 Environment Variables

Create `.env` or set in Lambda console:

```
# Database
ASSETS_TABLE=AssetsTable
GAMES_TABLE=GamesTable
EPISODES_TABLE=EpisodesTable
EPISODE_COMMENTS_TABLE=EpisodeCommentsTable

# S3
ASSETS_BUCKET=styling-adventures-assets-[account-id]

# AppSync
APPSYNC_ENDPOINT=https://[id].appsync-api.[region].amazonaws.com/graphql
APPSYNC_API_KEY=[key]

# Cognito
COGNITO_USER_POOL_ID=us-east-1_[id]
COGNITO_CLIENT_ID=[id]
COGNITO_DOMAIN=styling-adventures-[id]
```

---

## 🚀 Deployment Order

1. **Create DynamoDB Tables**
   ```bash
   aws cloudformation create-stack --template-body file://databases-stack.yml
   ```

2. **Create S3 Buckets**
   ```bash
   aws cloudformation create-stack --template-body file://s3-stack.yml
   ```

3. **Deploy Lambda Functions**
   ```bash
   npm run build:infra
   npm run cdk:deploy
   ```

4. **Set Environment Variables in Lambda Console**

5. **Create AppSync Resolvers**
   - Go to AppSync console
   - Create data source pointing to each Lambda
   - Create resolvers for each mutation/query

6. **Test with AppSync Console**
   ```graphql
   mutation {
     initializeGame(userId: "test-user") {
       gameId
       challengeId
       level
     }
   }
   ```

7. **Deploy Frontend**
   ```bash
   npm run build:site
   npm run deploy
   ```

---

## 🐛 Debugging Tips

### GraphQL Errors
- Check AppSync CloudWatch logs
- Verify data source points to correct Lambda
- Check Lambda environment variables
- Test Lambda directly in console

### Upload Issues
- Check S3 bucket CORS
- Verify presigned URL expiration
- Check IAM permissions
- Verify bucket exists and is accessible

### Game Issues
- Check GAMES_TABLE in DynamoDB
- Verify Lambda has DynamoDB permissions
- Check challengeId exists
- Verify user isolation logic

### Comments Issues
- Check EPISODES_TABLE and EPISODE_COMMENTS_TABLE
- Verify comment structure in DynamoDB
- Check user authentication in resolver
- Verify episode exists before adding comment

---

## 📊 Monitoring

Set up CloudWatch alarms for:
- [ ] Lambda errors > 5% of invocations
- [ ] DynamoDB throttling
- [ ] S3 upload failures
- [ ] AppSync resolver errors

---

## ✅ Final Validation

- [ ] All GraphQL operations callable
- [ ] All DynamoDB queries working
- [ ] S3 uploads successful
- [ ] Lambda functions executing without errors
- [ ] Frontend can call all APIs
- [ ] Authentication flow working
- [ ] Data persisting correctly

Once all checkmarks are complete, the app is ready for beta testing! 🎉
