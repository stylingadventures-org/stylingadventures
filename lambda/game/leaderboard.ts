import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { TABLE_NAME } from "../_shared/env";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  const { fieldName } = event.info;
  const { limit = 10, season = "GLOBAL" } = event.arguments || {};

  if (fieldName === "topXP" || fieldName === "topCoins") {
    const pk = `LEADERBOARD#${season}`;
    const resp = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",                                 // ✅ lowercase
      KeyConditionExpression: "gsi1pk = :p AND begins_with(gsi1sk, :xp)",
      ExpressionAttributeValues: { ":p": pk, ":xp": "XP#" },
      ScanIndexForward: false,                           // highest first
      Limit: Math.min(100, limit),
    }));

    let rank = 1;
    return (resp.Items ?? []).map(i => ({
      userId: (i.pk as string).replace("USER#",""),
      displayName: i.displayName ?? undefined,
      xp: i.xp ?? null,
      coins: i.coins ?? null,
      rank: rank++,
    }));
  }

  throw new Error(`Unknown field ${fieldName}`);
};
