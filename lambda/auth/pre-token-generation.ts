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
  console.log(`🔐 Pre-token-generation for user: ${sub}`)
  
  if (!sub) {
    // No sub means we can't look up the user; just pass through
    console.log('⚠️ No sub found, returning event unchanged')
    return event;
  }

  try {
    const tier = await getTierFromDynamo(sub);
    const groupsFromDb = deriveGroupsFromTier(tier);
    
    console.log(`✅ User tier: ${tier}, groups: ${groupsFromDb.join(', ')}`)

    // Dynamo is source of truth here — override with our groups
    event.response = {
      claimsOverrideDetails: {
        claimsToAddOrOverride: {
          // 👇 This 'tier' claim is what your resolvers read
          tier,
        },
        groupOverrideDetails: {
          groupsToOverride: groupsFromDb,
        },
      },
    };

    return event;
  } catch (error) {
    console.error('❌ Error in pre-token-generation:', error)
    
    // If DynamoDB lookup fails (new user), default to FAN
    console.log('🆕 Likely new user, defaulting to FAN tier')
    event.response = {
      claimsOverrideDetails: {
        claimsToAddOrOverride: {
          tier: 'FREE'
        },
        groupOverrideDetails: {
          groupsToOverride: ['FAN'],
        },
      },
    };

    return event;
  }
};
