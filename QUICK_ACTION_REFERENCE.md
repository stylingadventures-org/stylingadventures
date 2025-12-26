# ⚡ QUICK ACTION REFERENCE - Copy & Paste Ready

**Use this for immediate execution of Option A (Auto-Deploy Setup)**

---

## 🎯 STEP 1: UPDATE CLOUDFRONT ALIASES (5 min)

### Get Current Configuration
```bash
aws cloudfront get-distribution-config --id ENEIEJY5P0XQA --output json > dist-config.json
```

### Edit the File
Open `dist-config.json` and find the `Aliases` section (around line 10).

**Change FROM:**
```json
"Aliases": {
  "Quantity": 1,
  "Items": ["app.stylingadventures.com"]
}
```

**Change TO:**
```json
"Aliases": {
  "Quantity": 2,
  "Items": ["stylingadventures.com", "app.stylingadventures.com"]
}
```

Save the file.

### Get ETag (Required for Update)
```bash
# Copy the ETag value from the response
ETAG=$(jq -r '.ETag' dist-config.json)
echo "Your ETag: $ETAG"
```

### Update CloudFront
```bash
# Replace with the actual ETag from previous step
aws cloudfront update-distribution \
  --id ENEIEJY5P0XQA \
  --distribution-config file://dist-config.json \
  --if-match "YOUR_ETAG_HERE"
```

### Verify Update
```bash
# Should show 2 items in Aliases
aws cloudfront get-distribution --id ENEIEJY5P0XQA | jq '.Distribution.DistributionConfig.Aliases'
```

**Expected output:**
```json
{
  "Quantity": 2,
  "Items": [
    "stylingadventures.com",
    "app.stylingadventures.com"
  ]
}
```

---

## 🌍 STEP 2: ADD DNS RECORDS (5 min - Manual at Registrar)

### If Using GoDaddy
1. Go to: godaddy.com/products/domains
2. Find: stylingadventures.com
3. Click: "DNS" button
4. Find or Create Records:
   - **Record 1**: Type: CNAME | Name: @ | Value: d3fghr37bcpbig.cloudfront.net | TTL: 300
   - **Record 2**: Type: CNAME | Name: app | Value: d3fghr37bcpbig.cloudfront.net | TTL: 300
5. Click: "Save"
6. Wait: 5-15 minutes for propagation

### If Using Namecheap
1. Go to: namecheap.com/domains
2. Find: stylingadventures.com
3. Click: "Manage"
4. Go to: "Advanced DNS"
5. Add Records:
   - **Record 1**: Type: CNAME | Host: @ | Value: d3fghr37bcpbig.cloudfront.net | TTL: 300
   - **Record 2**: Type: CNAME | Host: app | Value: d3fghr37bcpbig.cloudfront.net | TTL: 300
6. Click: "Save"
7. Wait: 5-15 minutes for propagation

### If Using AWS Route 53
1. Go to: console.aws.amazon.com/route53
2. Find: Your hosted zone for stylingadventures.com
3. Create Record 1:
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123456789ABC \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "stylingadventures.com",
           "Type": "CNAME",
           "TTL": 300,
           "ResourceRecords": [{"Value": "d3fghr37bcpbig.cloudfront.net"}]
         }
       }]
     }'
   ```

4. Create Record 2:
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123456789ABC \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "app.stylingadventures.com",
           "Type": "CNAME",
           "TTL": 300,
           "ResourceRecords": [{"Value": "d3fghr37bcpbig.cloudfront.net"}]
         }
       }]
     }'
   ```

---

## 🧪 STEP 3: TEST AUTO-DEPLOY (3 min)

### Make Test Commit
```bash
# Navigate to project root
cd c:\Users\12483\Desktop\stylingadventures\stylingadventures

# Make a small change
echo "<!-- deployed at $(date) -->" >> site/public/index.html

# Add and commit
git add site/public/index.html
git commit -m "test: verify auto-deploy works"

# Push to main
git push origin main
```

### Watch Deployment
1. Go to: https://github.com/stylingadventures-org/stylingadventures/actions
2. Look for: "Deploy Frontend" workflow
3. Watch the steps (should take 1-2 minutes)
4. Expected result: All green checkmarks ✅

### Verify in Terminal
```bash
# Wait 1-2 minutes for deployment, then test:

# Test CloudFront (should work immediately)
curl -I https://d3fghr37bcpbig.cloudfront.net

# Test app domain (after CloudFront updates)
curl -I https://app.stylingadventures.com

# Test root domain (after DNS propagates - wait 5-15 min)
curl -I https://stylingadventures.com
```

