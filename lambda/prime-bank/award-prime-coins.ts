import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import PrimeBankService from "../../../lib/services/prime-bank.service";
import { AwardCoinsRequest } from "../../../lib/types/prime-bank";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const primeBankService = new PrimeBankService(docClient);

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[award-prime-coins] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const body = JSON.parse(event.body || "{}") as AwardCoinsRequest;

    if (!body.amount || body.amount < 1 || body.amount > 1000) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Amount must be between 1 and 1000",
        }),
      };
    }

    if (!body.source) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Missing coin source" }),
      };
    }

    const result = await primeBankService.awardCoins({
      userId,
      amount: body.amount,
      source: body.source as any,
      reason: body.reason,
    });

    if (!result.ok) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: result.error }),
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        ok: true,
        transactionId: result.transactionId,
        newBalance: result.newBalance,
        remainingCaps: result.remainingCaps,
      }),
    };
  } catch (error) {
    console.error("[award-prime-coins] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to award coins" }),
    };
  }
};
