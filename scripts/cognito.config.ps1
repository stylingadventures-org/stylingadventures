# scripts/cognito.config.ps1  (updated)

# ---- Cognito / endpoints ----
$Region   = "us-east-1"
$Domain   = "sa-dev-637423256673"   # Hosted UI domain prefix (NOT a full URL)
$ClientId = "51uc25i7ob3otirvgi66mpht79"

# ---- Backends ----
$APPSYNC  = "https://eijy6lsdhfctnibr35yon7v5qu.appsync-api.us-east-1.amazonaws.com/graphql"
$UPLOADS  = "https://r9mrarhdxa.execute-api.us-east-1.amazonaws.com/prod/"

# ---- CDN + redirects (must exactly match Cognito allow-list) ----
$CF       = "https://d1682i07dc1r3k.cloudfront.net"
$Redirect = "$CF/callback/index.html"
$Logout   = "$CF/logout/index.html"

# Optional: convenience object if you dot-source this file
$CognitoConfig = [pscustomobject]@{
  Region   = $Region
  Domain   = $Domain
  ClientId = $ClientId
  AppSync  = $APPSYNC
  Uploads  = $UPLOADS
  CloudFront = $CF
  Redirect   = $Redirect
  Logout     = $Logout
}
