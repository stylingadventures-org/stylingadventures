# 🎯 VISUAL EXECUTION GUIDE - OPTION A STEP BY STEP

**Print this out or keep it on screen while executing!**

---

## ⏱️ STEP 1: UPDATE CLOUDFRONT (5 minutes)

### 1️⃣ Run This Command
```bash
aws cloudfront get-distribution-config --id ENEIEJY5P0XQA --output json > dist-config.json
```

**What happens**: Downloads your CloudFront config to a file called `dist-config.json`

**Time**: 5-10 seconds

---

### 2️⃣ Open dist-config.json File

In VS Code or any text editor:
1. Open: `dist-config.json` (just created)
2. Press: `Ctrl+F` (Find)
3. Search for: `"Aliases":`
4. You'll find this section (around line 10):

```json
"Aliases": {
  "Quantity": 1,
  "Items": [
    "app.stylingadventures.com"
  ]
}
```

---

### 3️⃣ Edit the Aliases Section

**CHANGE FROM THIS:**
```json
"Aliases": {
  "Quantity": 1,
  "Items": [
    "app.stylingadventures.com"
  ]
}
```

**TO THIS:**
```json
"Aliases": {
  "Quantity": 2,
  "Items": [
    "stylingadventures.com",
    "app.stylingadventures.com"
  ]
}
```

**Changes to make**:
- [ ] Change `"Quantity"` from `1` to `2`
- [ ] Add `"stylingadventures.com",` before `"app.stylingadventures.com"`
- [ ] Save the file (Ctrl+S)

---

### 4️⃣ Get the ETag Value

The ETag is a unique identifier needed for the update. Run this command:

```bash
ETAG=$(jq -r '.ETag' dist-config.json)
echo "Your ETag: $ETAG"
```

