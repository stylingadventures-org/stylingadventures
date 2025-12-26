"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambda/auth/seed-test-users.ts
var seed_test_users_exports = {};
__export(seed_test_users_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(seed_test_users_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var cognitoClient = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({});
var ddbClient = new import_client_dynamodb.DynamoDBClient({});
var USER_POOL_ID = process.env.USER_POOL_ID;
var TABLE_NAME = process.env.TABLE_NAME;
var TEST_USERS = [
  {
    email: "fan@test.example.com",
    displayName: "Fan Test User",
    password: "TempPassword123!@#",
    groups: []
    // No special DynamoDB data needed for FAN
  },
  {
    email: "admin@test.example.com",
    displayName: "Admin Test User",
    password: "TempPassword123!@#",
    groups: ["ADMIN"]
  },
  {
    email: "creator@test.example.com",
    displayName: "Creator Test User",
    password: "TempPassword123!@#",
    groups: ["CREATOR"],
    dynamoData: {
      status: "APPROVED",
      shopStatus: "DRAFT"
    }
  },
  {
    email: "creator-pending@test.example.com",
    displayName: "Creator Pending User",
    password: "TempPassword123!@#",
    groups: [],
    // No CREATOR group yet
    dynamoData: {
      status: "PENDING",
      shopStatus: null
    }
  },
  {
    email: "bestie@test.example.com",
    displayName: "Bestie Test User",
    password: "TempPassword123!@#",
    groups: ["BESTIE"],
    dynamoData: {
      tier: "Standard",
      trialStatus: null,
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
    }
  }
];
async function createOrUpdateCognitoUser(user) {
  const { email, displayName, password, groups } = user;
  const listRes = await cognitoClient.send(
    new import_client_cognito_identity_provider.ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1
    })
  );
  let username;
  if (listRes.Users && listRes.Users.length > 0) {
    username = listRes.Users[0].Username;
    console.log(`User ${email} already exists (${username}), skipping creation`);
  } else {
    const createRes = await cognitoClient.send(
      new import_client_cognito_identity_provider.AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: displayName }
        ],
        MessageAction: "SUPPRESS"
        // Don't send welcome email
      })
    );
    username = createRes.User.Username;
    console.log(`Created Cognito user: ${email} (${username})`);
    await cognitoClient.send(
      new import_client_cognito_identity_provider.AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        Password: password,
        Permanent: true
      })
    );
    console.log(`Set permanent password for ${email}`);
  }
  for (const groupName of groups) {
    try {
      await cognitoClient.send(
        new import_client_cognito_identity_provider.AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          GroupName: groupName
        })
      );
      console.log(`Added ${email} to group: ${groupName}`);
    } catch (err) {
      if (!err.message?.includes("already member")) {
        throw err;
      }
    }
  }
  return username;
}
async function createDynamoProfile(sub, user) {
  const pk = `USER#${sub}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const item = {
    pk: { S: pk },
    sk: { S: "PROFILE" },
    sub: { S: sub },
    email: { S: user.email },
    displayName: { S: user.displayName },
    tier: { S: "FREE" },
    createdAt: { S: now },
    updatedAt: { S: now }
  };
  await ddbClient.send(
    new import_client_dynamodb.PutItemCommand({
      TableName: TABLE_NAME,
      Item: item
    })
  );
  console.log(`Created DynamoDB profile for ${user.email}`);
  if (user.dynamoData) {
    if (user.groups.includes("CREATOR") || user.dynamoData.status) {
      const creatorItem = {
        pk: { S: pk },
        sk: { S: "CREATOR#APPLICATION" },
        ...user.dynamoData,
        createdAt: { S: now },
        updatedAt: { S: now }
      };
      Object.keys(creatorItem).forEach((key) => {
        if (typeof creatorItem[key] === "string") {
          creatorItem[key] = { S: creatorItem[key] };
        } else if (creatorItem[key] === null) {
          creatorItem[key] = { NULL: true };
        }
      });
      await ddbClient.send(
        new import_client_dynamodb.PutItemCommand({
          TableName: TABLE_NAME,
          Item: creatorItem
        })
      );
      console.log(`Created creator application record for ${user.email}`);
    }
    if (user.groups.includes("BESTIE") || user.dynamoData.tier) {
      const bestieItem = {
        pk: { S: pk },
        sk: { S: "BESTIE#SUBSCRIPTION" },
        ...user.dynamoData,
        active: { BOOL: true },
        createdAt: { S: now },
        updatedAt: { S: now }
      };
      Object.keys(bestieItem).forEach((key) => {
        if (typeof bestieItem[key] === "string") {
          bestieItem[key] = { S: bestieItem[key] };
        } else if (bestieItem[key] === null) {
          bestieItem[key] = { NULL: true };
        }
      });
      await ddbClient.send(
        new import_client_dynamodb.PutItemCommand({
          TableName: TABLE_NAME,
          Item: bestieItem
        })
      );
      console.log(`Created bestie subscription record for ${user.email}`);
    }
  }
}
async function seedTestUsers() {
  for (const user of TEST_USERS) {
    try {
      const username = await createOrUpdateCognitoUser(user);
      const userDetail = await cognitoClient.send(
        new import_client_cognito_identity_provider.ListUsersCommand({
          UserPoolId: USER_POOL_ID,
          Filter: `email = "${user.email}"`,
          Limit: 1
        })
      );
      const sub = userDetail.Users?.[0].Username;
      if (sub) {
        await createDynamoProfile(sub, user);
      }
      console.log(`\u2713 Seeded user: ${user.email}`);
    } catch (err) {
      console.error(`\u2717 Error seeding user ${user.email}:`, err);
    }
  }
}
var handler = async (event) => {
  console.log("SeedTestUsers event:", JSON.stringify(event, null, 2));
  try {
    if (event.RequestType === "Create" || event.RequestType === "Update") {
      await seedTestUsers();
    }
    return {
      PhysicalResourceId: event.PhysicalResourceId || event.LogicalResourceId || "SeedTestUsersCustomResource",
      Status: "SUCCESS",
      Data: {
        Message: "Test users seeded successfully"
      }
    };
  } catch (err) {
    console.error("Fatal error in seedTestUsers:", err);
    return {
      PhysicalResourceId: event.PhysicalResourceId || event.LogicalResourceId || "SeedTestUsersCustomResource",
      Status: "FAILED",
      Reason: String(err)
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
