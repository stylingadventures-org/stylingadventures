Write-Host "==> Checking Node.js"
node -v | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Install Node.js >= 18.x" }

Write-Host "==> Checking npm"
npm -v | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Install npm" }

Write-Host "==> Checking AWS CLI"
aws --version | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Install AWS CLI v2" }

Write-Host "==> Checking AWS identity"
aws sts get-caller-identity | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Configure AWS auth" }

Write-Host "==> Checking CDK v2"
npx cdk --version | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Install AWS CDK: npm i -g aws-cdk@2" }

Write-Host "==> Checking CDK bootstrap (us-east-1)"
aws cloudformation describe-stacks --region us-east-1 `
  --query "Stacks[?starts_with(StackName, 'CDKToolkit')].StackName" --output text | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Not bootstrapped. Run: npx cdk bootstrap aws://<ACCOUNT_ID>/us-east-1"
} else {
  Write-Host "CDK bootstrap: OK"
}
