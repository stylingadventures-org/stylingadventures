// lambda/shopping/link-closet-item-to-product.ts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { AppSyncResolverEvent } from "aws-lambda";

const CLOSET_MAP_TABLE = process.env.CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME!;
const client = new DynamoDBClient({});
const ddbDoc = DynamoDBDocumentClient.from(client);

// Matches GraphQL mutation args
type Args = {
  closetItemId: string;
  productId: string;
};

export const handler = async (
  event: AppSyncResolverEvent<Args>
) => {
  const { closetItemId, productId } = event.arguments;

  if (!closetItemId || !productId) {
    throw new Error("closetItemId and productId are required");
  }

  // Insert mapping row
  await ddbDoc.send(
    new PutCommand({
      TableName: CLOSET_MAP_TABLE,
      Item: {
        closetItemId,
        productId,
        matchConfidence: 100,
        source: "Manual",
      },
    })
  );

  // Must match:
  // linkClosetItemToProduct(...): Boolean!
  return true;
};
