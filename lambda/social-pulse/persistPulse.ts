import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;
const PK = process.env.PK_NAME ?? "pk";
const SK = process.env.SK_NAME ?? "sk";

export const handler = async (event: any) => {
  const {
    creatorId,
    niche,
    platforms,
    trendBriefs,
    contentIdeas,
  } = event;

  if (!creatorId) {
    throw new Error("Missing creatorId in Social Pulse persist");
  }

  const id = uuid();
  const now = new Date().toISOString();

  const item = {
    [PK]: `CREATOR#${creatorId}`,
    [SK]: `PULSE#${id}`,
    type: "CREATOR_SOCIAL_PULSE",

    id,
    creatorId,
    niche,
    platforms,
    trendBriefs,
    contentIdeas,
    createdAt: now,

    gsi1pk: `CREATOR#${creatorId}`,
    gsi1sk: `PULSE#${now}#${id}`,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  // Return in GraphQL-friendly shape
  return {
    id,
    creatorId,
    niche,
    platforms,
    trendBriefs,
    contentIdeas,
    createdAt: now,
  };
};
