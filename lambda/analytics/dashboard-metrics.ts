import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import AnalyticsService from "../../../lib/services/analytics.service";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const analyticsService = new AnalyticsService(docClient);

interface DashboardQuery {
  granularity: "daily" | "weekly" | "monthly";
  days?: number;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[dashboard-metrics] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub;
    const userRole = claims?.[\"cognito:groups\"]?.[0];

    if (!userId || userRole !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          ok: false,
          error: "Admin access required",
        }),
      };
    }

    const query = JSON.parse(event.body || "{}") as DashboardQuery;
    const granularity = query.granularity || "daily";
    const days = query.days || 7;

    const now = Date.now();
    const startTime = now - days * 86400000;

    const [engagement, content, financial, creators] = await Promise.all([
      analyticsService.calculateEngagementMetrics(startTime, now),
      analyticsService.calculateContentMetrics(startTime, now),
      analyticsService.calculateFinancialMetrics(startTime, now),
      analyticsService.calculateCreatorMetrics(startTime, now),
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        dashboard: {
          period: granularity,
          engagement,
          content,
          financial,
          creators,
          timestamp: now,
        },
      }),
    };
  } catch (error) {
    console.error("[dashboard-metrics] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Failed to calculate dashboard metrics",
      }),
    };
  }
};
