// lambda/closet/toggleFavorite.ts
import {
  DynamoDBClient,
  GetItemCommand,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { AppSyncResolverEvent } from "aws-lambda";

const ddb = new DynamoDBClient({});

// Env vars set in your stack
const CLOSET_TABLE = process.env.CLOSET_TABLE!;
const FAVORITES_TABLE = process.env.CLOSET_FAVORITES_TABLE!;

type ToggleArgs = {
  id: string;
  favoriteOn?: boolean | null;
  // back-compat: some older code might send `on`
  on?: boolean | null;
};

type ClosetItem = {
  id: string;
  favoriteCount?: number | null;
  [key: string]: any; // allow extra attributes
};

export const handler = async (
  event: AppSyncResolverEvent<ToggleArgs>
): Promise<ClosetItem> => {
  const { id, favoriteOn, on } = event.arguments || ({} as ToggleArgs);
  const userSub =
    (event.identity as any)?.sub ||
    (event.identity as any)?.username ||
    (event.identity as any)?.claims?.sub;

  if (!userSub) {
    throw new Error("Not authenticated");
  }

  if (!id) {
    throw new Error("Missing closet item id");
  }

  // Accept either favoriteOn (new) or on (old)
  const explicitFlag =
    typeof favoriteOn === "boolean" ? favoriteOn : typeof on === "boolean" ? on : undefined;

  const itemKey = {
    PK: { S: `CLOSET#${id}` },
    SK: { S: `CLOSET#${id}` },
  };

  const favKey = {
    PK: { S: `USER#${userSub}` },
    SK: { S: `FAVORITE#${id}` },
  };

  // 1) Check whether this user already has a favorite row
  const favResp = await ddb.send(
    new GetItemCommand({
      TableName: FAVORITES_TABLE,
      Key: favKey,
      ConsistentRead: true,
    })
  );

  const currentlyOn = !!favResp.Item;
  const desiredOn =
    typeof explicitFlag === "boolean" ? explicitFlag : !currentlyOn; // explicit or toggle

  // No change? just return current item with the viewer flag
  if (desiredOn === currentlyOn) {
    const itemResp = await ddb.send(
      new GetItemCommand({
        TableName: CLOSET_TABLE,
        Key: itemKey,
        ConsistentRead: true,
      })
    );
    if (!itemResp.Item) {
      throw new Error("Closet item not found");
    }
    const item = unmarshall(itemResp.Item) as ClosetItem;
    return {
      ...item,
      favoriteCount: item.favoriteCount ?? 0,
      viewerHasFaved: desiredOn,
    };
  }

  const increment = desiredOn ? 1 : -1;

  // 2) Transaction: update aggregate count + per-user record
  const txItems: any[] = [];

  // Update favoriteCount on the main item
  txItems.push({
    Update: {
      TableName: CLOSET_TABLE,
      Key: itemKey,
      UpdateExpression:
        "SET favoriteCount = if_not_exists(favoriteCount, :zero) + :inc",
      ConditionExpression: "attribute_exists(PK)",
      ExpressionAttributeValues: {
        ":zero": { N: "0" },
        ":inc": { N: String(increment) },
      },
    },
  });

  if (desiredOn) {
    // Turning ON: insert favorites row
    txItems.push({
      Put: {
        TableName: FAVORITES_TABLE,
        Item: {
          ...favKey,
          closetItemId: { S: id },
          createdAt: { S: new Date().toISOString() },
        },
        ConditionExpression: "attribute_not_exists(PK)",
      },
    });
  } else {
    // Turning OFF: delete favorites row
    txItems.push({
      Delete: {
        TableName: FAVORITES_TABLE,
        Key: favKey,
        ConditionExpression: "attribute_exists(PK)",
      },
    });
  }

  await ddb.send(
    new TransactWriteItemsCommand({
      TransactItems: txItems,
    })
  );

  // 3) Read back the updated item and return it with viewerHasFaved
  const itemResp = await ddb.send(
    new GetItemCommand({
      TableName: CLOSET_TABLE,
      Key: itemKey,
      ConsistentRead: true,
    })
  );

  if (!itemResp.Item) {
    throw new Error("Closet item not found after update");
  }

  const item = unmarshall(itemResp.Item) as ClosetItem;
  const favoriteCount = item.favoriteCount ?? 0;

  return {
    ...item,
    favoriteCount: favoriteCount < 0 ? 0 : favoriteCount,
    viewerHasFaved: desiredOn,
  };
};
