// lambda/toggleFavoriteClosetItem.js
import {
  DynamoDBClient,
  GetItemCommand,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const ddb = new DynamoDBClient({});
const CLOSET_TABLE = process.env.CLOSET_TABLE;
const FAVORITES_TABLE = process.env.CLOSET_FAVORITES_TABLE;

export const handler = async (event) => {
  const { id, on } = event.arguments || {};
  const identity = event.identity || {};
  const userSub = identity.sub;

  if (!userSub) {
    throw new Error("Not authenticated");
  }
  if (!id) {
    throw new Error("Missing closet item id");
  }

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
    typeof on === "boolean" ? on : !currentlyOn; // explicit or toggle

  // No change needed? Just return the current item.
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
    const item = unmarshall(itemResp.Item);
    return {
      ...item,
      favoriteCount: item.favoriteCount ?? 0,
      viewerHasFaved: desiredOn,
    };
  }

  const increment = desiredOn ? 1 : -1;

  // 2) Atomically update count + favorite row using a transaction
  const txItems = [];

  // Update favoriteCount on main item
  txItems.push({
    Update: {
      TableName: CLOSET_TABLE,
      Key: itemKey,
      UpdateExpression:
        "SET favoriteCount = if_not_exists(favoriteCount, :zero) + :inc",
      ConditionExpression: "attribute_exists(PK)", // must exist
      ExpressionAttributeValues: {
        ":zero": { N: "0" },
        ":inc": { N: String(increment) },
      },
    },
  });

  if (desiredOn) {
    // Turning ON: put a row in favorites table
    txItems.push({
      Put: {
        TableName: FAVORITES_TABLE,
        Item: {
          ...favKey,
          closetItemId: { S: id },
          createdAt: { S: new Date().toISOString() },
        },
        ConditionExpression: "attribute_not_exists(PK)", // no double-like
      },
    });
  } else {
    // Turning OFF: delete the row
    txItems.push({
      Delete: {
        TableName: FAVORITES_TABLE,
        Key: favKey,
        ConditionExpression: "attribute_exists(PK)", // only if it existed
      },
    });
  }

  await ddb.send(
    new TransactWriteItemsCommand({
      TransactItems: txItems,
    })
  );

  // 3) Read the updated item and return it with viewerHasFaved flag
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

  const item = unmarshall(itemResp.Item);
  const favoriteCount = item.favoriteCount ?? 0;

  return {
    ...item,
    favoriteCount: favoriteCount < 0 ? 0 : favoriteCount, // safety clamp
    viewerHasFaved: desiredOn,
  };
};
