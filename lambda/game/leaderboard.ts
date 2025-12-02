// lambda/game/leaderboard.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { TABLE_NAME } from "../_shared/env";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

type AppSyncEvent = {
  info: { fieldName: string };
  arguments?: { limit?: number; season?: string } | null;
};

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;
  const args = event.arguments || {};
  const limit = Math.min(100, Math.max(1, Number(args.limit ?? 10)));
  const season = (args.season as string | undefined) || "GLOBAL";

  if (fieldName !== "topXP" && fieldName !== "topCoins") {
    throw new Error(`Unknown field ${fieldName}`);
  }

  const pk = `LEADERBOARD#${season}`;

  const resp = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :p AND begins_with(gsi1sk, :xp)",
      ExpressionAttributeValues: { ":p": pk, ":xp": "XP#" },
      ScanIndexForward: false, // highest XP first
      Limit: limit,
    }),
  );

  const items = resp.Items ?? [];

  let rank = 1;
  const results = await Promise.all(
    items.map(async (i) => {
      const userId = String(i.pk || "").replace("USER#", "");
      let displayName: string | undefined = i.displayName as
        | string
        | undefined;

      // If we didn't store displayName in the leaderboard row, fetch from PROFILE
      if (!displayName && userId) {
        try {
          const got = await ddb.send(
            new GetCommand({
              TableName: TABLE_NAME,
              Key: { pk: `USER#${userId}`, sk: "PROFILE" },
              ProjectionExpression: "displayName",
            }),
          );
          displayName = got.Item?.displayName as string | undefined;
        } catch {
          // ignore
        }
      }

      const out = {
        rank: rank++,
        userId,
        displayName,
        xp: Number(i.xp ?? 0),
        coins: Number(i.coins ?? 0),
      };

      return out;
    }),
  );

  return results;
};
