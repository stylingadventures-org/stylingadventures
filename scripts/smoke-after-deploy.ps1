param(
  [Parameter(Mandatory=$true)][string]$StackName,
  [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

function Fail([string]$msg) {
  throw "[smoke-after-deploy] $msg"
}

# Ensure relative paths work even if invoked from elsewhere
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
  try {
    $stack = aws cloudformation describe-stacks `
      --stack-name $StackName `
      --region $Region `
      --output json | ConvertFrom-Json
  } catch {
    Fail "Failed to describe CloudFormation stack '$StackName' in region '$Region'. $($_)"
  }

  $outputs = @{}
  foreach ($o in $stack.Stacks[0].Outputs) {
    $outputs[$o.OutputKey] = $o.OutputValue
  }

  $adminApiUrl = (($outputs["AdminApiUrl"] ?? "")).TrimEnd("/")
  $smArn = $outputs["ClosetUploadApprovalStateMachineArn"]
  $tableName = $outputs["AppTableName"]

  if (-not $adminApiUrl) { Fail "Missing output AdminApiUrl on stack $StackName" }
  if (-not $smArn)       { Fail "Missing output ClosetUploadApprovalStateMachineArn on stack $StackName" }
  if (-not $tableName)   { Fail "Missing output AppTableName on stack $StackName" }

  Write-Host ""
  Write-Host "=== Smoke After Deploy ==="
  Write-Host "StackName:       $StackName"
  Write-Host "Region:          $Region"
  Write-Host "AdminApiUrl:     $adminApiUrl"
  Write-Host "StateMachineArn: $smArn"
  Write-Host "TableName:       $tableName"
  Write-Host "=========================="
  Write-Host ""

  try {
    # Capture the summary object (your updated smoke-approval.ps1 returns this)
    $summary = .\scripts\smoke-approval.ps1 `
      -StateMachineArn $smArn `
      -TableName $tableName `
      -AdminApiUrl $adminApiUrl `
      -Region $Region

    Write-Host ""
    Write-Host "✅ Smoke test PASSED"
    if ($summary) {
      Write-Host ("ApprovalId:   {0}" -f $summary.ApprovalId)
      Write-Host ("ExecutionArn: {0}" -f $summary.ExecutionArn)
      Write-Host ("Status:       {0}" -f $summary.ExecutionStatus)
    }
    exit 0
  } catch {
    Write-Host ""
    Write-Host "❌ Smoke test FAILED"
    Write-Error $_
    exit 1
  }
}
finally {
  Pop-Location
}
