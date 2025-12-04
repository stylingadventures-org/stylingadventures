// lambda/closet/adminPublishClosetItem.ts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

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

  // Enforce admin group (on top of @auth)
  const groups = event.identity?.groups ?? [];
  if (!groups.includes("Admin")) {
    throw new Error("Not authorized");
  }

  // 1) Load item
  const getResp = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CLOSET#${closetItemId}`,
        sk: `CLOSET#${closetItemId}`,
      },
    }),
  );

  const item = getResp.Item;
  if (!item) {
    throw new Error("Closet item not found");
  }

  // 2) Only APPROVED → PUBLISHED
  if (item.status !== "APPROVED") {
    throw new Error("Item must be APPROVED before publishing");
  }

  const now = new Date().toISOString();

  // If mediaKey is still empty but we have a rawMediaKey,
  // use rawMediaKey as the thumbnail so the UI has something to render.
  const shouldSetMediaKey = (!item.mediaKey || item.mediaKey === "") && item.rawMediaKey;

  let UpdateExpression = "SET #status = :published, #updatedAt = :now";
  const ExpressionAttributeNames: Record<string, string> = {
    "#status": "status",
    "#updatedAt": "updatedAt",
  };
  const ExpressionAttributeValues: Record<string, any> = {
    ":published": "PUBLISHED",
    ":now": now,
  };

  if (shouldSetMediaKey) {
    UpdateExpression += ", #mediaKey = :mediaKey";
    ExpressionAttributeNames["#mediaKey"] = "mediaKey";
    ExpressionAttributeValues[":mediaKey"] = item.rawMediaKey;
  }

  // 3) Update status (and maybe mediaKey) in DynamoDB
  const updateResp = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CLOSET#${closetItemId}`,
        sk: `CLOSET#${closetItemId}`,
      },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "ALL_NEW",
    }),
  );

  // 4) Return updated item – AppSync will map this to ClosetItem
  return {
    id: closetItemId,
    ...updateResp.Attributes,
  };
};
