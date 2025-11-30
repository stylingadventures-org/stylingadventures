import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;
const LIVESTREAM_CHANNEL_ARN = process.env.LIVESTREAM_CHANNEL_ARN!;
const LIVESTREAM_PLAYBACK_URL = process.env.LIVESTREAM_PLAYBACK_URL!;

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
  console.log("CreatorLivestreamFn event", JSON.stringify(event));
  const fieldName = event.info?.fieldName as string | undefined;
  const identity = event.identity;

  // Enforce Creator tier for all operations
  requireCreator(identity);
  const sub = requireSub(identity);

  switch (fieldName) {
    case "getCreatorLivestreamInfo": {
      return {
        channelArn: LIVESTREAM_CHANNEL_ARN,
        playbackUrl: LIVESTREAM_PLAYBACK_URL,
      };
    }

    case "pinLivestreamHighlight": {
      const { highlightId, title } = event.arguments || {};
      const now = new Date().toISOString();

      await ddb.send(
        new PutItemCommand({
          TableName: TABLE_NAME,
          Item: marshall(
            {
              pk: `USER#${sub}`,
              sk: `LIVE_HIGHLIGHT#${highlightId || now}`,
              type: "LIVE_HIGHLIGHT",
              title: title || "Livestream highlight",
              createdAt: now,
            },
            { removeUndefinedValues: true },
          ),
        }),
      );

      return { ok: true };
    }

    default:
      throw new Error(`Unsupported field in CreatorLivestreamFn: ${fieldName}`);
  }
};
