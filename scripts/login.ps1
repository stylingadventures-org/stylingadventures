<#  scripts/login.ps1
    - PKCE login against Cognito Hosted UI (no client secret)
    - Exchanges ?code= for tokens and sets $env:ID_TOKEN
    - Optional API test (presign + PUT + list)
#>

param(
  [switch]$NoTest,
  [string]$RegionOverride
)

# ---------- load outputs / defaults ----------
$projRoot    = (Resolve-Path "$PSScriptRoot\..").Path
$outputsPath = Join-Path $projRoot "outputs.json"

$cfg = $null
if (Test-Path $outputsPath) {
  try { $cfg = Get-Content $outputsPath -Raw | ConvertFrom-Json } catch {}
}

# NOTE: never allow a partial region like "u"
$ClientId   = if ($cfg -and $cfg.IdentityStack.UserPoolClientId) { $cfg.IdentityStack.UserPoolClientId } else { "7bkph1q2q1dgpk0497gk41t7tc" }
$Region     = if ($RegionOverride) { $RegionOverride }
             elseif ($cfg -and $cfg.IdentityStack.Region) { $cfg.IdentityStack.Region }
             else { "us-east-1" }
$Domain     = if ($cfg -and $cfg.IdentityStack.HostedUiDomainName) { $cfg.IdentityStack.HostedUiDomainName } else { "stylingadventures-256673" }
$CloudFront = if ($cfg -and $cfg.WebStack.CloudFrontDistributionDomainName) { $cfg.WebStack.CloudFrontDistributionDomainName } else { "d1682i07dc1r3k.cloudfront.net" }
$ApiBase    = if ($cfg -and $cfg.UploadsStack.ApiGatewayUrl) { ($cfg.UploadsStack.ApiGatewayUrl.TrimEnd('/')) } else { "https://02vsmdtge6.execute-api.us-east-1.amazonaws.com/prod" }

if ($Region -notmatch '^[a-z]{2}-[a-z-]+-\d$') {
  Write-Warning "Region '$Region' looks invalid; forcing 'us-east-1'."
  $Region = 'us-east-1'
}

$RedirectUri = "https://$CloudFront/callback/index.html"

Write-Host "Using:"
Write-Host "  ClientId:     $ClientId"
Write-Host "  Region:       $Region"
Write-Host "  Domain:       $Domain"
Write-Host "  Redirect URI: $RedirectUri"
Write-Host "  API base:     $ApiBase"
Write-Host ""

# Needed for HttpUtility in Windows PowerShell
try { Add-Type -AssemblyName System.Web -ErrorAction SilentlyContinue } catch {}

# ---------- helpers ----------
function To-Base64Url([byte[]]$bytes) {
  [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}
function New-CodeVerifier {
  $bytes = New-Object byte[] 64
  # PS5 and PS7 compatible
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  To-Base64Url $bytes
}
function New-CodeChallenge([string]$verifier) {
  $sha   = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($verifier)
  $hash  = $sha.ComputeHash($bytes)
  To-Base64Url $hash
}
function UrlEncode([string]$s) { [System.Uri]::EscapeDataString($s) }

function Invoke-Json {
  param([Parameter(Mandatory=$true)][string]$Method,
        [Parameter(Mandatory=$true)][string]$Uri,
        [hashtable]$Headers,
        [string]$Body)
  try {
    if ($Body) { Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers -Body $Body }
    else       { Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers }
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $reader = New-Object IO.StreamReader($resp.GetResponseStream())
      $text   = $reader.ReadToEnd()
      Write-Host "HTTP error body:" -ForegroundColor Yellow
      Write-Host $text
    }
    throw
  }
}

# ---------- Step 1: open Hosted UI ----------
$verifier  = New-CodeVerifier
$challenge = New-CodeChallenge $verifier

$authUrl = "https://$Domain.auth.$Region.amazoncognito.com/login" +
           "?client_id=$(UrlEncode $ClientId)" +
           "&response_type=code" +
           "&scope=$(UrlEncode 'openid profile email')" +
           "&redirect_uri=$(UrlEncode $RedirectUri)" +
           "&code_challenge_method=S256" +
           "&code_challenge=$challenge"

Write-Host "Hosted UI URL:"
Write-Host "  $authUrl"
Write-Host "Opening browser..."
try { Start-Process $authUrl } catch { Start-Process "cmd" "/c start `"$authUrl`"" }

Write-Host ""
$callback = (Read-Host "After sign-in, paste the FULL callback URL (?code=...)").Trim()
if (-not $callback -or ($callback -notlike "*code=*")) { throw "No callback URL with ?code=... was provided." }

# ---------- Step 2: parse code ----------
try {
  $uri  = [System.Uri]$callback
  $qs   = [System.Web.HttpUtility]::ParseQueryString($uri.Query)
  $code = ($qs["code"]).Trim()
} catch { throw "Could not parse code from the callback URL." }
if (-not $code) { throw "No 'code' param found." }

# ---------- Step 3: token exchange ----------
$tokenUrl = "https://$Domain.auth.$Region.amazoncognito.com/oauth2/token"
$headers  = @{ "Content-Type" = "application/x-www-form-urlencoded" }
$bodyKv   = @{
  grant_type    = "authorization_code"
  client_id     = $ClientId
  code          = $code
  redirect_uri  = $RedirectUri        # MUST match the auth request exactly
  code_verifier = $verifier
}
$bodyForm = ($bodyKv.GetEnumerator() | ForEach-Object { "$(UrlEncode $_.Key)=$(UrlEncode $_.Value)" }) -join "&"

Write-Host "Exchanging code for tokens..."
try {
  $tok = Invoke-Json -Method Post -Uri $tokenUrl -Headers $headers -Body $bodyForm
} catch {
  throw "Token exchange failed. (Check clientId/domain/region/redirectUri and that you pasted the FULL callback URL.)"
}

# ---------- Step 4: show + export ----------
$id  = $tok.id_token
$acc = $tok.access_token
$ref = $tok.refresh_token

Write-Host ""
Write-Host "ID token (prefix): $($id.Substring(0, 40))..."
Write-Host "Access  (prefix): $($acc.Substring(0, 40))..."
if ($ref) { Write-Host "Refresh (prefix): $($ref.Substring(0, 20))..." }

$env:ID_TOKEN = $id
Write-Host "`$env:ID_TOKEN set for this shell session."

# ---------- Step 5: optional API test ----------
if (-not $NoTest) {
  Write-Host ""
  Write-Host "Testing Uploads API (presign -> PUT -> list)..."

  $preBody = @{ key = "ps-test.txt"; contentType = "text/plain" } | ConvertTo-Json -Compress
  $pre = Invoke-Json -Method Post -Uri "$ApiBase/presign" `
          -Headers @{ Authorization = $id; "Content-Type" = "application/json" } `
          -Body $preBody

  Invoke-RestMethod -Method Put -Uri $pre.url -Headers @{ "Content-Type" = "text/plain" } -Body "hello from powershell"

  $lst = Invoke-Json -Method Get -Uri "$ApiBase/list" -Headers @{ Authorization = $id }
  Write-Host "List items:"; $lst.items | ForEach-Object { "  - $_" }
  Write-Host "Done."
}
