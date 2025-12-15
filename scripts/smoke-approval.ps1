param(
  [Parameter(Mandatory=$true)][string]$StateMachineArn,
  [Parameter(Mandatory=$true)][string]$TableName,
  [Parameter(Mandatory=$true)][string]$AdminApiUrl,
  [string]$Region = "us-east-1",
  [string]$UserId = "147874a8-7021-70d8-b785-d720e87c17b0",
  [string]$S3Key  = "closet/76f52256-ec3a-4342-8612-0e9a178fa433.jpg",
  [int]$WaitForTokenSeconds = 180,
  [int]$WaitForExecutionSeconds = 900
)

$ErrorActionPreference = "Stop"

function Fail([string]$msg) {
  throw "[smoke-approval] $msg"
}

function Get-Meta([string]$id) {
  $keyJson   = "{ `"pk`": { `"S`": `"ITEM#$id`" }, `"sk`": { `"S`": `"META`" } }"
  $namesJson = "{ `"#s`": `"status`" }"
  $proj      = "pk,sk,#s,taskToken,taskTokenExpiresAt,approvalRequestedAt,processedImageKey,updatedAt,decidedAt,publishedAt,mediaKey"

  $out = aws dynamodb get-item `
    --table-name $TableName `
    --key $keyJson `
    --projection-expression $proj `
    --expression-attribute-names $namesJson `
    --consistent-read `
    --output json `
    --region $Region | ConvertFrom-Json

  return $out.Item
}

function Wait-ForToken([string]$id, [int]$timeoutSec) {
  $start = Get-Date
  while(((Get-Date) - $start).TotalSeconds -lt $timeoutSec) {
    $item = $null
    try { $item = Get-Meta -id $id } catch { $item = $null }

    if ($null -ne $item -and $item.taskToken -and $item.taskToken.S) {
      return $item
    }
    Start-Sleep -Seconds 2
  }
  Fail "Timed out waiting for taskToken in DynamoDB for ITEM#$id"
}

function Wait-ForExecutionDone([string]$executionArn, [int]$timeoutSec) {
  $start = Get-Date
  while(((Get-Date) - $start).TotalSeconds -lt $timeoutSec) {
    $d = aws stepfunctions describe-execution `
      --execution-arn $executionArn `
      --region $Region `
      --output json | ConvertFrom-Json

    if ($d.status -ne "RUNNING") { return $d }
    Start-Sleep -Seconds 3
  }
  Fail "Timed out waiting for execution to finish: $executionArn"
}

# Normalize AdminApiUrl so we never call //admin/...
$AdminApiUrl = ($AdminApiUrl ?? "").TrimEnd("/")
if (-not $AdminApiUrl) { Fail "AdminApiUrl is empty" }

# --- Start execution ---
$id = ([guid]::NewGuid().ToString())
$inputObj = @{
  item = @{
    id     = $id
    userId = $UserId
    s3Key  = $S3Key
  }
}
$input = ($inputObj | ConvertTo-Json -Compress)

$started = aws stepfunctions start-execution `
  --state-machine-arn $StateMachineArn `
  --name ("smoke-" + $id) `
  --input $input `
  --region $Region `
  --output json | ConvertFrom-Json

$execArn = $started.executionArn
Write-Host "Started execution:" $execArn
Write-Host "ApprovalId (item.id):" $id

# --- Wait until NotifyAdmin wrote token ---
Write-Host "Waiting for taskToken to appear in DynamoDB..."
$meta = Wait-ForToken -id $id -timeoutSec $WaitForTokenSeconds

Write-Host "META.status:" ($meta.status.S)
if ($meta.processedImageKey -and $meta.processedImageKey.S) {
  Write-Host "META.processedImageKey:" ($meta.processedImageKey.S)
}
if ($meta.approvalRequestedAt -and $meta.approvalRequestedAt.S) {
  Write-Host "META.approvalRequestedAt:" ($meta.approvalRequestedAt.S)
}

# --- Approve via admin endpoint ---
$body = @{ approvalId = $id; decision = "APPROVE" } | ConvertTo-Json
$approveUrl = "$AdminApiUrl/admin/closet/approve"
Write-Host "Calling approve endpoint:" $approveUrl

$approveResp = Invoke-RestMethod `
  -Method POST `
  -Uri $approveUrl `
  -ContentType "application/json" `
  -Body $body

Write-Host "Approve response:" ($approveResp | ConvertTo-Json -Compress)

if (-not $approveResp.ok) {
  Fail "Approve endpoint returned ok=false: $($approveResp | ConvertTo-Json -Compress)"
}

# --- Wait for execution to finish ---
Write-Host "Waiting for execution to finish..."
$done = Wait-ForExecutionDone -executionArn $execArn -timeoutSec $WaitForExecutionSeconds

Write-Host "Execution status:" $done.status
if ($done.status -ne "SUCCEEDED") {
  $err = $done.error
  $cause = $done.cause
  Fail "Execution not SUCCEEDED. status=$($done.status) error=$err cause=$cause"
}

if (-not $done.output) {
  Fail "Execution SUCCEEDED but output was null/empty"
}

# --- Parse output ---
$outObj = $null
try { $outObj = $done.output | ConvertFrom-Json } catch { $outObj = $null }

if ($null -eq $outObj) {
  Fail "Could not parse execution output JSON. Raw output: $($done.output)"
}

Write-Host "Admin decision:" $outObj.admin.decision
Write-Host "Published:" ($outObj.published | ConvertTo-Json -Compress)

# --- Assert publish success ---
if ($null -eq $outObj.published) {
  Fail "Publish result missing (outObj.published is null)"
}
if ($outObj.published.ok -ne $true) {
  Fail "Publish step did not succeed: $($outObj.published | ConvertTo-Json -Compress)"
}
if ($outObj.published.status -ne "PUBLISHED") {
  Fail "Publish returned unexpected status: $($outObj.published.status)"
}

# --- Final DynamoDB convergence check ---
$finalMeta = $null
try { $finalMeta = Get-Meta -id $id } catch { $finalMeta = $null }

if ($null -eq $finalMeta) {
  Fail "Could not read final DynamoDB META for ITEM#$id"
}

$finalStatus = $finalMeta.status.S
Write-Host "Final DynamoDB status:" $finalStatus

if ($finalStatus -ne "PUBLISHED") {
  Fail "Final DynamoDB status not PUBLISHED (was $finalStatus)"
}

Write-Host "DONE."

# ✅ Return a single summary object to callers (CI-friendly)
return [pscustomobject]@{
  Ok              = $true
  ApprovalId      = $id
  ExecutionArn    = $execArn
  AdminApiUrl     = $AdminApiUrl
  TableName       = $TableName
  StateMachineArn = $StateMachineArn
  ExecutionStatus = $done.status
  OutputObj       = $outObj
  FinalMeta       = $finalMeta
}