**What happens**: Displays your ETag value (looks like: `E123ABC45XYZ`)  
**Copy**: The ETag value shown (you'll need it next)

---

### 5️⃣ Update CloudFront

Replace `YOUR_ETAG_HERE` with the actual ETag from Step 4, then run:

```bash
aws cloudfront update-distribution \
  --id ENEIEJY5P0XQA \
  --distribution-config file://dist-config.json \
  --if-match "YOUR_ETAG_HERE"
```

**Example** (with real ETag):
```bash
aws cloudfront update-distribution \
  --id ENEIEJY5P0XQA \
  --distribution-config file://dist-config.json \
  --if-match "E1234ABC5678XYZ"
```

**What happens**: Updates CloudFront with both domain aliases  
**Time**: 10-20 seconds  
**Expected**: Successful response with JSON output

---

### 6️⃣ Verify the Update

```bash
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

**If you see 2 items** ✅ SUCCESS! Move to Step 2

**If you see an error** → Run Step 4 and 5 again with fresh ETag

---

## 🌍 STEP 2: ADD DNS RECORDS (5 minutes)

### Choose Your Registrar

#### 📍 If Using GoDaddy
1. Go to: **godaddy.com/products/domains**
2. Find and click: **stylingadventures.com**
3. Click: **DNS** button
4. Look for: **CNAME Records** section
5. Add Record 1:
   - **Name**: `@` (means root domain)
   - **Type**: `CNAME`
   - **Value**: `d3fghr37bcpbig.cloudfront.net`
   - **TTL**: `300`
   - Click: **Add**
6. Add Record 2:
   - **Name**: `app`
   - **Type**: `CNAME`
   - **Value**: `d3fghr37bcpbig.cloudfront.net`
   - **TTL**: `300`
   - Click: **Add**
7. Click: **Save** (top right)

#### 📍 If Using Namecheap
1. Go to: **namecheap.com/domains**
2. Find: **stylingadventures.com**
3. Click: **Manage**
4. Go to: **Advanced DNS** tab
5. Add Record 1:
   - **Type**: Select `CNAME Record`
   - **Host**: `@`
   - **Value**: `d3fghr37bcpbig.cloudfront.net`
   - **TTL**: `300`
   - Click: **Save**
6. Add Record 2:
   - **Type**: Select `CNAME Record`
   - **Host**: `app`
   - **Value**: `d3fghr37bcpbig.cloudfront.net`
   - **TTL**: `300`
   - Click: **Save**

#### 📍 If Using AWS Route 53
```bash
# Run these commands (replace Z123456789ABC with your Hosted Zone ID)

# Record 1 - Root domain
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

# Record 2 - App subdomain
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

### After Adding Records

**Important**: Wait 5-15 minutes for DNS propagation  
**What happens**: DNS servers around the world update their records  
**Continue to Step 3** while waiting

---

## 🧪 STEP 3: TEST AUTO-DEPLOY (3 minutes)

### 1️⃣ Make a Test Change

Open any file in the `site/` folder and make a small change:

**Option A - Edit a comment:**
```bash
# In your terminal, run:
echo "<!-- test deployment $(date) -->" >> site/public/index.html
```

**Option B - Edit in VS Code:**
1. Open: `site/public/index.html`
2. Add at end: `<!-- test deployment $(date) -->`
3. Save (Ctrl+S)

---

### 2️⃣ Commit and Push

```bash
git add site/public/index.html
git commit -m "test: verify auto-deploy works"
git push origin main
```

**What happens**:
- Your changes push to GitHub
- GitHub Actions automatically detects the change
- Deploy workflow starts automatically
- Website builds and deploys in ~2 minutes

---

### 3️⃣ Watch Deployment

**Open GitHub Actions in your browser:**
```
https://github.com/stylingadventures-org/stylingadventures/actions
```

You'll see:
```
Deploy Frontend (workflow)
├─ Run started just now
├─ ⏳ Checkout
├─ ⏳ Setup Node.js
├─ ⏳ Install dependencies
├─ ⏳ Build frontend
├─ ⏳ Configure AWS
├─ ⏳ Deploy to S3
└─ ⏳ Invalidate CloudFront
```

**Wait for all steps to complete** (should take 1-2 minutes)

**Expected result**: All steps show ✅ (green checkmark)

**If any step shows ❌ (red X)**: Click on it to see error details

---

## ✅ STEP 4: VERIFY DOMAINS LIVE (5-15 minutes)

### 1️⃣ Wait for DNS Propagation

**Time to wait**: 5-15 minutes from Step 2

You can check if DNS is ready:
```bash
nslookup stylingadventures.com
```

**Expected output:**
```
Name:   stylingadventures.com
Address: d3fghr37bcpbig.cloudfront.net
```

If you see a different IP address or "Server: Not Found", wait a few more minutes.

---

### 2️⃣ Test in Terminal

```bash
# Test root domain
curl -I https://stylingadventures.com
```

**Expected output:**
```
HTTP/2 200
server: CloudFront
...
```

---

### 3️⃣ Test in Browser

Open these URLs in your browser:

**Test 1:**
```
https://stylingadventures.com
```

**Test 2:**
```
https://app.stylingadventures.com
```

**Expected**:
- ✅ Page loads
- ✅ Green lock icon (HTTPS/SSL working)
- ✅ Your Styling Adventures app displays
- ✅ No certificate errors

---

## 🎉 OPTION A COMPLETE!

If all 4 steps succeeded, you now have:

✅ Auto-deploy activated  
✅ Both domains live  
✅ SSL certificates working  
✅ No manual deployment needed  

---

## 🔄 NEXT: OPTION B (Start Building Pages)

After confirming domains work:

### Create Creator Directory
```bash
mkdir -p site/src/pages/Creator
```

### Create First Page
Copy template from `REMAINING_PAGES_BUILD_GUIDE.md` and create:
```
site/src/pages/Creator/CreatorHome.tsx
```

### Update App.tsx
Add import:
```typescript
import { CreatorHome } from './pages/Creator/CreatorHome';
```

Add to PageType:
```typescript
| 'creatorhome'
```

Add to renderPage():
```typescript
case 'creatorhome':
  return <CreatorHome />;
```

### Test
```bash
cd site
npm run dev
# Navigate to CreatorHome in your app
```

### Deploy
```bash
git add site/src/pages/Creator/CreatorHome.tsx site/src/App.tsx
git commit -m "feat: add creator home page"
git push origin main
# Auto-deploys! ✨
```

---

## 📞 TROUBLESHOOTING

### "ETag mismatch" error
```
Run Step 4 and 5 again with a fresh ETag:
ETAG=$(jq -r '.ETag' dist-config.json)
aws cloudfront update-distribution --id ENEIEJY5P0XQA --distribution-config file://dist-config.json --if-match "$ETAG"
```

### "CloudFront update failed"
```
Wait 1 minute (another update might be in progress)
Then try again with fresh ETag
```

### "DNS still not resolving" (after 15 minutes)
```
Check your registrar settings to confirm records were saved
Clear browser cache (Ctrl+Shift+Del)
Try incognito window
If still failing, contact your registrar support
```

### "GitHub Actions didn't trigger"
```
Check 1: Did you push to 'main' branch? (not another branch)
Check 2: Did you modify files in 'site/' folder?
Check 3: Wait 30 seconds for GitHub to register the push
```

---

## ⏱️ TIME TRACKER

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Update CloudFront | 5 min | ⏳ |
| 2 | Add DNS Records | 5 min | ⏳ |
|   | Wait for propagation | 5-15 min | ⏳ |
| 3 | Test Auto-Deploy | 3 min | ⏳ |
| 4 | Verify Domains | 5 min | ⏳ |
|   | **TOTAL OPTION A** | **~20-30 min** | ⏳ |
|   | OPTION B (pages) | ~11 hours | ⏰ |

---

**START NOW** → Begin with Step 1 above! 🚀

All commands are ready to copy and paste.

No additional setup needed.

Just follow the steps in order!

Let me know when you complete each step! ✨
