import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface AdminReviewRequest {
  decision: "approve" | "reject";
  reason?: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[admin-review] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const adminId = claims?.sub;
    const adminRole = claims?.["cognito:groups"]?.[0];

    if (!adminId || adminRole !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({ ok: false, error: "Admin access required" }),
      };
    }

    const collabId = event.pathParameters?.collabId;
    const body = JSON.parse(event.body || "{}") as AdminReviewRequest;

    if (!collabId || !body.decision) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Missing collabId or decision",
        }),
      };
    }

    const newStatus =
      body.decision === "approve" ? "ACTIVE" : "REJECTED";

    await docClient.send(
      new UpdateCommand({
        TableName: "COLLABORATIONS",
        Key: { collabId },
        UpdateExpression:
          "SET #status = :status, admin_reviewed_at = :now, admin_review_reason = :reason",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": newStatus,
          ":now": Date.now(),
          ":reason": body.reason || "",
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        status: newStatus,
        decision: body.decision,
      }),
    };
  } catch (error) {
    console.error("[admin-review] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to review collaboration" }),
    };
  }
};