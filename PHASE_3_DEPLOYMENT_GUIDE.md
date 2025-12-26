# Phase 3: Payment Integration - Deployment Guide

## Completed in Phase 3

### ✅ Frontend Components (All Built & Styled)
1. **UpgradeBestie.jsx** - Bestie tier upgrade paywall ($9.99/mo or $99.99/yr)
2. **UpgradeCreator.jsx** - Creator tier upgrade paywall ($24.99/mo or $249.99/yr)
3. **BestieCloset.jsx** - Collections grid with user-created + seasonal collections, stats, look cards
4. **BestieStudio.jsx** - Look builder, gallery, drafts, challenge submission system
5. **BestieStories.jsx** - Instagram/TikTok-style short-form feed, episodic content, modal viewer
6. **CreatorStudio.jsx** - Dashboard with earnings, revenue breakdown by source/month, partnerships list

### ✅ Payment Infrastructure (Ready for Deployment)
1. **payment.js** - Frontend Stripe service
   - `initiateStripeCheckout(tier, billingCycle, user)` - Creates session via backend
   - `redirectToStripeCheckout(tier, billingCycle, user)` - Redirects to Stripe Checkout
   - `getCheckoutSessionStatus(sessionId)` - Retrieve session status

2. **create-checkout-session.ts** - Lambda for POST /api/payments/create-checkout-session
   - Validates tier (BESTIE|CREATOR) and billingCycle (monthly|annual)
   - Gets/creates Stripe customer linked to Cognito userId
   - Gets/creates product (tier-specific)
   - Gets/creates price (with recurring config)
   - Returns sessionId, clientSecret, url
   - **Pricing:** BESTIE $9.99/mo or $99.99/yr; CREATOR $24.99/mo or $249.99/yr

3. **webhook.ts** - Lambda for POST /api/payments/webhook (Stripe webhook handler)
   - Validates webhook signature with STRIPE_WEBHOOK_SECRET
   - Handlers:
     - `checkout.session.completed` - Find user by email → add to tier group → store subscription
     - `invoice.payment_succeeded` - Update status to "active"
     - `invoice.payment_failed` - Update status to "payment_failed"
     - `customer.subscription.deleted` - Remove from tier → add to FAN → update status

### ✅ Styling (Complete)
- upgrade.css - Paywall styles with error messaging
- bestie-closet.css - Closet page responsive design
- bestie-studio.css - Studio page with tabs and builders
- bestie-stories.css - Feed and modal styling
- creator-studio.css - Dashboard and revenue charts

## Remaining Steps for Full Deployment

### 1. Configure Stripe Account & API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get test API keys:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)
3. Get webhook signing secret:
   - Go to Webhooks section
   - Create endpoint pointing to `https://your-api-gateway.execute-api.region.amazonaws.com/api/payments/webhook`
   - Copy webhook signing secret (`whsec_...`)
4. Store in environment variables (below)

### 2. Create DynamoDB Subscriptions Table

Use AWS Console or CLI:

```bash
aws dynamodb create-table \
  --table-name Subscriptions \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes \
    "IndexName=EmailIndex,Keys=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

**Table Schema:**
```
{
  "userId": "string (PK)",
  "email": "string (GSI)",
  "tier": "string (BESTIE | CREATOR)",
  "stripeCustomerId": "string",
  "stripeSubscriptionId": "string",
  "status": "string (active | payment_failed | cancelled)",
  "createdAt": "timestamp",
  "renewalDate": "timestamp",
  "billingCycle": "string (monthly | annual)"
}
```

### 3. Deploy Lambda Functions via CDK

Update your CDK stack to include:

```typescript
// Lambda for create-checkout-session
const checkoutLambda = new lambda.Function(this, 'CheckoutSessionLambda', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'create-checkout-session.handler',
  code: lambda.Code.fromAsset('lambda/payments'),
  environment: {
    STRIPE_SECRET_KEY: 'sk_test_YOUR_KEY',
    COGNITO_USER_POOL_ID: 'us-east-1_XXXXX',
    SUBSCRIPTIONS_TABLE: 'Subscriptions'
  }
});

// Lambda for webhook
const webhookLambda = new lambda.Function(this, 'WebhookLambda', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'webhook.handler',
  code: lambda.Code.fromAsset('lambda/payments'),
  environment: {
    STRIPE_SECRET_KEY: 'sk_test_YOUR_KEY',
    STRIPE_WEBHOOK_SECRET: 'whsec_YOUR_SECRET',
    COGNITO_USER_POOL_ID: 'us-east-1_XXXXX',
    SUBSCRIPTIONS_TABLE: 'Subscriptions'
  }
});
```

### 4. Configure API Gateway Routes

Add to your API Gateway:

```typescript
// POST /api/payments/create-checkout-session
api.addResource('payments').addResource('create-checkout-session').addMethod(
  'POST',
  new apigateway.LambdaIntegration(checkoutLambda),
  {
    authorizationType: apigateway.AuthorizationType.COGNITO,
    authorizer: cognitoAuthorizer,
    requestValidator: requestValidator,
  }
);

