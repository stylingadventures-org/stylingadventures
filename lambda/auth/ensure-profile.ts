// lambda/auth/ensure-profile.ts
// Idempotent profile creation/update called on first auth callback or first GraphQL me query
// Ensures USER#<sub>/PROFILE exists with defaults

import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

interface EnsureProfileInput {
  sub: string;
  email: string;
  displayName?: string;
}

interface UserProfile {
  pk: string;
  sk: string;
  sub: string;
  email: string;
  displayName: string;
  tier: string; // defaults to FREE
  createdAt: string;
  updatedAt: string;
}

// Check if profile exists
async function profileExists(sub: string): Promise<boolean> {
  const pk = `USER#${sub}`;
  const sk = "PROFILE";

  const res = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK_NAME]: { S: pk },
        [SK_NAME]: { S: sk },
      },
    }),
  );

  return !!res.Item;
}

// Create or update profile (idempotent)
async function ensureProfile(input: EnsureProfileInput): Promise<UserProfile> {
  const { sub, email, displayName } = input;
  const pk = `USER#${sub}`;
  const sk = "PROFILE";
  const now = new Date().toISOString();

  // Try idempotent upsert: UpdateItem with condition expression
  // If profile doesn't exist, set it; if it does, just update updatedAt
  try {
    const result = await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: {
          [PK_NAME]: { S: pk },
          [SK_NAME]: { S: sk },
        },
        UpdateExpression:
          "SET #sub = :sub, #email = :email, #displayName = :displayName, #tier = if_not_exists(#tier, :defaultTier), #createdAt = if_not_exists(#createdAt, :now), #updatedAt = :now",
        ExpressionAttributeNames: {
          "#sub": "sub",
          "#email": "email",
          "#displayName": "displayName",
          "#tier": "tier",
          "#createdAt": "createdAt",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":sub": { S: sub },
          ":email": { S: email },
          ":displayName": { S: displayName || email.split("@")[0] },
          ":defaultTier": { S: "FREE" },
          ":now": { S: now },
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    const item = result.Attributes;
    return {
      pk: item![PK_NAME].S!,
      sk: item![SK_NAME].S!,
      sub: item!.sub.S!,
      email: item!.email.S!,
      displayName: item!.displayName.S!,
      tier: item!.tier.S!,
      createdAt: item!.createdAt.S!,
      updatedAt: item!.updatedAt.S!,
    };
  } catch (error) {
    console.error("Error ensuring profile:", error);
    throw error;
  }
}

// Lambda handler for AppSync resolver
export const handler = async (event: any): Promise<UserProfile> => {
  console.log("EnsureProfile event:", JSON.stringify(event, null, 2));

  // Extract from AppSync context
  const identity = event.identity as any;
  const sub = identity?.sub || identity?.claims?.["sub"] as string;
  const email = identity?.email || identity?.claims?.["email"] as string;

  if (!sub || !email) {
    throw new Error("Missing sub or email in AppSync identity");
  }

  // Optional displayName from claims or request
  const displayName =
    (identity?.claims?.["cognito:username"] as string) ||
    (identity?.username as string) ||
    event.arguments?.displayName ||
    email.split("@")[0];

  const profile = await ensureProfile({ sub, email, displayName });
  console.log("Profile ensured:", JSON.stringify(profile, null, 2));

  return profile;
};
