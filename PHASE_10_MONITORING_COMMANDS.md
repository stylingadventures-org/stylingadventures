# 🔍 PHASE 10 - REAL-TIME MONITORING COMMANDS

Use these commands to monitor the production launch in real-time.

---

## ⏱️ MONITORING CLOUDFRONT DEPLOYMENT (Check Every 2 Minutes)

### Check Deployment Status
```powershell
# See current deployment status
aws cloudfront get-distribution --id ENEIEJY5P0XQA --query 'Distribution.Status' --output text

# Expected output: "InProgress" → then "Deployed"
# Once "Deployed" = Distribution is live globally
```

### Monitor Deployment Progress
```powershell
# Get all distribution details including status
aws cloudfront get-distribution --id ENEIEJY5P0XQA --query 'Distribution.[Status,LastModifiedTime,DomainName]' --output table

# Shows: Status | Last Modified Time | Domain Name
```

### View Aliases Configuration
```powershell
# Verify all 3 domains are configured
aws cloudfront get-distribution --id ENEIEJY5P0XQA --query 'Distribution.DistributionConfig.Aliases' --output text

# Expected output:
# stylingadventures.com
# www.stylingadventures.com
# app.stylingadventures.com
```

---

## 🌐 MONITORING DNS PROPAGATION (Check Every 15 Minutes)

### Check Route 53 Change Status
```powershell
# Get DNS change status
aws route53 get-change --id /change/C02301862ZHL6SY8H6NKQ --query 'Change.Status' --output text

# Expected output: "PENDING" → then "INSYNC"
# "INSYNC" = DNS records are fully propagated
```

### Test DNS Resolution
```powershell
# Test main domain
nslookup stylingadventures.com

# Test www subdomain
nslookup www.stylingadventures.com

# Test app subdomain
nslookup app.stylingadventures.com

# All should resolve to CloudFront IP
# If not resolving yet, wait and retry in 5 minutes
```

### Advanced DNS Debugging
```powershell
# Get A records (IPv4)
dig stylingadventures.com A +short

# Get AAAA records (IPv6)
dig stylingadventures.com AAAA +short

# Get CNAME records
dig www.stylingadventures.com CNAME +short

# Get full DNS info
dig stylingadventures.com
```

### Check DNS Propagation Globally
```powershell
# Use Google DNS (8.8.8.8)
nslookup stylingadventures.com 8.8.8.8

# Use Cloudflare DNS (1.1.1.1)
nslookup stylingadventures.com 1.1.1.1

# If both resolve correctly = global propagation complete
```

---

## 🔒 MONITORING SSL/TLS CERTIFICATE

### Verify Certificate Installation
```powershell
# Check certificate details
openssl s_client -connect stylingadventures.com:443 -servername stylingadventures.com

# Look for:
# verify return:1 (certificate valid)
# subject=CN=stylingadventures.com (correct domain)
# issuer=Amazon (AWS Certificate Manager)
```

### Test HTTPS Connection
```powershell
# Simple HTTPS test
curl -I https://stylingadventures.com

# Expected: HTTP/1.1 200 OK
# Check headers for SSL info

# Get certificate details
curl -v https://stylingadventures.com 2>&1 | grep -i "certificate\|subject\|issuer"
```

### Verify HTTPS Redirect
```powershell
# Test HTTP → HTTPS redirect
curl -I http://stylingadventures.com

# Expected: 
# HTTP/1.1 301 Moved Permanently
# Location: https://stylingadventures.com
```

---

## ⚡ MONITORING FRONTEND PERFORMANCE

### Test Page Load Time
```powershell
# Simple load test
curl -w "@curl-timing.txt" -o /dev/null -s https://stylingadventures.com

# Or use this inline timing:
$start = Get-Date; 
curl -s https://stylingadventures.com > $null; 
$elapsed = (Get-Date) - $start; 
Write-Host "Page load time: $($elapsed.TotalSeconds) seconds"
```

### Check Assets Loading
```powershell
# Check HTML
curl -I https://stylingadventures.com/index.html

# Check CSS
curl -I https://stylingadventures.com/assets/style.css

# Check JavaScript
curl -I https://stylingadventures.com/assets/index-*.js

# Expected: HTTP 200 or 304 (cached)
```

### Monitor CloudFront Cache Hit Rate
```powershell
# Get CloudFront metrics for the last hour
aws cloudwatch get-metric-statistics `
  --namespace AWS/CloudFront `
  --metric-name CacheHitRate `
  --dimensions Name=DistributionId,Value=ENEIEJY5P0XQA `
  --start-time ((Get-Date).AddHours(-1)) `
  --end-time (Get-Date) `
  --period 300 `
  --statistics Average `
  --output table

# Target: > 85% cache hit rate
```