// POST /api/payments/webhook
api.addResource('payments').addResource('webhook').addMethod(
  'POST',
  new apigateway.LambdaIntegration(webhookLambda),
  {
    authorizationType: apigateway.AuthorizationType.NONE, // Webhook doesn't need auth
  }
);
```

### 5. Set Environment Variables in React

Add to `.env` or `config.json`:

```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
REACT_APP_API_BASE_URL=https://your-api-gateway.execute-api.region.amazonaws.com
```

### 6. Verify DynamoDB Permissions

Ensure Lambda functions have permissions:

```typescript
subscriptionsTable.grantReadWriteData(checkoutLambda);
subscriptionsTable.grantReadWriteData(webhookLambda);
```

Ensure Cognito permissions:

```typescript
cognitoUserPool.grantAdminAddUserToGroup(webhookLambda);
cognitoUserPool.grantAdminRemoveUserFromGroup(webhookLambda);
```

## Testing Checklist

### Unit Tests
- [ ] Payment service creates session with correct tier/cycle
- [ ] Webhook signature validation works
- [ ] Cognito role assignment logic correct
- [ ] DynamoDB subscription storage working

### Integration Tests
- [ ] Create checkout session returns valid session ID
- [ ] Redirect to Stripe Checkout works
- [ ] Webhook processes payment events correctly
- [ ] User appears in correct Cognito group after payment

### E2E Tests (Manual)
1. [ ] User can navigate to /upgrade/bestie
2. [ ] Can select monthly or annual billing
3. [ ] Click "Subscribe" redirects to Stripe test checkout
4. [ ] Complete payment with test card `4242 4242 4242 4242` (exp: any future date, CVC: any 3 digits)
5. [ ] Stripe webhook fires (check AWS Lambda logs)
6. [ ] User added to BESTIE group in Cognito (check in console)
7. [ ] User logs out and back in - JWT now includes BESTIE group
8. [ ] /bestie/closet shows content instead of "Upgrade to Bestie"
9. [ ] Repeat for Creator tier at /upgrade/creator

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

## Stripe Test Mode Flow

1. User upgrades → redirectToStripeCheckout() → Creates session → Redirects to Stripe
2. User completes payment with test card
3. Stripe fires `checkout.session.completed` webhook
4. Webhook Lambda receives event
5. Lambda finds user by email from Stripe customer metadata
6. Lambda adds user to BESTIE/CREATOR group in Cognito
7. Lambda stores subscription in DynamoDB
8. User logs out, logs back in
9. JWT token now includes `cognito:groups` with [BESTIE] or [CREATOR]
10. Pages check groups and show tier-specific content

## Architecture Diagram

```
Frontend                    Backend                           Stripe
─────────────────────────────────────────────────────────────────────
User clicks Subscribe
  │
  ├─> payment.js
  │     redirectToStripeCheckout()
  │       │
  │       ├─> API Gateway POST /api/payments/create-checkout-session
  │       │     │
  │       │     └─> Lambda: create-checkout-session
  │       │           ├─ Get/create Stripe customer
  │       │           ├─ Get/create product
  │       │           ├─ Get/create price
  │       │           └─ Create checkout session → returns URL
  │       │
  │       └─> Redirect to Stripe Checkout URL
  │
  └─> User completes payment
        │
        ├─> Stripe fires webhook event
        │     │
        │     └─> POST /api/payments/webhook
        │           │
        │           └─> Lambda: webhook
        │                 ├─ Validate signature
        │                 ├─ Find user by email in Cognito
        │                 ├─ Add to BESTIE/CREATOR group
        │                 ├─ Store subscription in DynamoDB
        │                 └─ Return 200 OK
        │
        └─> User logs out & back in
              │
              └─> JWT now includes tier group
                    │
                    └─> Pages show tier-specific content
```

## File Locations

```
site/src/
├── pages/
│   ├── Upgrade/
│   │   ├── UpgradeBestie.jsx ✅
│   │   └── UpgradeCreator.jsx ✅
│   ├── Bestie/
│   │   ├── BestieCloset.jsx ✅
│   │   ├── BestieStudio.jsx ✅
│   │   └── BestieStories.jsx ✅
│   └── Creator/
│       └── CreatorStudio.jsx ✅
├── api/
│   └── payment.js ✅
└── styles/
    ├── upgrade.css ✅
    ├── bestie-closet.css ✅
    ├── bestie-studio.css ✅
    ├── bestie-stories.css ✅
    └── creator-studio.css ✅

lambda/
└── payments/
    ├── create-checkout-session.ts ✅
    └── webhook.ts ✅
```

## Next Phase (Phase 4)

Once payment integration is live:
1. Implement look creation/editing functionality
2. Build community features (likes, comments, follows)
3. Add messaging system for collaborations
4. Implement revenue split calculations
5. Create admin dashboard for analytics
