// lambda/closet/toggleFavoriteClosetItem.js

const {
  DynamoDBClient,
  GetItemCommand,
  TransactWriteItemsCommand,
} = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

const ddb = new DynamoDBClient({});

const CLOSET_TABLE = process.env.CLOSET_TABLE;
const FAVORITES_TABLE = process.env.CLOSET_FAVORITES_TABLE;

exports.handler = async (event) => {
  console.log("toggleFavoriteClosetItem event:", JSON.stringify(event));

  const args = event?.arguments || {};
  const { id } = args;

  const explicitFavoriteOn =
    typeof args.favoriteOn === "boolean" ? args.favoriteOn : undefined;
  const legacyOn =
    typeof args.on === "boolean" ? args.on : undefined;

  const identity = event?.identity || {};
  const userSub = identity.sub || identity.username;

  if (!userSub) {
    throw new Error("Not authenticated");
  }
  if (!id) {
    throw new Error("Missing closet item id");
  }
  if (!CLOSET_TABLE || !FAVORITES_TABLE) {
    throw new Error(
      "CLOSET_TABLE or CLOSET_FAVORITES_TABLE env var is not set"
    );
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

  // Decide what the new value should be
  let desiredOn;
  if (typeof explicitFavoriteOn === "boolean") {
    desiredOn = explicitFavoriteOn;
  } else if (typeof legacyOn === "boolean") {
    desiredOn = legacyOn;
  } else {
    desiredOn = !currentlyOn; // toggle
  }

  console.log(
    `toggleFavoriteClosetItem id=${id}, user=${userSub}, currentlyOn=${currentlyOn}, desiredOn=${desiredOn}`
  );

  // If nothing to change, just return the existing item with viewerHasFaved
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

  // 2) Transaction: update main item count + favorites table row
  const txItems = [];

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
    favoriteCount: favoriteCount < 0 ? 0 : favoriteCount,
    viewerHasFaved: desiredOn,
  };
};
