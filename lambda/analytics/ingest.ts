import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import AnalyticsService from "../../../lib/services/analytics.service";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const analyticsService = new AnalyticsService(docClient);

interface AnalyticsEvent {
  eventType: "engagement" | "content" | "financial" | "creator";
  userId: string;
  details: any;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[analytics-ingest] Event:", JSON.stringify(event));

    const body = JSON.parse(event.body || "{}") as AnalyticsEvent;

    if (!body.eventType || !body.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Missing eventType or userId",
        }),
      };
    }

    switch (body.eventType) {
      case "engagement":
        await analyticsService.recordEngagementEvent(
          body.userId,
          body.details.type,
          body.details.metadata
        );
        break;
      case "content":
        await analyticsService.recordContentMetric(
          body.userId,
          body.details.contentType,
          body.details.status,
          body.details.metadata
        );
        break;
      case "financial":
        await analyticsService.recordFinancialMetric(
          body.userId,
          body.details.type,
          body.details.amount,
          body.details.source,
          body.details.metadata
        );
        break;
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ ok: false, error: "Unknown event type" }),
        };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ ok: true, eventType: body.eventType }),
    };
  } catch (error) {
    console.error("[analytics-ingest] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to ingest analytics" }),
    };
  }
};
