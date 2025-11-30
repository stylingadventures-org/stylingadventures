// lambda/stories/publish.ts
import {
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const ddb = new DynamoDBClient({});

const TABLE_NAME = process.env.TABLE_NAME || "";
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

/**
 * Minimal "publish story" step.
 *
 * This is a safe stub wired for the BestiesStoriesStack state machine:
 *  - Expects a storyId + ownerId somewhere on the event
 *  - Marks the story as PUBLISHED in DynamoDB if possible
 *  - Always returns the original event + { published: true/false }
 */
export const handler = async (event: any) => {
  console.log("Stories.Publish event:", JSON.stringify(event));

  const now = new Date().toISOString();

  const storyId: string =
    event?.storyId ||
    event?.id ||
    event?.detail?.storyId;

  const ownerId: string | undefined =
    event?.ownerId ||
    event?.userId ||
    event?.sub ||
    event?.detail?.ownerId;

  if (!storyId) {
    console.warn("[Stories.Publish] Missing storyId in event, skipping");
    return {
      ...event,
      published: false,
      error: "Missing storyId",
    };
  }

  if (!TABLE_NAME || !ownerId) {
    console.warn(
      "[Stories.Publish] Missing TABLE_NAME or ownerId, skipping DynamoDB update"
    );
    return {
      ...event,
      storyId,
      published: true, // let the SFN continue even if we skipped DB write
      skippedDdb: true,
    };
  }

  const key = {
    [PK_NAME]: `USER#${ownerId}`,
    [SK_NAME]: `STORY#${storyId}`,
  };

  try {
    await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: marshall(key),
        UpdateExpression:
          "SET #status = :published, #publishedAt = :now, #updatedAt = :now",
        ExpressionAttributeNames: {
          "#status": "status",
          "#publishedAt": "publishedAt",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: marshall(
          {
            ":published": "PUBLISHED",
            ":now": now,
          },
          { removeUndefinedValues: true }
        ),
      })
    );
  } catch (err) {
    console.error("[Stories.Publish] DynamoDB UpdateItem failed", err);
    return {
      ...event,
      storyId,
      published: false,
      error: String((err as Error)?.message || err),
    };
  }

  return {
    ...event,
    storyId,
    published: true,
  };
};
