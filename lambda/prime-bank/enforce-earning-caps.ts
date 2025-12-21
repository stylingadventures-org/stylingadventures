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
    console.log("[enforce-earning-caps] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const result = await primeBankService.enforceCaps(userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        userId,
        ...result,
      }),
    };
  } catch (error) {
    console.error("[enforce-earning-caps] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to enforce caps" }),
    };
  }
};
}

export const handler: Handler<EnforceEarningCapsEvent, any> = async (event) => {
  console.log("EnforceEarningCaps event:", JSON.stringify(event));

  const { userId, amountToAward, role } = event;

  // 1) Fetch current account
  const resp = await ddb.send(
    new GetItemCommand({
      TableName: ACCOUNT_TABLE_NAME,
      Key: { userId: { S: userId } },
    })
  );

  // TODO: pull these from config, not hard-coded.
  const dailyCap = role === "Bestie" ? 100 : 50;
  const weeklyCap = role === "Bestie" ? 500 : 250;

  // Very naive logic for now:
  // - Just check if requested amount is under the caps.
  // - In the future you'll read dailyCoinTotal / weeklyCoinTotal and reset them based on lastDailyReset / lastWeeklyReset.
  const allowed = amountToAward <= dailyCap && amountToAward <= weeklyCap;

  if (!allowed) {
    return {
      ok: false,
      reason: "CAP_EXCEEDED",
      suggestedMaxAward: Math.min(dailyCap, weeklyCap),
    };
  }

  // 2) (Placeholder) update daily/weekly totals
  await ddb.send(
    new UpdateItemCommand({
      TableName: ACCOUNT_TABLE_NAME,
      Key: { userId: { S: userId } },
      UpdateExpression:
        "ADD dailyCoinTotal :delta, weeklyCoinTotal :delta SET lastDailyReset = :today, lastWeeklyReset = :today",
      ExpressionAttributeValues: {
        ":delta": { N: String(amountToAward) },
        ":today": { S: new Date().toISOString().slice(0, 10) },
      },
    })
  );

  return {
    ok: true,
    userId,
    amountToAward,
  };
};
