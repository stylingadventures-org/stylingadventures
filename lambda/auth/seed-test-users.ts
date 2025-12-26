// lambda/auth/seed-test-users.ts
// Custom resource to seed 5 test users with different roles
// Called during CDK deploy

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  ListUsersCommand,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";

const cognitoClient = new CognitoIdentityProviderClient({});
const ddbClient = new DynamoDBClient({});

const USER_POOL_ID = process.env.USER_POOL_ID!;
const TABLE_NAME = process.env.TABLE_NAME!;

interface TestUser {
  email: string;
  displayName: string;
  password: string;
  groups: string[]; // Cognito groups to add
  dynamoData?: Record<string, any>; // Additional data to write to DynamoDB
}

// Define our 5 test users
const TEST_USERS: TestUser[] = [
  {
    email: "fan@test.example.com",
    displayName: "Fan Test User",
    password: "TempPassword123!@#",
    groups: [],
    // No special DynamoDB data needed for FAN
  },
  {
    email: "admin@test.example.com",
    displayName: "Admin Test User",
    password: "TempPassword123!@#",
    groups: ["ADMIN"],
  },
  {
    email: "creator@test.example.com",
    displayName: "Creator Test User",
    password: "TempPassword123!@#",
    groups: ["CREATOR"],
    dynamoData: {
      status: "APPROVED",
      shopStatus: "DRAFT",
    },
  },
  {
    email: "creator-pending@test.example.com",
    displayName: "Creator Pending User",
    password: "TempPassword123!@#",
    groups: [], // No CREATOR group yet
    dynamoData: {
      status: "PENDING",
      shopStatus: null,
    },
  },
  {
    email: "bestie@test.example.com",
    displayName: "Bestie Test User",
    password: "TempPassword123!@#",
    groups: ["BESTIE"],
    dynamoData: {
      tier: "Standard",
      trialStatus: null,
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

async function createOrUpdateCognitoUser(user: TestUser): Promise<string> {
  const { email, displayName, password, groups } = user;

  // Check if user already exists
  const listRes = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1,
    }),
  );

  let username: string;

  if (listRes.Users && listRes.Users.length > 0) {
    // User exists
    username = listRes.Users[0].Username!;
    console.log(`User ${email} already exists (${username}), skipping creation`);
  } else {
    // Create new user
    const createRes = await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: displayName },
        ],
        MessageAction: "SUPPRESS", // Don't send welcome email
      }),
    );

    username = createRes.User!.Username!;
    console.log(`Created Cognito user: ${email} (${username})`);

    // Set permanent password
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        Password: password,
        Permanent: true,
      }),
    );
    console.log(`Set permanent password for ${email}`);
  }

  // Add to groups
  for (const groupName of groups) {
    try {
      await cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          GroupName: groupName,
        }),
      );
      console.log(`Added ${email} to group: ${groupName}`);
    } catch (err: any) {
      // Ignore "user already in group" errors
      if (!err.message?.includes("already member")) {
        throw err;
      }
    }
  }

  return username;
}

async function createDynamoProfile(sub: string, user: TestUser): Promise<void> {
  const pk = `USER#${sub}`;
  const now = new Date().toISOString();

  // Base profile record
  const item: Record<string, any> = {
    pk: { S: pk },
    sk: { S: "PROFILE" },
    sub: { S: sub },
    email: { S: user.email },
    displayName: { S: user.displayName },
    tier: { S: "FREE" },
    createdAt: { S: now },
    updatedAt: { S: now },
  };

  await ddbClient.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  console.log(`Created DynamoDB profile for ${user.email}`);

  // If this is a creator or bestie, add entitlement record
  if (user.dynamoData) {
    if (user.groups.includes("CREATOR") || user.dynamoData.status) {
      const creatorItem: Record<string, any> = {
        pk: { S: pk },
        sk: { S: "CREATOR#APPLICATION" },
        ...user.dynamoData,
        createdAt: { S: now },
        updatedAt: { S: now },
      };

      // Convert string values to DynamoDB format
      Object.keys(creatorItem).forEach((key) => {
        if (typeof creatorItem[key] === "string") {
          creatorItem[key] = { S: creatorItem[key] };
        } else if (creatorItem[key] === null) {
          creatorItem[key] = { NULL: true };
        }
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: TABLE_NAME,
          Item: creatorItem,
        }),
      );

      console.log(`Created creator application record for ${user.email}`);
    }

    if (user.groups.includes("BESTIE") || user.dynamoData.tier) {
      const bestieItem: Record<string, any> = {
        pk: { S: pk },
        sk: { S: "BESTIE#SUBSCRIPTION" },
        ...user.dynamoData,
        active: { BOOL: true },
        createdAt: { S: now },
        updatedAt: { S: now },
      };

      // Convert string values to DynamoDB format
      Object.keys(bestieItem).forEach((key) => {
        if (typeof bestieItem[key] === "string") {
          bestieItem[key] = { S: bestieItem[key] };
        } else if (bestieItem[key] === null) {
          bestieItem[key] = { NULL: true };
        }
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: TABLE_NAME,
          Item: bestieItem,
        }),
      );

      console.log(`Created bestie subscription record for ${user.email}`);
    }
  }
}

async function seedTestUsers(): Promise<void> {
  for (const user of TEST_USERS) {
    try {
      const username = await createOrUpdateCognitoUser(user);

      // Extract sub from Cognito username (which is the sub)
      // Or fetch user to get the actual sub
      const userDetail = await cognitoClient.send(
        new ListUsersCommand({
          UserPoolId: USER_POOL_ID,
          Filter: `email = "${user.email}"`,
          Limit: 1,
        }),
      );

      const sub = userDetail.Users?.[0].Username;
      if (sub) {
        await createDynamoProfile(sub, user);
      }

      console.log(`✓ Seeded user: ${user.email}`);
    } catch (err) {
      console.error(`✗ Error seeding user ${user.email}:`, err);
      // Continue with other users
    }
  }
}

export const handler = async (event: any) => {
  console.log("SeedTestUsers event:", JSON.stringify(event, null, 2));

  try {
    // idempotent: on Create and Update, try seeding
    if (event.RequestType === "Create" || event.RequestType === "Update") {
      await seedTestUsers();
    }

    return {
      PhysicalResourceId:
        event.PhysicalResourceId ||
        event.LogicalResourceId ||
        "SeedTestUsersCustomResource",
      Status: "SUCCESS",
      Data: {
        Message: "Test users seeded successfully",
      },
    };
  } catch (err) {
    console.error("Fatal error in seedTestUsers:", err);
    return {
      PhysicalResourceId:
        event.PhysicalResourceId ||
        event.LogicalResourceId ||
        "SeedTestUsersCustomResource",
      Status: "FAILED",
      Reason: String(err),
    };
  }
};
