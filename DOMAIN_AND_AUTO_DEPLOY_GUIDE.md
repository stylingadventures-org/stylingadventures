# 📡 Domain Configuration & Auto-Deploy Setup Guide

**Generated**: December 26, 2025  
**Current Status**: Frontend deployed to CloudFront, backend on AWS  
**Next Steps**: Map custom domains + enable auto-deploy

---

## 🌍 CURRENT DOMAIN SETUP

### What You Have
```
Distribution 1: ENEIEJY5P0XQA
├─ CloudFront: d3fghr37bcpbig.cloudfront.net
├─ Custom:     app.stylingadventures.com  ✅ (already configured)
└─ S3 Bucket:  webstack-webbucket12880f5b-wxfjj0fkn4ax

Distribution 2: E2X76FNAHR8C0W
├─ CloudFront: d1tvmti310q9r3.cloudfront.net
└─ Custom:     (NONE - needs setup)

Distribution 3: EZ6NIIAFQ4V4O
├─ CloudFront: d31cptrudojpsw.cloudfront.net
└─ Custom:     (NONE - needs setup)
```

### Your Domains
1. **stylingadventures.com** - Root domain (needs DNS setup)
2. **app.stylingadventures.com** - App subdomain (already has alias on Distribution 1)

---

## 🎯 GOAL

Map both domains:
- `stylingadventures.com` → CloudFront distribution
- `app.stylingadventures.com` → CloudFront distribution (already done)

---

## 📋 OPTION A: Use Single CloudFront Distribution (RECOMMENDED)

### Step 1: Update Distribution ENEIEJY5P0XQA to Handle Both Domains

```bash
# Get current distribution config
aws cloudfront get-distribution-config --id ENEIEJY5P0XQA --output json > dist-config.json

# Edit dist-config.json to add BOTH domains to Aliases section:
# Find this section and update:
# "Aliases": {
#   "Quantity": 1,
#   "Items": ["app.stylingadventures.com"]
# }
#
# Change to:
# "Aliases": {
#   "Quantity": 2,
#   "Items": ["stylingadventures.com", "app.stylingadventures.com"]
# }

# Also update ACM certificate to cover both domains
# "ViewerCertificate": {
#   "AcmCertificateArn": "arn:aws:acm:us-east-1:...certificate-arn",
#   "SslSupportMethod": "sni-only",
#   "MinimumProtocolVersion": "TLSv1.2_2021"
# }

# Get ETag from original response
ETAG=$(jq -r '.ETag' dist-config.json)

# Update distribution
aws cloudfront update-distribution \
  --id ENEIEJY5P0XQA \
  --distribution-config file://dist-config.json \
  --if-match $ETAG
```

### Step 2: Update DNS Records

Contact your domain registrar and add/update these records:

```
Record Type: CNAME
Name: stylingadventures.com
Value: d3fghr37bcpbig.cloudfront.net
TTL: 300 (or your preference)

Record Type: CNAME  
Name: app.stylingadventures.com
Value: d3fghr37bcpbig.cloudfront.net
TTL: 300
```

**OR if using Route 53:**

```bash
# Create/update Route 53 records
aws route53 change-resource-record-sets --hosted-zone-id Z... --change-batch '{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "stylingadventures.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d3fghr37bcpbig.cloudfront.net"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.stylingadventures.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d3fghr37bcpbig.cloudfront.net"}]
      }
    }
  ]
}'
```

### Step 3: Verify DNS Propagation

```bash
# Check DNS resolution (wait 5-15 minutes for propagation)
nslookup stylingadventures.com
nslookup app.stylingadventures.com

# Both should resolve to: d3fghr37bcpbig.cloudfront.net
```

### Step 4: Test HTTPS

```bash
curl -I https://stylingadventures.com
curl -I https://app.stylingadventures.com

# Both should return 200 OK with no certificate errors
```

---

## 🤖 AUTO-DEPLOY SETUP

You already have GitHub Actions workflows! Here's how to enable/configure them:

### What You Have

**File**: `.github/workflows/deploy-frontend.yml`

Current triggers:
- ✅ Automatic deploy on `git push` to `main` or `develop` branches
- ✅ Only deploys if `site/` folder changes
- ✅ Builds and deploys to S3 with proper cache headers

### Step 1: Configure AWS Credentials in GitHub

Go to GitHub repo → Settings → Secrets and Variables → Actions

Add these secrets:

```
AWS_ACCESS_KEY_ID = <your AWS access key>
AWS_SECRET_ACCESS_KEY = <your AWS secret key>
AWS_REGION = us-east-1
```

### Step 2: Test Auto-Deploy

```bash
# Make a test change to site/
echo "<!-- test comment -->" >> site/index.html

# Commit and push
git add site/index.html
git commit -m "test: auto-deploy test"
git push origin main

# Watch deployment
# Go to GitHub repo → Actions tab → See deployment status
```

### Step 3: CloudFront Cache Invalidation (RECOMMENDED)

Add cache invalidation to deploy workflow:

