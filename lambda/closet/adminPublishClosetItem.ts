import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

interface AppSyncEvent {
  arguments: {
    closetItemId: string;
  };
  identity?: {
    sub?: string;
    groups?: string[];
  };
}

export const handler = async (event: AppSyncEvent) => {
  const { closetItemId } = event.arguments;

  const groups = event.identity?.groups ?? [];
  if (!groups.includes("Admin")) {
    throw new Error("Not authorized");
  }

  const pk = `ITEM#${closetItemId}`;
  const sk = "META";

  const getResp = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
    })
  );

  const item = getResp.Item;
  if (!item) throw new Error("Closet item not found");

  // Allow admin publish if APPROVED (or already PUBLISHED)
  if (item.status !== "APPROVED" && item.status !== "PUBLISHED") {
    throw new Error(`Item must be APPROVED before publishing (current: ${item.status})`);
  }

  const now = new Date().toISOString();

  // If mediaKey empty, prefer existing removed-bg/mediaKey, else processed, else rawMediaKey/s3Key
  const mediaKeyMissing = !item.mediaKey || item.mediaKey === "";
  const fallbackMediaKey =
    item.mediaKey || item.processedImageKey || item.rawMediaKey || item.s3Key || null;

  let UpdateExpression = "SET #status = :published, #updatedAt = :now";
  const ExpressionAttributeNames: Record<string, string> = {
    "#status": "status",
    "#updatedAt": "updatedAt",
  };
  const ExpressionAttributeValues: Record<string, any> = {
    ":published": "PUBLISHED",
    ":now": now,
  };

  if (mediaKeyMissing && fallbackMediaKey) {
    UpdateExpression += ", mediaKey = :mediaKey";
    ExpressionAttributeValues[":mediaKey"] = fallbackMediaKey;
  }

  const updateResp = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return {
    id: closetItemId,
    ...updateResp.Attributes,
  };
};
