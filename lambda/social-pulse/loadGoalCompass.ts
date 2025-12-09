import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;
const PK = process.env.PK_NAME ?? "pk";
const SK = process.env.SK_NAME ?? "sk";

export const handler = async (event: any) => {
  const sub =
    event.identity?.sub ||
    event.identity?.claims?.sub;

  if (!sub) throw new Error("Missing identity.sub");

  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CREATOR#${sub}`,
        [SK]: "GOAL_COMPASS",
      },
    }),
  );

  const gc = res.Item ?? {};

  return {
    creatorId: sub,
    goalCompass: {
      primaryGoal: gc.primaryGoal ?? "GROWTH",
      timeHorizon: gc.timeHorizon ?? "90_DAYS",
      weeklyCapacity:
        typeof gc.weeklyCapacity === "number"
          ? gc.weeklyCapacity
          : 5,
      focusAreas: gc.focusAreas ?? ["PERSONALITY", "NURTURE"],
      riskTolerance: gc.riskTolerance ?? "MEDIUM",
      contentMixTarget: gc.contentMixTarget ?? null,
    },
    args: event.arguments ?? {},
  };
};
