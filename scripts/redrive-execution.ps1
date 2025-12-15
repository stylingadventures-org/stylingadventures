param(
  [Parameter(Mandatory=$true)][string]$ExecutionArn,
  [string]$Region = "us-east-1"
)

function ManualRedrive([string]$arn) {
  Write-Host "Manual redrive: describing execution and starting a new one..." -ForegroundColor Yellow
  $descJson = aws stepfunctions describe-execution --execution-arn $arn --region $Region
  $desc = $descJson | ConvertFrom-Json

  if (-not $desc.stateMachineArn) { throw "Missing stateMachineArn" }
  if (-not $desc.input) { throw "Missing input" }

  $newName = "redrive-" + [guid]::NewGuid().ToString()
  aws stepfunctions start-execution `
    --state-machine-arn $desc.stateMachineArn `
    --name $newName `
    --input $desc.input `
    --region $Region
}

try {
  aws stepfunctions redrive-execution `
    --execution-arn $ExecutionArn `
    --region $Region

  exit 0
} catch {
  $msg = $_.Exception.Message
  Write-Host "redrive-execution failed: $msg" -ForegroundColor Yellow

  if ($msg -match "AccessDenied" -or $msg -match "not authorized") {
    ManualRedrive $ExecutionArn
    exit 0
  }

  throw
}
