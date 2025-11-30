import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});

export const handler = async (event: any) => {
  console.log("create-invite input", JSON.stringify(event));

  // TODO: implement real invite logic
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
};