import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "";

interface HumanReviewRequest {
  itemId: string;
  decision: "approved" | "rejected";
  reviewReason?: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[human-review] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const reviewerId = claims?.sub;
    const reviewerRole = claims?.[\"cognito:groups\"]?.[0];

    if (!reviewerId || reviewerRole !== "moderator") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          ok: false,
          error: "Moderator access required",
        }),
      };
    }

    const body = JSON.parse(event.body || "{}") as HumanReviewRequest;

    if (!body.itemId || !body.decision) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Missing itemId or decision",
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
    const newStatus = body.decision === "approved" ? "APPROVED" : "REJECTED";

    await docClient.send(
      new UpdateCommand({
        TableName: "MODERATION_AUDIT",
        Key: { itemId: body.itemId },
        UpdateExpression:
          "SET #status = :status, reviewed_by = :reviewer, reviewed_at = :now, review_reason = :reason",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": newStatus,
          ":reviewer": reviewerId,
          ":now": Date.now(),
          ":reason": body.reviewReason || "",
        },
      })
    );

    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: `Content Review Complete: ${newStatus}`,
        Message: `Your content ${body.itemId} has been reviewed and ${newStatus.toLowerCase()}`,
        MessageAttributes: {
          itemId: { DataType: "String", StringValue: body.itemId },
          decision: { DataType: "String", StringValue: body.decision },
          userId: { DataType: "String", StringValue: audit.userId },
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        itemId: body.itemId,
        status: newStatus,
        decision: body.decision,
      }),
    };
  } catch (error) {
    console.error("[human-review] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to complete review" }),
    };
  }
};
