import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import ModerationService from "../../../lib/services/moderation.service";
import { ModerationAnalysis } from "../../../lib/types/moderation";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const moderationService = new ModerationService(docClient);

interface AnalyzeContentRequest {
  itemId: string;
  userId: string;
  contentType: "text" | "image" | "metadata";
  content: {
    text?: string;
    imageUrl?: string;
    tags?: string[];
    description?: string;
  };
  minorsRisk?: boolean;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[analyze-content] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const requestingUserId = claims?.sub;

    if (!requestingUserId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const body = JSON.parse(event.body || "{}") as AnalyzeContentRequest;

    if (!body.itemId || !body.userId || !body.content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Missing required fields" }),
      };
    }

    if (body.content.text && body.content.text.length > 5000) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Text content exceeds 5000 character limit",
        }),
      };
    }

    const analysis: ModerationAnalysis = await moderationService.analyzeContent(
      body.itemId,
      body.userId,
      body.content as any
    );

    const decision = await moderationService.makeModerationDecision(
      body.itemId,
      body.userId,
      analysis
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        itemId: body.itemId,
        analysis,
        decision,
      }),
    };
  } catch (error) {
    console.error("[analyze-content] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to analyze content" }),
    };
  }
};
