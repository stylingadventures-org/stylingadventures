import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const { itemId } = event;

  const now = new Date().toISOString();

  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: { S: `ITEM#${itemId}` }, sk: { S: "META" } },
      UpdateExpression:
        "SET #s = :s, gsi2pk = :gpk, gsi2sk = :gsk, updatedAt = :u",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": { S: "PUBLISHED" },
        ":gpk": { S: "STATUS#PUBLISHED" },
        ":gsk": { S: now },
        ":u": { S: now },
      },
    })
  );

  return { ok: true };
};
