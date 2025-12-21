// lambda/auth/pre-token-generation.ts
import {
  PreTokenGenerationTriggerHandler,
  PreTokenGenerationTriggerEvent,
} from "aws-lambda";
import {
  DynamoDBClient,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

type UserTier = "FREE" | "BESTIE" | "CREATOR" | "COLLAB" | "ADMIN" | "PRIME";

function deriveGroupsFromTier(tier: UserTier): string[] {
  switch (tier) {
    case "ADMIN":
      return ["ADMIN"];
    case "PRIME":
      return ["PRIME"];
    case "CREATOR":
      return ["CREATOR"];
    case "COLLAB":
      return ["COLLAB"];
    case "BESTIE":
      return ["BESTIE"];
    case "FREE":
    default:
      // we can treat FREE as FAN group
      return ["FAN"];
  }
}

async function getTierFromDynamo(sub: string): Promise<UserTier> {
  // 🔁 Adjust PK/SK to match your real user profile keys
  const pk = `USER#${sub}`;
  const sk = "PROFILE";

  const res = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK_NAME]: { S: pk },
        [SK_NAME]: { S: sk },
      },
      ProjectionExpression: "#tier",
      ExpressionAttributeNames: {
        "#tier": "tier",
      },
    }),
  );

  const tierAttr = res.Item?.tier?.S as UserTier | undefined;
  return tierAttr || "FREE";
}

export const handler: PreTokenGenerationTriggerHandler = async (
  event: PreTokenGenerationTriggerEvent,
) => {
  const sub = event.request.userAttributes.sub;
  if (!sub) {
    // No sub means we can't look up the user; just pass through
    return event;
  }

  console.log("🔍 pre-token handler triggered for user:", sub);
  console.log("📦 groupConfiguration:", JSON.stringify(event.request.groupConfiguration));

  // ✅ PRIORITY 1: Use the groups that are already assigned to this user
  // Note: groupsToOverride contains the groups the user is CURRENTLY in (before override)
  let groupsToUse: string[] = [];
  
  if (event.request.groupConfiguration?.groupsToOverride && 
      event.request.groupConfiguration.groupsToOverride.length > 0) {
    // User's actual Cognito group membership
    groupsToUse = event.request.groupConfiguration.groupsToOverride;
    console.log("✅ Found groups from Cognito:", groupsToUse);
  } else {
    // ✅ PRIORITY 2: Fall back to deriving from DynamoDB tier
    console.log("⚠️ No groups found in Cognito, trying DynamoDB...");
    const tier = await getTierFromDynamo(sub);
    groupsToUse = deriveGroupsFromTier(tier);
    console.log("📋 Derived groups from tier:", tier, "->", groupsToUse);

    // Add tier claim if we derived it from DynamoDB
    if (!event.response.claimsOverrideDetails) {
      event.response.claimsOverrideDetails = {};
    }
    if (!event.response.claimsOverrideDetails.claimsToAddOrOverride) {
      event.response.claimsOverrideDetails.claimsToAddOrOverride = {};
    }
    event.response.claimsOverrideDetails.claimsToAddOrOverride.tier = tier;
  }

  // ✅ Merge groups into existing claims instead of overwriting
  if (!event.response.claimsOverrideDetails) {
    event.response.claimsOverrideDetails = {};
  }
  if (!event.response.claimsOverrideDetails.claimsToAddOrOverride) {
    event.response.claimsOverrideDetails.claimsToAddOrOverride = {};
  }

  // Add cognito:groups claim with all groups (highest priority wins)
  event.response.claimsOverrideDetails.claimsToAddOrOverride["cognito:groups"] =
    groupsToUse.join(",");

  // Also set groupOverrideDetails to ensure groups are in token
  event.response.claimsOverrideDetails.groupOverrideDetails = {
    groupsToOverride: groupsToUse,
  };

  console.log("✅ Final cognito:groups claim:", groupsToUse.join(","));

  return event;
};
