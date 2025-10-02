. "$PSScriptRoot\cognito.config.ps1"

param(
  [switch]$RefreshOnly,     # just refresh using $REFRESH (no browser)
  [switch]$OpenLogout       # open the logout URL at the end
)

$ErrorActionPreference = 'Stop'

# --- Locate & import helpers + config ---
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$cog  = Join-Path $here 'cognito.ps1'
$cfg  = Join-Path $here 'cognito.config.ps1'

if (!(Test-Path $cog)) { throw "Missing $cog. Create it first (contains Login-CognitoPkce, Invoke-AppSyncHello, etc.)." }
. $cog

if (!(Test-Path $cfg)) { throw "Missing $cfg. Create it first with your Region/Domain/ClientId/CF/APPSYNC/UPLOADS, etc." }
. $cfg

# --- Guardrails ---
$required = @('Region','Domain','ClientId','Redirect','APPSYNC','UPLOADS','Logout')

# Look up variables using session state (searches scope chain)
$missing = foreach ($n in $required) {
  if (-not $ExecutionContext.SessionState.PSVariable.Get($n)) { $n }
}

if ($missing.Count) {
  throw "Missing in cognito.config.ps1: $($missing -join ', ')"
}

# --- Main flow ---
if ($RefreshOnly) {
  if (-not $REFRESH) { throw "No `$REFRESH token in session. Run a normal login once to obtain it." }
  Write-Host "`nRefreshing tokens..." -ForegroundColor Cyan
  $new = Refresh-CognitoToken -Domain $Domain -Region $Region -ClientId $ClientId -RefreshToken $REFRESH
  Write-Host "Refreshed. New ID token prefix: $($new.id_token.Substring(0,30))" -ForegroundColor Green
}
else {
  Write-Host "`nOpening Cognito Hosted UI…" -ForegroundColor Cyan
  Login-CognitoPkce -Region $Region -Domain $Domain -ClientId $ClientId -Redirect $Redirect
  Write-Host "Logged in. ID token prefix: $($ID.Substring(0,30))" -ForegroundColor Green
}

# --- Smoke tests (safe if run after refresh as well) ---
Write-Host "`nTesting AppSync hello…" -ForegroundColor Cyan
Invoke-AppSyncHello -Endpoint $APPSYNC -IdToken $ID | Out-Host

Write-Host "`nTesting Uploads presign + list…" -ForegroundColor Cyan
Invoke-UploadsPresignList -ApiBase $UPLOADS -IdToken $ID | Out-Host

# --- Logout link (optional open) ---
$logoutUrl = Build-CognitoLogoutUrl -Domain $Domain -Region $Region -ClientId $ClientId -LogoutUri $Logout
Write-Host "`nLogout URL:" -ForegroundColor Yellow
Write-Host $logoutUrl

if ($OpenLogout) {
  Write-Host "Opening logout page…" -ForegroundColor Yellow
  Start-Process $logoutUrl
}

Write-Host "`nDone." -ForegroundColor Green
