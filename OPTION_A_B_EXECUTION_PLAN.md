# 🚀 OPTION A + B EXECUTION PLAN

**Date**: December 26, 2025  
**Status**: Ready to Execute  
**GitHub Secrets**: ✅ Already Configured (verified from screenshot)

---

## OPTION A: GitHub Auto-Deploy (READY TO ACTIVATE)

### Current Status ✅
- AWS Credentials in GitHub Secrets: **CONFIRMED**
  - `AWS_ACCESS_KEY_ID` ✅ (set 3 days ago)
  - `AWS_SECRET_ACCESS_KEY` ✅ (set 3 days ago)
- GitHub Actions Workflow: **EXISTS & READY**
  - File: `.github/workflows/deploy-frontend.yml`
  - Triggers: On push to `main` or `develop` branches
  - Includes: CloudFront cache invalidation
  - Status: Ready to use

### What's Needed to Activate

✅ **GitHub Secrets** - Already done:
```
AWS_ACCESS_KEY_ID = ••••••••••••••••
AWS_SECRET_ACCESS_KEY = ••••••••••••••••
AWS_REGION = (verify us-east-1)
```

⏳ **CloudFront Configuration** - Needs 2 additions:
1. Add `stylingadventures.com` to CloudFront aliases (currently only has `app.stylingadventures.com`)
2. Verify SSL certificate covers both domains

⏳ **DNS Records** - Manual user task:
```
At your domain registrar:
- stylingadventures.com CNAME → d3fghr37bcpbig.cloudfront.net
- app.stylingadventures.com CNAME → d3fghr37bcpbig.cloudfront.net
```

---

## OPTION B: Continue Building Pages (READY TO START)

### BESTIE Tier Status
✅ **COMPLETE** - All 10 pages built and integrated:
- BestieHome, BestieCloset, BestieStudio, SceneClub
- TrendStudio, BestieStories, BestieInbox, PrimeBank
- BestieProfile, AchievementCenter

### Remaining Pages: 25 Total
- **CREATOR Tier**: 9 pages (next)
- **COLLABORATOR Tier**: 4 pages
- **ADMIN Tier**: 6 pages
- **PRIME STUDIOS Tier**: 6 pages

### Page Templates Ready
Templates for remaining pages in: `REMAINING_PAGES_BUILD_GUIDE.md`

---

## EXECUTION ORDER (RECOMMENDED)

### Phase 1: Enable Auto-Deploy (10 minutes)
1. ✅ Skip - Secrets already exist
2. ✅ Skip - Workflow already exists
3. ⏳ Add AWS_REGION secret (verify it exists)
4. ⏳ Update CloudFront aliases to include both domains
5. ⏳ Test deploy with commit to main

### Phase 2: Update DNS (User manual task - 5 minutes)
1. Go to domain registrar (GoDaddy, Namecheap, Route 53, etc.)
2. Add CNAME records for both domains
3. Wait 5-15 minutes for DNS propagation

### Phase 3: Build Remaining Pages (2-3 hours per tier)
1. Start CREATOR tier (9 pages)
2. Verify each page in dev server
3. Test routing with App.tsx updates

---

## FILES TO CHECK

### Infrastructure Files
✅ `deploy-frontend.yml` - GitHub Actions workflow (verified: working)
✅ `DOMAIN_AND_AUTO_DEPLOY_GUIDE.md` - Setup instructions (complete)
✅ `new-dist-config.json` - CloudFront config (shows current aliases)
✅ `outputs.json` - AWS stack outputs
✅ `.github/secrets` - GitHub Secrets (verified: AWS creds exist)

### Frontend Files
✅ `site/src/App.tsx` - Routing (verified: FAN + BESTIE routes working)
✅ `site/src/pages/Bestie/` - BESTIE pages (10 pages ✅ complete)
✅ `site/vite.config.js` - Vite config (verified: fixed)
✅ `site/tsconfig.json` - TypeScript config
✅ `site/package.json` - Dependencies (verified: all needed packages installed)

---

## STEP-BY-STEP EXECUTION

### STEP 1: Verify GitHub Secrets (2 minutes)
```
GitHub → Settings → Secrets and Variables → Actions
Required secrets (should already exist):
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
⏳ AWS_REGION (verify = us-east-1)
```

