#!/bin/bash

# Script to create additional test users in Cognito for testing different roles
# Usage: ./create-test-users.sh

USER_POOL_ID="us-east-1_ibGaRX7ry"
REGION="us-east-1"

# Test user credentials
TEST_PASSWORD="TestPass123!"

echo "Creating test users for different roles..."
echo ""

# Create ADMIN-only test user
echo "1. Creating ADMIN-only test user (admin@example.com)..."
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --region $REGION

aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --password $TEST_PASSWORD \
  --permanent \
  --region $REGION

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --group-name ADMIN \
  --region $REGION

echo "✓ Created admin@example.com (ADMIN group only)"
echo ""

# Create FAN-only test user
echo "2. Creating FAN-only test user (fan@example.com)..."
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username fan@example.com \
  --user-attributes Name=email,Value=fan@example.com Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --region $REGION

aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username fan@example.com \
  --password $TEST_PASSWORD \
  --permanent \
  --region $REGION

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username fan@example.com \
  --group-name FAN \
  --region $REGION

echo "✓ Created fan@example.com (FAN group only)"
echo ""

# Create BESTIE-only test user
echo "3. Creating BESTIE-only test user (bestie@example.com)..."
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username bestie@example.com \
  --user-attributes Name=email,Value=bestie@example.com Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --region $REGION

aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username bestie@example.com \
  --password $TEST_PASSWORD \
  --permanent \
  --region $REGION

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username bestie@example.com \
  --group-name BESTIE \
  --region $REGION

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username bestie@example.com \
  --group-name FAN \
  --region $REGION

echo "✓ Created bestie@example.com (BESTIE + FAN groups)"
echo ""

echo "==============================================="
echo "Test users created successfully!"
echo "==============================================="
echo ""
echo "Test Accounts:"
echo "1. ADMIN:   admin@example.com / TestPass123!"
echo "2. BESTIE:  bestie@example.com / TestPass123!"
echo "3. CREATOR: test@example.com / TestPass123! (already exists)"
echo "4. FAN:     fan@example.com / TestPass123!"
echo ""
echo "All users use password: TestPass123!"
