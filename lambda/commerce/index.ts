import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const ddb = new DynamoDBClient({});
const APP_TABLE_NAME = process.env.APP_TABLE_NAME!;
const ORDERS_TABLE_NAME = process.env.ORDERS_TABLE_NAME!;

type UserTier = "FREE" | "BESTIE" | "CREATOR" | "COLLAB" | "ADMIN" | "PRIME";

function getUserTier(identity: any): UserTier {
  const claims = identity?.claims || {};
  const tierClaim =
    (claims["custom:tier"] as string | undefined) ||
    (claims["tier"] as string | undefined);

  const rawGroups = claims["cognito:groups"];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : String(rawGroups || "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

  if (groups.includes("ADMIN")) return "ADMIN";
  if (groups.includes("COLLAB")) return "COLLAB";
  if (groups.includes("PRIME")) return "PRIME";
  if (groups.includes("CREATOR")) return "CREATOR";
  if (groups.includes("BESTIE")) return "BESTIE";

  if (
    tierClaim &&
    ["FREE", "BESTIE", "CREATOR", "COLLAB", "ADMIN", "PRIME"].includes(
      tierClaim,
    )
  ) {
    return tierClaim as UserTier;
  }

  return "FREE";
}

function requireCreator(identity: any): UserTier {
  const tier = getUserTier(identity);
  if (!["CREATOR", "COLLAB", "ADMIN", "PRIME"].includes(tier)) {
    throw new Error("Creator tier required");
  }
  return tier;
}

function requireSub(identity: any): string {
  if (!identity?.sub) throw new Error("Not authenticated");
  return String(identity.sub);
}

export const handler = async (event: any) => {
  console.log("CommerceFn event", JSON.stringify(event));

  const fieldName = event.info?.fieldName as string | undefined;
  const identity = event.identity;

  // Only creators and above can see monetisation dashboards
  const tier = requireCreator(identity);
  const sub = requireSub(identity);

  switch (fieldName) {
    case "creatorRevenueSummary": {
      // Stub: later read from ORDERS_TABLE_NAME
      return {
        creatorId: sub,
        tier,
        last30dRevenue: 0,
        totalRevenue: 0,
        affiliateClicks: 0,
      };
    }

    case "recordAffiliateClick": {
      const { itemId, source } = event.arguments || {};
      const now = new Date().toISOString();
      await ddb.send(
        new PutItemCommand({
          TableName: ORDERS_TABLE_NAME,
          Item: marshall(
            {
              pk: `CREATOR#${sub}`,
              sk: `CLICK#${now}`,
              type: "AFFILIATE_CLICK",
              itemId,
              source: source || "unknown",
              createdAt: now,
            },
            { removeUndefinedValues: true },
          ),
        }),
      );
      return { ok: true };
    }

    default:
      throw new Error(`Unsupported field in CommerceFn: ${fieldName}`);
  }
};