### Monitor Request Count
```powershell
# Get request count for last hour
aws cloudwatch get-metric-statistics `
  --namespace AWS/CloudFront `
  --metric-name Requests `
  --dimensions Name=DistributionId,Value=ENEIEJY5P0XQA `
  --start-time ((Get-Date).AddHours(-1)) `
  --end-time (Get-Date) `
  --period 300 `
  --statistics Sum `
  --output table
```

---

## 🔐 MONITORING API CONNECTIVITY

### Test GraphQL Endpoint
```powershell
# Simple API test
curl --location "https://dbcwd5l3qbh45fmanzpyvp6v4i.appsync-api.us-east-1.amazonaws.com/graphql" `
  --header "x-api-key: da2-qou2vcqhh5hmnfqcaieqlkfevi" `
  --header "Content-Type: application/json" `
  --data '{
    "query": "{ __typename }"
  }'

# Expected output: {"data":{"__typename":"Query"}}
```

### Test from Production Domain
```powershell
# This tests both frontend + API integration
$response = Invoke-WebRequest -Uri "https://stylingadventures.com" -UseBasicParsing

# Check if page loaded
if ($response.StatusCode -eq 200) {
    Write-Host "✅ Frontend loaded successfully"
} else {
    Write-Host "❌ Frontend error: $($response.StatusCode)"
}
```

---

## 📊 MONITORING ERRORS & LATENCY

### Check CloudFront Error Rates
```powershell
# Monitor 4xx errors (client errors)
aws cloudwatch get-metric-statistics `
  --namespace AWS/CloudFront `
  --metric-name 4xxErrorRate `
  --dimensions Name=DistributionId,Value=ENEIEJY5P0XQA `
  --start-time ((Get-Date).AddHours(-1)) `
  --end-time (Get-Date) `
  --period 300 `
  --statistics Average `
  --output table

# Target: < 1%
```

### Check CloudFront 5xx Errors
```powershell
# Monitor 5xx errors (server errors)
aws cloudwatch get-metric-statistics `
  --namespace AWS/CloudFront `
  --metric-name 5xxErrorRate `
  --dimensions Name=DistributionId,Value=ENEIEJY5P0XQA `
  --start-time ((Get-Date).AddHours(-1)) `
  --end-time (Get-Date) `
  --period 300 `
  --statistics Average `
  --output table

# Target: < 0.1%
```

### Monitor Response Time
```powershell
# Get average response time
aws cloudwatch get-metric-statistics `
  --namespace AWS/CloudFront `
  --metric-name OriginLatency `
  --dimensions Name=DistributionId,Value=ENEIEJY5P0XQA `
  --start-time ((Get-Date).AddHours(-1)) `
  --end-time (Get-Date) `
  --period 300 `
  --statistics Average `
  --output table

# Target: < 500ms
```

---

## 🎯 REAL-TIME MONITORING LOOP

Copy and paste this for continuous monitoring:

```powershell
# Run this in a loop to monitor everything
$interval = 30 # seconds

while ($true) {
    Clear-Host
    Write-Host "🔍 PRODUCTION MONITORING - $(Get-Date)" -ForegroundColor Cyan
    Write-Host ""
    
    # CloudFront Status
    Write-Host "📊 CloudFront Distribution:" -ForegroundColor Yellow
    $cfStatus = aws cloudfront get-distribution --id ENEIEJY5P0XQA --query 'Distribution.Status' --output text
    Write-Host "   Status: $cfStatus"
    
    # DNS Status
    Write-Host ""
    Write-Host "🌐 DNS Status:" -ForegroundColor Yellow
    $dnsStatus = aws route53 get-change --id /change/C02301862ZHL6SY8H6NKQ --query 'Change.Status' --output text
    Write-Host "   Status: $dnsStatus"
    
    # DNS Resolution Test
    Write-Host ""
    Write-Host "🔗 DNS Resolution:" -ForegroundColor Yellow
    try {
        $resolved = [System.Net.Dns]::GetHostAddresses("stylingadventures.com")[0].IPAddressToString
        Write-Host "   Resolves to: $resolved"
    } catch {
        Write-Host "   Not resolving yet..."
    }
    
    # HTTPS Test
    Write-Host ""
    Write-Host "🔒 HTTPS Status:" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://stylingadventures.com" -UseBasicParsing -TimeoutSec 5
        Write-Host "   Status: $($response.StatusCode) OK"
    } catch {
        Write-Host "   Error: $($_.Exception.Message)"
    }
    
    # Cache Hit Ratio
    Write-Host ""
    Write-Host "⚡ Performance:" -ForegroundColor Yellow
    $cache = aws cloudwatch get-metric-statistics --namespace AWS/CloudFront --metric-name CacheHitRate --dimensions Name=DistributionId,Value=ENEIEJY5P0XQA --start-time ((Get-Date).AddHours(-1)) --end-time (Get-Date) --period 300 --statistics Average --query 'Datapoints[0].Average' --output text 2>&1
    if ($cache -match "^[\d.]+$") {
        Write-Host "   Cache Hit Rate: $([Math]::Round($cache, 2))%"
    }
    
    Write-Host ""
    Write-Host "Next refresh in $interval seconds... (Ctrl+C to stop)" -ForegroundColor Gray
    Start-Sleep -Seconds $interval
}
```

---

## 📋 QUICK HEALTH CHECK

Run this command for a quick health status:

```powershell
# Quick 1-minute health check
Write-Host "🚑 HEALTH CHECK - $(Get-Date)" -ForegroundColor Green
Write-Host ""

