param([string]$OutputsPath = (Join-Path (Resolve-Path "$PSScriptRoot\..").Path "outputs.json"))

function _pick($a,$b){ if($a){$a}else{$b} }

$outs = $null
if(Test-Path $OutputsPath){ try{ $outs = Get-Content $OutputsPath -Raw | ConvertFrom-Json }catch{} }

$Region   = _pick $outs.IdentityStack.Region "us-east-1"
$ClientId = _pick $outs.IdentityStack.CognitoWebClientId ""
$Domain   = ""
if ($outs.IdentityStack.HostedUiDomainName) {
  $Domain = $outs.IdentityStack.HostedUiDomainName
} elseif ($outs.IdentityStack.HostedUiLoginUrl -and
          $outs.IdentityStack.HostedUiLoginUrl -match 'https://([^\.]+)\.auth\.[^/]+/login') {
  $Domain = $Matches[1]
}

$CFDomain = _pick $outs.WebStack.CloudFrontDistributionDomainName ""
$CF       = if($CFDomain){"https://$CFDomain"}else{""}
$APPSYNC  = _pick $outs.ApiStack.GraphQlApiUrl ""
$UPLOADS  = if($outs.UploadsStack.ApiGatewayUrl){ ($outs.UploadsStack.ApiGatewayUrl.TrimEnd('/') + "/") }else{""}

$Redirect = if($CF){"$CF/callback/index.html"}else{""}
$Logout   = if($CF){"$CF/logout/index.html"}else{""}

Set-Variable -Name Region   -Scope Script -Value $Region
Set-Variable -Name Domain   -Scope Script -Value $Domain
Set-Variable -Name ClientId -Scope Script -Value $ClientId
Set-Variable -Name APPSYNC  -Scope Script -Value $APPSYNC
Set-Variable -Name UPLOADS  -Scope Script -Value $UPLOADS
Set-Variable -Name CF       -Scope Script -Value $CF
Set-Variable -Name Redirect -Scope Script -Value $Redirect
Set-Variable -Name Logout   -Scope Script -Value $Logout
