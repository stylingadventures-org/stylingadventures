import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const ddb = new DynamoDBClient({});

// These env vars come from the Step Function / stack if we wire them later.
// For now we keep it very tolerant so it works even if not set.
const TABLE_NAME = process.env.TABLE_NAME || "";
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

/**
 * Minimal "apply background change" handler.
 *
 * This is intentionally lightweight so the infra can deploy.
 * Later we can upgrade it to:
 *   - copy processed image from bg-removal bucket
 *   - update ClosetItem.pendingBackgroundKey -> backgroundKey
 *   - flip status flags, etc.
 */
export const handler = async (event: any) => {
  console.log("ApplyBackgroundChange event:", JSON.stringify(event));

  const itemId =
    event?.itemId ||
    event?.detail?.itemId ||
    event?.closetItemId ||
    event?.id;

  const ownerId =
    event?.ownerId ||
    event?.detail?.ownerId ||
    event?.userId ||
    event?.sub;

  const backgroundKey =
    event?.backgroundKey ||
    event?.detail?.backgroundKey ||
    event?.processedKey ||
    event?.newBackgroundKey;

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

    if (backgroundKey) {
      updateExprParts.push("#backgroundKey = :bk");
      names["#backgroundKey"] = "backgroundKey";
      values[":bk"] = backgroundKey;

      // clear any "pending" key if present
      updateExprParts.push("#pendingBackgroundKey = :null");
      names["#pendingBackgroundKey"] = "pendingBackgroundKey";
      values[":null"] = null;
    }

    const updateCmd = new UpdateItemCommand({
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

    console.log("ApplyBackgroundChange: UpdateItem", JSON.stringify(updateCmd));
    await ddb.send(updateCmd);
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
