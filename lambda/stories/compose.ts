// lambda/stories/compose.ts
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";

const ddb = new DynamoDBClient({});

const TABLE_NAME = process.env.TABLE_NAME || "";
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

/**
 * Minimal "compose story" step.
 *
 * This is a safe stub so infra can deploy:
 * - Logs the incoming event
 * - Optionally writes a basic STORY item if TABLE_NAME is set
 * - Returns the storyId and a composed flag for the state machine
 */
export const handler = async (event: any) => {
  console.log("Stories.Compose event:", JSON.stringify(event));

  const now = new Date().toISOString();

  const storyId =
    event?.storyId ||
    event?.id ||
    event?.detail?.storyId ||
    randomUUID();

  const ownerId =
    event?.ownerId ||
    event?.userId ||
    event?.sub ||
    event?.detail?.ownerId;

  const title =
    event?.title ||
    event?.detail?.title ||
    "Untitled Story";

  const status = event?.status || "DRAFT";

  if (!TABLE_NAME || !ownerId) {
    console.warn(
      "[Stories.Compose] Missing TABLE_NAME or ownerId, skipping DynamoDB write"
    );
    return {
      ...event,
      storyId,
      composed: true,
      skippedDdb: true,
    };
  }

  const item: Record<string, any> = {
    [PK_NAME]: `USER#${ownerId}`,
    [SK_NAME]: `STORY#${storyId}`,
    type: "STORY",
    id: storyId,
    ownerId,
    title,
    status,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await ddb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall(item, { removeUndefinedValues: true }),
      })
    );
  } catch (err) {
    console.error("[Stories.Compose] DynamoDB PutItem failed", err);
    return {
      ...event,
      storyId,
      composed: false,
      error: String((err as Error)?.message || err),
    };
  }

  return {
    ...event,
    storyId,
    composed: true,
  };
};
