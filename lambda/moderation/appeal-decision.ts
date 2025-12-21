import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface AppealRequest {
  itemId: string;
  appealReason: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[appeal-decision] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const body = JSON.parse(event.body || "{}") as AppealRequest;

    if (!body.itemId || !body.appealReason) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Missing itemId or appealReason",
        }),
      };
    }

    const modAudit = await docClient.send(
      new GetCommand({
        TableName: "MODERATION_AUDIT",
        Key: { itemId: body.itemId },
      })
    );

    if (!modAudit.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ ok: false, error: "Moderation record not found" }),
      };
    }

    const audit = modAudit.Item as any;

    if (audit.userId !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          ok: false,
          error: "Can only appeal own content decisions",
        }),
      };
    }

    const appealId = `appeal_${body.itemId}_${Date.now()}`;

    await docClient.send(
      new PutCommand({
        TableName: "MODERATION_APPEALS",
        Item: {
          appealId,
          itemId: body.itemId,
          userId,
          appealReason: body.appealReason,
          status: "PENDING",
          created_at: Date.now(),
          original_decision: audit.status,
          original_reason: audit.reason || "",
        },
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        ok: true,
        appealId,
        status: "PENDING",
        itemId: body.itemId,
      }),
    };
  } catch (error) {
    console.error("[appeal-decision] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to file appeal" }),
    };
  }
};
