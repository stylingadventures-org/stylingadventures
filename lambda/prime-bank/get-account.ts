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
    console.log("[get-account] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const requestedUserId = event.pathParameters?.userId || userId;

    if (requestedUserId !== userId && !claims?.["cognito:groups"]?.includes("admin")) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          ok: false,
          error: "Cannot view other users' accounts",
        }),
      };
    }

    const result = await primeBankService.getAccount(requestedUserId);

    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ ok: false, error: "Account not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        account: result,
      }),
    };
  } catch (error) {
    console.error("[get-account] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to fetch account" }),
    };
  }
};
  arguments: { userId?: string };
  info: { fieldName: string };
  identity?: SAIdentity;
}

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;

  if (fieldName === "getPrimeBankAccount") {
    const userId = event.arguments.userId;
    if (!userId) {
      throw new Error("userId is required");
    }
    return await fetchAccount(userId);
  }

  if (fieldName === "myPrimeBankAccount") {
    const sub = event.identity?.sub;
    if (!sub) {
      throw new Error("Unauthenticated");
    }
    return await fetchAccount(sub);
  }

  throw new Error(`Unknown field: ${fieldName}`);
};

async function fetchAccount(userId: string) {
  const resp = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { userId: { S: userId } },
    }),
  );

  if (!resp.Item) {
    return null;
  }

  const i = resp.Item;

  return {
    userId: i.userId?.S ?? userId,
    role: i.role?.S ?? null,
    primeCoins: Number(i.primeCoins?.N ?? "0"),
    creatorCredits: Number(i.creatorCredits?.N ?? "0"),
    bankMeterProgress: Number(i.bankMeterProgress?.N ?? "0"),
    dailyCoinTotal: i.dailyCoinTotal?.N
      ? Number(i.dailyCoinTotal.N)
      : null,
    weeklyCoinTotal: i.weeklyCoinTotal?.N
      ? Number(i.weeklyCoinTotal.N)
      : null,
    lastDailyReset: i.lastDailyReset?.S ?? null,
    lastWeeklyReset: i.lastWeeklyReset?.S ?? null,
  };
}
