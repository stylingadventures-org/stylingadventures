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

  // Optional: enforce admin group, in addition to AppSync @auth
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

  // 2) Optional: only APPROVED → PUBLISHED
  if (item.status !== "APPROVED") {
    throw new Error("Item must be APPROVED before publishing");
  }

  const now = new Date().toISOString();

  // 3) Update status to PUBLISHED (+ updatedAt)
  const updateResp = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CLOSET#${closetItemId}`,
        sk: `CLOSET#${closetItemId}`,
      },
      UpdateExpression: "SET #status = :published, #updatedAt = :now",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":published": "PUBLISHED",
        ":now": now,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  // 4) Map back to GraphQL ClosetItem shape if needed
  return {
    id: closetItemId,
    ...updateResp.Attributes,
  };
};
