# 🚀 DEPLOY ROOT DOMAIN - stylingadventures.com

**Status:** ✅ Ready to deploy  
**Date:** December 26, 2025

---

## ⚡ QUICK START (Copy & Paste)

### Step 1: Update CloudFront (2 minutes)

```bash
# Download config
aws cloudfront get-distribution-config --id ENEIEJY5P0XQA --output json > dist-config.json
```

### Step 2: Edit dist-config.json

Open `dist-config.json` and find:
```json
"Aliases": {
  "Quantity": 1,
  "Items": [
    "app.stylingadventures.com"
  ]
}
```

Change to:
```json
"Aliases": {
  "Quantity": 2,
  "Items": [
    "stylingadventures.com",
    "app.stylingadventures.com"
  ]
}
```

Save file (Ctrl+S)

### Step 3: Get ETag & Update

```bash
# Get ETag
ETAG=$(jq -r '.ETag' dist-config.json)
echo $ETAG

# Update CloudFront (replace YOUR_ETAG_HERE with actual ETag)
aws cloudfront update-distribution \
  --id ENEIEJY5P0XQA \
  --distribution-config file://dist-config.json \
  --if-match "YOUR_ETAG_HERE"
```

### Step 4: Add DNS Records

**Choose your registrar:**

#### GoDaddy
1. Go to: godaddy.com/products/domains
2. Click: stylingadventures.com
3. Click: DNS
4. Add CNAME:
   - Name: `@`
   - Type: CNAME
   - Value: `d3fghr37bcpbig.cloudfront.net`
   - TTL: 300
5. Save

#### Namecheap
1. Go to: namecheap.com/domains
2. Click: stylingadventures.com → Manage
3. Go to: Advanced DNS
4. Add CNAME:
   - Host: `@`
   - Type: CNAME Record
   - Value: `d3fghr37bcpbig.cloudfront.net`
   - TTL: 300
5. Save

#### Route 53
```bash
# Replace Z123456789ABC with your Hosted Zone ID
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

### Step 5: Wait & Verify

Wait 5-15 minutes for DNS propagation.

Check:
```bash
nslookup stylingadventures.com
```

Expected: Should show CloudFront domain

### Step 6: Test

```bash
# Terminal test
curl -I https://stylingadventures.com

# Browser test
https://stylingadventures.com
```

---

## 📊 Expected Results

After completing all steps:

✅ `https://stylingadventures.com` - Works  
✅ `https://app.stylingadventures.com` - Works  
✅ All FAN pages public  
✅ Responsive design fixed  
✅ Both domains serve same content  

---

## 🔍 How to Verify

### In Terminal
```bash
# Check CloudFront aliases
aws cloudfront get-distribution --id ENEIEJY5P0XQA | jq '.Distribution.DistributionConfig.Aliases'

# Should show:
# {
#   "Quantity": 2,
#   "Items": [
#     "stylingadventures.com",
#     "app.stylingadventures.com"
#   ]
# }

# Check DNS resolution
nslookup stylingadventures.com
nslookup app.stylingadventures.com

# Test HTTP response
curl -I https://stylingadventures.com
curl -I https://app.stylingadventures.com
```

### In Browser
1. Visit: `https://stylingadventures.com`
2. Check green lock icon (HTTPS)
3. Verify page loads without errors
4. Test navigation to FAN pages
5. Test responsive design (resize window)

---

## ❌ Troubleshooting

### "ETag mismatch" error
→ Get fresh ETag: `ETAG=$(jq -r '.ETag' dist-config.json)` and retry

### DNS still not working after 15 min
→ Check registrar settings, clear browser cache, try incognito

### HTTPS certificate error
→ CloudFront may need 30-60 minutes to fully propagate

### "Access denied" error
→ Verify AWS credentials: `aws sts get-caller-identity`

---

## ✅ Summary

| Task | Time | Status |
|------|------|--------|
| Update CloudFront | 2 min | ⏳ Ready |
| Add DNS Records | 2 min | ⏳ Ready |
| Wait for DNS | 5-15 min | ⏳ Ready |
| Verify Domains | 2 min | ⏳ Ready |
| **TOTAL** | **11-21 min** | **⏳ Ready** |

---

## 🎯 Current Status

```
✅ FAN Pages: PUBLIC
✅ Sizing Issues: FIXED
✅ Build: SUCCESSFUL
✅ Dev Server: RUNNING (http://localhost:5173/)
⏳ Root Domain: READY TO DEPLOY
```

**Next:** Follow steps 1-6 above to deploy `https://stylingadventures.com` 🚀
