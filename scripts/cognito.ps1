# scripts/cognito.ps1
# PowerShell helpers for Cognito PKCE, refresh, and logout

function Login-CognitoPkce {
  [CmdletBinding()]
  param(
    [string]$Region   = "us-east-1",
    [Parameter(Mandatory=$true)][string]$Domain,     # e.g. sa-dev-637423256673
    [Parameter(Mandatory=$true)][string]$ClientId,   # e.g. 51uc25i7ob3otirvgi66mpht79
    [Parameter(Mandatory=$true)][string]$Redirect    # e.g. https://<cloudfront>/callback/index.html
  )

  # --- PKCE (single pair used for both steps) ---
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $script:PKCE_Verifier  = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
  $challengeBytes        = [Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($script:PKCE_Verifier))
  $PKCE_Challenge        = [Convert]::ToBase64String($challengeBytes).TrimEnd('=').Replace('+','-').Replace('/','_')

  # --- Open Hosted UI ---
  $loginUrl  = "https://$Domain.auth.$Region.amazoncognito.com/login?client_id=$ClientId&response_type=code&scope=openid+email+profile&redirect_uri=$([uri]::EscapeDataString($Redirect))&code_challenge_method=S256&code_challenge=$PKCE_Challenge"
  Start-Process $loginUrl
  Write-Host "After sign-in you'll land on: $Redirect?code=XXXXX" -ForegroundColor Cyan

  # --- Read full URL or just the code ---
  $raw = Read-Host "Paste FULL callback URL (or just the ?code=...)"
  if ($raw -match '^https?://') {
    if ($raw -notmatch 'code=([^&]+)') { throw "No ?code= found in what you pasted." }
    $code = $Matches[1]
  } else {
    $code = $raw
  }

  # --- Exchange code for tokens (MUST use same verifier + redirect) ---
  $tokenEndpoint = "https://$Domain.auth.$Region.amazoncognito.com/oauth2/token"
  $body = "grant_type=authorization_code&client_id=$ClientId&code=$code&redirect_uri=$([uri]::EscapeDataString($Redirect))&code_verifier=$script:PKCE_Verifier"

  try {
    $tokens = Invoke-RestMethod -Method Post -Uri $tokenEndpoint -Headers @{ 'Content-Type'='application/x-www-form-urlencoded' } -Body $body
  } catch {
    if ($_.Exception.Response) {
      $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
      $errBody = $sr.ReadToEnd(); $sr.Close()
      Write-Host "`nToken error from Cognito:`n$errBody" -ForegroundColor Red
    }
    throw
  }

  # Expose convenient globals for the rest of your session
  Set-Variable -Name ID      -Scope Global -Value $tokens.id_token
  Set-Variable -Name ACCESS  -Scope Global -Value $tokens.access_token
  Set-Variable -Name REFRESH -Scope Global -Value $tokens.refresh_token

  "ID token prefix: " + $tokens.id_token.Substring(0,30)
  return $tokens
}

function Refresh-CognitoToken {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory=$true)][string]$Domain,
    [Parameter(Mandatory=$true)][string]$Region,
    [Parameter(Mandatory=$true)][string]$ClientId,
    [Parameter(Mandatory=$true)][string]$RefreshToken
  )
  $tokenEndpoint = "https://$Domain.auth.$Region.amazoncognito.com/oauth2/token"
  $body = "grant_type=refresh_token&client_id=$ClientId&refresh_token=$RefreshToken"

  $tokens = Invoke-RestMethod -Method Post -Uri $tokenEndpoint -Headers @{ 'Content-Type'='application/x-www-form-urlencoded' } -Body $body

  # Update globals in-place (fixed typo on REFRESH line)
  if ($tokens.id_token)     { Set-Variable -Name ID      -Scope Global -Value $tokens.id_token }
  if ($tokens.access_token) { Set-Variable -Name ACCESS  -Scope Global -Value $tokens.access_token }
  if ($tokens.refresh_token){ Set-Variable -Name REFRESH -Scope Global -Value $tokens.refresh_token }

  "Refreshed. New ID token prefix: " + $ID.Substring(0,30)
  return $tokens
}

function Build-CognitoLogoutUrl {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory=$true)][string]$Domain,
    [Parameter(Mandatory=$true)][string]$Region,
    [Parameter(Mandatory=$true)][string]$ClientId,
    [Parameter(Mandatory=$true)][string]$LogoutUri   # e.g. https://<cloudfront>/logout/index.html
  )
  return "https://$Domain.auth.$Region.amazoncognito.com/logout?client_id=$ClientId&logout_uri=$([uri]::EscapeDataString($LogoutUri))&response_type=code"
}

function Invoke-AppSyncHello {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory=$true)][string]$Endpoint,  # https://...appsync-api.../graphql
    [Parameter(Mandatory=$true)][string]$IdToken
  )
  Invoke-RestMethod -Method Post -Uri $Endpoint -Headers @{
    'Content-Type'='application/json'
    'Authorization'=$IdToken
  } -Body '{"query":"{ hello }"}'
}

function Invoke-UploadsPresignList {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory=$true)][string]$ApiBase,   # https://...execute-api.../prod/
    [Parameter(Mandatory=$true)][string]$IdToken
  )
  $ApiBase = $ApiBase.TrimEnd('/') + '/'
  $r = Invoke-RestMethod -Method Post -Uri ($ApiBase + "presign") -Headers @{
    'Authorization'=$IdToken
    'Content-Type'='application/json'
  } -Body '{"key":"test.txt","contentType":"text/plain"}'
  Invoke-RestMethod -Method Put -Uri $r.url -Headers @{ 'Content-Type'='text/plain' } -Body 'hello lala'
  Invoke-RestMethod -Method Get -Uri ($ApiBase + "list") -Headers @{ 'Authorization'=$IdToken }
}
