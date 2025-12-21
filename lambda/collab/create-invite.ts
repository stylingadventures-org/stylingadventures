import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import CollaborationService from "../../../lib/services/collaboration.service";
import { ProjectAddendum, CollaborationResponse } from "../../../lib/types/collaboration";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const collaborationService = new CollaborationService(docClient, null);

interface CreateInviteRequest {
  inviteeId: string;
  deliverables: {
    type: string;
    description: string;
    dueDate: number;
  }[];
  customSplit?: { prime_pct: number; creator_pct: number };
  deadlines: {
    kickoffDate: number;
    deliveryDate: number;
    approvalDeadline: number;
  };
  exclusivityTier?: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[create-invite] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const inviterId = claims?.sub;

    if (!inviterId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const body = JSON.parse(event.body || "{}") as CreateInviteRequest;

    if (!body.inviteeId || !body.deliverables?.length || !body.deadlines) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Missing required fields" }),
      };
    }

    const addendumConfig: ProjectAddendum = {
      deliverables: body.deliverables,
      earningsSplit: body.customSplit || { prime_pct: 50, creator_pct: 50 },
      deadlines: body.deadlines,
      exclusivityClause: body.exclusivityTier
        ? { exclusive: true, tier: body.exclusivityTier as any, duration: 90 }
        : undefined,
    };

    const result = await collaborationService.createInvite(
      inviterId,
      body.inviteeId,
      addendumConfig
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
      inviteId: result.inviteId,
      token: result.token,
    };

    return {
      statusCode: 201,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("[create-invite] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to create invite" }),
    };
  }
};