import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import CollaborationService from "../../../lib/services/collaboration.service";
import { CollaborationResponse } from "../../../lib/types/collaboration";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const collaborationService = new CollaborationService(docClient, null);

interface AcceptTermsRequest {
  agreeToMaster: boolean;
  agreeToAddendum: boolean;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[accept-terms] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const collabId = event.pathParameters?.collabId;
    const body = JSON.parse(event.body || "{}") as AcceptTermsRequest;

    if (!collabId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Missing collabId" }),
      };
    }

    if (!body.agreeToMaster || !body.agreeToAddendum) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Must agree to both master and addendum",
        }),
      };
    }

    const result = await collaborationService.acceptTerms(
      collabId,
      userId,
      body.agreeToMaster,
      body.agreeToAddendum
    );

    if (!result.ok) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: result.error }),
      };
    }

    const response: CollaborationResponse = {
      ok: true,
      collabId: result.collabId,
      status: result.status,
      bothAccepted: result.bothAccepted,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("[accept-terms] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to accept terms" }),
    };
  }
};