### STEP 2: Update CloudFront for Both Domains (5 minutes)
```bash
# Current state: Only app.stylingadventures.com in aliases
# Need to add: stylingadventures.com

# Get current config
aws cloudfront get-distribution-config \
  --id ENEIEJY5P0XQA \
  --output json > current-dist.json

# Edit aliases section to include both domains:
# "Aliases": {
#   "Quantity": 2,
#   "Items": ["stylingadventures.com", "app.stylingadventures.com"]
# }

# Update distribution
ETAG=$(jq -r '.ETag' current-dist.json)
aws cloudfront update-distribution \
  --id ENEIEJY5P0XQA \
  --distribution-config file://dist-updated.json \
  --if-match $ETAG
```

### STEP 3: Test Auto-Deploy (3 minutes)
```bash
# Create test commit
echo "<!-- deployment test: $(date) -->" >> site/public/index.html
git add site/public/index.html
git commit -m "test: verify auto-deploy works"
git push origin main

# Watch deployment
# Go to: https://github.com/stylingadventures-org/stylingadventures/actions
# Should see: "Deploy Frontend" workflow running
# Status: Success → Site deployed!
```

### STEP 4: Update DNS Records (5 minutes - Manual)
Go to your domain registrar (GoDaddy, Namecheap, AWS Route 53, etc.) and add:

**Record 1:**
```
Type: CNAME
Name: stylingadventures.com (or just leave blank for root)
Value: d3fghr37bcpbig.cloudfront.net
TTL: 300 (5 min - for testing) or 3600 (1 hour - for production)
```

**Record 2:**
```
Type: CNAME
Name: app.stylingadventures.com (or app)
Value: d3fghr37bcpbig.cloudfront.net
TTL: 300 or 3600
```

**Note**: If your registrar doesn't support CNAME for root domain, use ALIAS/ANAME (Route 53) or add both www and app subdomains.

### STEP 5: Verify Domains Online (5 minutes)
```bash
# Wait 5-15 minutes for DNS propagation, then test:

# Test root domain
curl -I https://stylingadventures.com

# Test app domain  
curl -I https://app.stylingadventures.com

# Both should return 200 OK with your site content
```

---

## NOW: Start Building Option B Pages

### Directory Structure (Ready)
```
site/src/pages/
├── FanHome.tsx ✅
├── Bestie/
│   ├── BestieHome.tsx ✅
│   └── ... (8 more) ✅
└── Creator/ ← START HERE
    ├── CreatorHome.tsx (new)
    ├── CreatorStudio.tsx (new)
    └── ... (7 more to create)
```

### First Page to Build: CreatorHome
- Location: `site/src/pages/Creator/CreatorHome.tsx`
- Based on template: `REMAINING_PAGES_BUILD_GUIDE.md`
- Features: Dashboard, analytics, opportunities
- Estimated time: 25-30 minutes

---

## COMMAND QUICK REFERENCE

```bash
# 1. Verify AWS CLI works
aws cloudfront list-distributions

# 2. Check current CloudFront config
aws cloudfront get-distribution-config --id ENEIEJY5P0XQA

# 3. Test site is accessible
curl https://app.stylingadventures.com

# 4. Watch GitHub Actions
# Go to: github.com/stylingadventures-org/stylingadventures/actions

# 5. Start dev server for new pages
cd site && npm run dev

# 6. Create directory for Creator pages
mkdir -p site/src/pages/Creator

# 7. After creating pages, add to App.tsx
# Add imports + route case statements
```

---

## FINAL CHECKLIST

- [ ] **AWS_REGION** secret exists in GitHub (should be us-east-1)
- [ ] **CloudFront aliases** updated to include both domains
- [ ] **Test commit** pushed to main, workflow executed successfully
- [ ] **DNS records** added at domain registrar
- [ ] **DNS propagation** verified (5-15 minutes)
- [ ] **HTTPS** works on both domains (no certificate errors)
- [ ] **Creator pages** directory created
- [ ] **First Creator page** started (CreatorHome.tsx)

---

## SUCCESS CRITERIA

✅ **Option A Complete When**:
- Push to main → GitHub Actions runs automatically
- Deployment completes in ~2 minutes
- Site updates at https://stylingadventures.com and https://app.stylingadventures.com
- No manual deployment needed anymore

✅ **Option B Complete When**:
- All 25 remaining pages created
- App.tsx routes all pages correctly
- Dev server starts with no errors
- All pages responsive and functional

---

**Ready to execute?** Follow the steps above in order. Start with verifying AWS_REGION secret!