---

## ✅ STEP 4: VERIFY DNS PROPAGATION (5-15 min wait)

### Check DNS Propagation
```bash
# Check stylingadventures.com
nslookup stylingadventures.com
# Should return: d3fghr37bcpbig.cloudfront.net

# Check app.stylingadventures.com
nslookup app.stylingadventures.com
# Should return: d3fghr37bcpbig.cloudfront.net
```

### Test in Browser
```
1. https://stylingadventures.com
2. https://app.stylingadventures.com
3. Both should load your site with ✅ SSL certificate
```

### If DNS Not Resolved Yet
```
Solution: Wait 15 minutes and try again
Most registrars cache for 5-15 minutes
If still not working after 30 minutes, verify records were saved correctly
```

---

## 🚀 AUTO-DEPLOY IS NOW ACTIVE!

From now on, every time you push to main:

```bash
git add site/...
git commit -m "your message"
git push origin main
# ↓ GitHub Actions auto-runs
# ↓ Site builds (1 min)
# ↓ Deploys to S3 (30 sec)
# ↓ Clears CloudFront cache (30 sec)
# ↓ Done! Live in ~2 minutes
```

No more manual deployment commands! 🎉

---

## 📋 QUICK CHECKLIST

- [ ] **Step 1**: Update CloudFront aliases (verify output shows 2 items)
- [ ] **Step 2**: Add DNS records at registrar (save changes)
- [ ] **Step 3**: Push test commit (watch GitHub Actions complete)
- [ ] **Step 4**: Wait 5-15 min, then test both domains in browser
- [ ] **Verify**: Both domains show site with valid SSL certificate

---

## 🆘 TROUBLESHOOTING

### CloudFront Update Failed: "ETag mismatch"
```bash
# Get fresh ETag and try again:
aws cloudfront get-distribution-config --id ENEIEJY5P0XQA --output json > dist-config.json
ETAG=$(jq -r '.ETag' dist-config.json)
aws cloudfront update-distribution --id ENEIEJY5P0XQA --distribution-config file://dist-config.json --if-match "$ETAG"
```

### GitHub Actions Doesn't Trigger
```
Check 1: Did you push to 'main' or 'develop' branch? (not another branch)
Check 2: Did you modify files in 'site/' folder? (workflow only triggers on site/* changes)
Check 3: Go to Actions tab and check workflow status
```

### DNS Not Resolving
```
Wait 5-15 minutes for TTL to expire
Then: Clear browser cache (Ctrl+Shift+Del)
Or: Test in incognito window
If still fails: Go back to registrar and verify records were saved
```

### SSL Certificate Error
```
If you see "Certificate mismatch" error:
- Wait 5 minutes (CloudFront cache update)
- Verify CloudFront has correct ACM certificate
- Check: aws cloudfront get-distribution --id ENEIEJY5P0XQA | jq '.Distribution.DistributionConfig.ViewerCertificate'
```

---

## 📞 KEY COMMANDS REFERENCE

```bash
# View GitHub Actions status
# → https://github.com/stylingadventures-org/stylingadventures/actions

# Check CloudFront distribution
aws cloudfront get-distribution --id ENEIEJY5P0XQA

# View S3 bucket contents
aws s3 ls s3://webstack-webbucket12880f5b-wxfjj0fkn4ax --recursive

# Test DNS
nslookup stylingadventures.com
nslookup app.stylingadventures.com

# Test URL
curl -I https://stylingadventures.com
curl -I https://app.stylingadventures.com

# Check certificate
openssl s_client -connect stylingadventures.com:443 -servername stylingadventures.com
```

---

## 🎯 WHAT HAPPENS NEXT

**After Option A is complete (15 min):**
- ✅ Auto-deploy is active
- ✅ Both domains are live
- ✅ No more manual deployment needed

**Then do Option B:**
- Start building CREATOR tier (9 pages)
- Use template from `REMAINING_PAGES_BUILD_GUIDE.md`
- Estimated: 4.5 hours

**Total remaining work**: ~11 hours 15 minutes

---

**You're almost there!** ⚡

Once you complete these 4 steps, your deployment pipeline will be fully automated.

Then you can focus entirely on building the remaining 25 pages knowing that every code push automatically deploys to production. 🚀