**File**: `.github/workflows/deploy-frontend.yml`

Add this after S3 sync:

```yaml
      - name: Invalidate CloudFront Cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ENEIEJY5P0XQA \
            --paths "/*"
```

### Step 4: Monitor Deployments

Track deployments in GitHub Actions:

```
https://github.com/YOUR_REPO/actions
```

Watch the `Deploy Frontend` workflow execute automatically when you push to main/develop.

---

## 🔄 MANUAL DEPLOY (Without GitHub)

If you want to deploy manually:

```bash
# Build the site
cd site
npm run build

# Deploy to S3
aws s3 sync dist s3://webstack-webbucket12880f5b-wxfjj0fkn4ax \
  --region us-east-1 \
  --delete \
  --cache-control 'max-age=0,no-cache,no-store,must-revalidate' \
  --exclude "*.js" --exclude "*.css" --exclude "*.json"

aws s3 sync dist s3://webstack-webbucket12880f5b-wxfjj0fkn4ax \
  --region us-east-1 \
  --exclude "*.html" \
  --cache-control 'max-age=31536000,public,immutable'

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id ENEIEJY5P0XQA \
  --paths "/*"
```

---

## 🔐 SSL CERTIFICATE SETUP

Your CloudFront already has SSL configured for `app.stylingadventures.com`.

To support both domains, update the ACM certificate:

**Option 1: Wildcard Certificate** (covers all subdomains)
```
*.stylingadventures.com
stylingadventures.com
```

**Option 2: Specific Certificate** (covers only these domains)
```
stylingadventures.com
app.stylingadventures.com
```

**To update certificate:**

```bash
# Request new ACM certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
  --domain-name stylingadventures.com \
  --subject-alternative-names app.stylingadventures.com \
  --validation-method DNS \
  --region us-east-1

# Wait for validation (check email or Route 53 DNS)
# Then update CloudFront distribution to use new certificate ARN
```

---

## 📊 DEPLOYMENT WORKFLOW

```
Your Code
    ↓
git push to main/develop
    ↓
GitHub Actions Triggered
    ↓
Install Dependencies
    ↓
npm run build:site
    ↓
S3 Upload (with cache headers)
    ↓
CloudFront Invalidation
    ↓
Live at stylingadventures.com ✅
```

---

## 🎯 QUICK START CHECKLIST

### For Custom Domains
- [ ] Get current CloudFront distribution config
  ```bash
  aws cloudfront get-distribution-config --id ENEIEJY5P0XQA --output json > dist-config.json
  ```

- [ ] Add both domains to Aliases in distribution config
  ```
  "Aliases": {
    "Quantity": 2,
    "Items": ["stylingadventures.com", "app.stylingadventures.com"]
  }
  ```

- [ ] Update CloudFront with new config
  ```bash
  aws cloudfront update-distribution --id ENEIEJY5P0XQA \
    --distribution-config file://dist-config.json \
    --if-match $ETAG
  ```

- [ ] Update DNS records at registrar
  ```
  stylingadventures.com CNAME d3fghr37bcpbig.cloudfront.net
  app.stylingadventures.com CNAME d3fghr37bcpbig.cloudfront.net
  ```

- [ ] Wait 5-15 minutes for DNS propagation
- [ ] Test: `curl -I https://stylingadventures.com`

### For Auto-Deploy
- [ ] Add AWS credentials to GitHub Secrets
  ```
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  AWS_REGION = us-east-1
  ```

- [ ] Test auto-deploy by pushing to main
  ```bash
  git push origin main
  # Watch GitHub Actions tab
  ```

- [ ] (Optional) Add CloudFront invalidation to workflow
  ```yaml
  - name: Invalidate CloudFront Cache
    run: |
      aws cloudfront create-invalidation \
        --distribution-id ENEIEJY5P0XQA \
        --paths "/*"
  ```

---

## 🆘 TROUBLESHOOTING

### Domain shows old content
**Cause**: CloudFront cache or DNS propagation  
**Fix**: 
```bash
# Invalidate all cache
aws cloudfront create-invalidation \
  --distribution-id ENEIEJY5P0XQA \
  --paths "/*"

# Wait 5-15 minutes for DNS propagation
```

### Domain shows different site
**Cause**: DNS pointing to wrong CloudFront  
**Fix**: Check DNS records
```bash
nslookup stylingadventures.com
# Should resolve to: d3fghr37bcpbig.cloudfront.net
```

### SSL certificate error
**Cause**: Certificate doesn't cover the domain  
**Fix**: Update certificate to include both domains in ACM

### GitHub Actions deploy fails
**Cause**: Missing AWS credentials  
**Fix**: Add AWS secrets to GitHub repo settings

---

## 📞 NEXT STEPS

1. **Right now**: Update CloudFront distribution config to include both domains
2. **Then**: Update DNS records at your registrar
3. **Then**: Add AWS credentials to GitHub
4. **Test**: Push a change to main and verify auto-deploy works
5. **Monitor**: Watch GitHub Actions for deployment status

---

**Everything is ready to go live!** 🚀
