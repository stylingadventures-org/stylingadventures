import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import PrimeBankService from "../../../lib/services/prime-bank.service";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const primeBankService = new PrimeBankService(docClient);

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[calculate-bank-meter] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const result = await primeBankService.calculateBankMeter(userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        userId,
        ...result,
      }),
    };
  } catch (error) {
    console.error("[calculate-bank-meter] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to calculate meter" }),
    };
  }
};export const handler: Handler<CalculateBankMeterEvent, any> = async (event) => {
  console.log("CalculateBankMeter event:", JSON.stringify(event));

  const { userId } = event;

  // 1) Fetch current account
  const resp = await ddb.send(
    new GetItemCommand({
      TableName: ACCOUNT_TABLE_NAME,
      Key: { userId: { S: userId } },
    })
  );

  // TODO: use your real logic here.
  // For now, just set a dummy value (e.g., 10).
  const newMeterValue = 10;

  await ddb.send(
    new UpdateItemCommand({
      TableName: ACCOUNT_TABLE_NAME,
      Key: { userId: { S: userId } },
      UpdateExpression: "SET bankMeterProgress = :value",
      ExpressionAttributeValues: {
        ":value": { N: String(newMeterValue) },
      },
    })
  );

  return {
    ok: true,
    userId,
    bankMeterProgress: newMeterValue,
  };
};
