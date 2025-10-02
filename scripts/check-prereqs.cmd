@echo off
echo Node:
node -v
echo npm:
npm -v
echo AWS CLI:
aws --version
echo CDK:
cdk --version
echo Caller identity:
aws sts get-caller-identity
echo Region: %AWS_REGION%
echo If you saw Account and Arn above, you're good.
