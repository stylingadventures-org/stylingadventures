// lambda/closet/apply-background-change.ts
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const ddb = new DynamoDBClient({});

// These env vars come from the Step Function / stack.
const TABLE_NAME = process.env.TABLE_NAME || "";
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

/**
 * Apply the result of background processing to the ClosetItem row.
 *
 * Expected event shape (flexible – we try multiple property names):
 * {
 *   itemId: "closet item id",
 *   ownerId: "user sub",
 *   mediaKey: "closet/xxx-cutout.png"        // preferred
 *   // or:
 *   processedKey: "closet/xxx-cutout.png"
 *   newBackgroundKey: "closet/xxx-cutout.png"
 *   backgroundStatus: "COMPLETED" | "FAILED" // optional
 * }
 */
export const handler = async (event: any) => {
  console.log("ApplyBackgroundChange event:", JSON.stringify(event));

  const itemId =
    event?.itemId ||
    event?.closetItemId ||
    event?.detail?.itemId ||
    event?.detail?.closetItemId ||
    event?.id;

  const ownerId =
    event?.ownerId ||
    event?.userId ||
    event?.sub ||
    event?.detail?.ownerId ||
    event?.detail?.userId;

  const mediaKey =
    event?.mediaKey ||
    event?.detail?.mediaKey ||
    event?.processedKey ||
    event?.detail?.processedKey ||
    event?.backgroundKey ||
    event?.detail?.backgroundKey ||
    event?.newBackgroundKey ||
    event?.detail?.newBackgroundKey;

  // optional explicit status from the workflow
  const incomingStatus =
    event?.backgroundStatus || event?.detail?.backgroundStatus || null;

  if (!TABLE_NAME) {
    console.warn("TABLE_NAME not set; skipping DynamoDB update");
    return {
      ...event,
      applied: true,
      skippedDdb: true,
    };
  }

  if (!itemId || !ownerId) {
    console.warn("Missing itemId/ownerId; returning passthrough");
    return {
      ...event,
      applied: false,
      reason: "Missing itemId/ownerId",
    };
  }

  try {
    const updateExprParts = ["#updatedAt = :now"];
    const names: Record<string, string> = { "#updatedAt": "updatedAt" };
    const values: Record<string, any> = {
      ":now": new Date().toISOString(),
    };

    if (mediaKey) {
      // This is the field your GraphQL API exposes and that the
      // front-end reads.
      updateExprParts.push("#mediaKey = :mk");
      names["#mediaKey"] = "mediaKey";
      values[":mk"] = mediaKey;

      // If you previously had a "pendingBackgroundKey", clear it.
      updateExprParts.push("#pendingBackgroundKey = :null");
      names["#pendingBackgroundKey"] = "pendingBackgroundKey";
      values[":null"] = null;
    }

    // Track background processing status on the item
    const finalStatus = incomingStatus || (mediaKey ? "COMPLETED" : null);
    if (finalStatus) {
      updateExprParts.push("#backgroundStatus = :bs");
      names["#backgroundStatus"] = "backgroundStatus";
      values[":bs"] = finalStatus;
    }

    const cmd = new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        [PK_NAME]: `USER#${ownerId}`,
        [SK_NAME]: `CLOSET#${itemId}`,
      }),
      UpdateExpression: "SET " + updateExprParts.join(", "),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: marshall(values, {
        removeUndefinedValues: true,
      }),
    });

    console.log(
      "ApplyBackgroundChange: UpdateItem",
      JSON.stringify({
        TableName: cmd.input.TableName,
        Key: cmd.input.Key,
        UpdateExpression: cmd.input.UpdateExpression,
        ExpressionAttributeNames: cmd.input.ExpressionAttributeNames,
      })
    );

    await ddb.send(cmd);
  } catch (err) {
    console.error("ApplyBackgroundChange: DDB update failed", err);
    return {
      ...event,
      applied: false,
      error: String((err as Error)?.message || err),
    };
  }

  return {
    ...event,
    applied: true,
  };
};

