import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import CollaborationService from "../../../lib/services/collaboration.service";
import { CollaborationResponse } from "../../../lib/types/collaboration";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const collaborationService = new CollaborationService(docClient, s3Client);

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[accept-invite] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const inviteeId = claims?.sub;

    if (!inviteeId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const inviteToken = event.pathParameters?.token;

    if (!inviteToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Missing invite token" }),
      };
    }

    const result = await collaborationService.acceptInvite(
      inviteToken,
      inviteeId
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
      sharedWorkspace: {
        s3Prefix: `collabs/${result.collabId}/`,
        readAccess: true,
        writeAccess: true,
      },
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("[accept-invite] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to accept invite" }),
    };
  }
};