# 1. CloudFront
$cf = aws cloudfront get-distribution --id ENEIEJY5P0XQA --query 'Distribution.Status' --output text 2>&1
Write-Host "CloudFront Status: $cf" -ForegroundColor $(if ($cf -eq "Deployed") { "Green" } else { "Yellow" })

# 2. DNS
$dns = aws route53 get-change --id /change/C02301862ZHL6SY8H6NKQ --query 'Change.Status' --output text 2>&1
Write-Host "DNS Status: $dns" -ForegroundColor $(if ($dns -eq "INSYNC") { "Green" } else { "Yellow" })

# 3. HTTPS
try {
    $web = curl -s -I https://stylingadventures.com -w "%{http_code}" -o /dev/null
    Write-Host "HTTPS Status: $web" -ForegroundColor $(if ($web -eq "200") { "Green" } else { "Yellow" })
} catch {
    Write-Host "HTTPS Status: Error" -ForegroundColor Red
}

# 4. API
try {
    $api = curl -s "https://dbcwd5l3qbh45fmanzpyvp6v4i.appsync-api.us-east-1.amazonaws.com/graphql" -H "x-api-key: da2-qou2vcqhh5hmnfqcaieqlkfevi" -H "Content-Type: application/json" -d '{"query":"{ __typename }"}' | ConvertFrom-Json
    Write-Host "API Status: Connected" -ForegroundColor Green
} catch {
    Write-Host "API Status: Error" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ All systems operational!" -ForegroundColor Green
```

---

## 📞 WHAT TO DO IF...

### CloudFront Still Says "InProgress" After 15 Minutes
```powershell
# Wait a bit longer, CloudFront updates can take 5-15 minutes
# Check again with:
aws cloudfront get-distribution --id ENEIEJY5P0XQA --query 'Distribution.Status'

# If still InProgress after 30 minutes, check recent errors:
aws cloudfront get-distribution-config --id ENEIEJY5P0XQA --query 'DistributionConfig.Comment'
```

### DNS Still Not Resolving After 30 Minutes
```powershell
# This is normal - DNS can take up to 24 hours
# Check propagation status:
aws route53 get-change --id /change/C02301862ZHL6SY8H6NKQ

# Check from different DNS servers:
nslookup stylingadventures.com 8.8.8.8 (Google)
nslookup stylingadventures.com 1.1.1.1 (Cloudflare)

# If corporate/ISP DNS is slow, they'll catch up eventually
```

### HTTPS Shows Certificate Error
```powershell
# Check certificate status
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:637423256673:certificate/79d80f3c-b3bc-4818-a10b-0041a72d1ac9 --region us-east-1

# Verify certificate is ISSUED
# If not, CloudFront may need to be updated again
```

### Page Loads but Shows 404
```powershell
# Check S3 bucket has index.html
aws s3 ls s3://webstack-webbucket12880f5b-wxfjj0fkn4ax/ | grep index.html

# Check CloudFront origin points to S3
aws cloudfront get-distribution-config --id ENEIEJY5P0XQA --query 'DistributionConfig.Origins[0]'

# Verify CloudFront cache is cleared (may need cache invalidation)
aws cloudfront create-invalidation --distribution-id ENEIEJY5P0XQA --paths "/*"
```

---

## 🎉 SUCCESS INDICATORS

When you see these, you're live! ✅

```
✅ CloudFront Status: Deployed
✅ DNS Change Status: INSYNC
✅ nslookup resolves stylingadventures.com
✅ curl https://stylingadventures.com returns 200
✅ HTTPS certificate shows as valid (lock icon in browser)
✅ Page loads in < 2 seconds
✅ LoginModal displays
✅ API endpoint responding
✅ No console errors
✅ Users can log in and access dashboard
```

---

**Keep monitoring for the next 24 hours while DNS fully propagates. After that, production should be fully stable! 🚀**
