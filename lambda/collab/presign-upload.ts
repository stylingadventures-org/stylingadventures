import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

const S3_BUCKET = process.env.COLLAB_BUCKET || "stylingadventures-collabs";

interface PresignUploadRequest {
  fileName: string;
  contentType: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[presign-upload] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const collabId = event.pathParameters?.collabId;
    const body = JSON.parse(event.body || "{}") as PresignUploadRequest;

    if (!collabId || !body.fileName || !body.contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Missing collabId, fileName, or contentType",
        }),
      };
    }

    const collab = await docClient.send(
      new GetCommand({
        TableName: "COLLABORATIONS",
        Key: { collabId },
      })
    );

    if (!collab.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ ok: false, error: "Collaboration not found" }),
      };
    }

    const collaboration = collab.Item as any;
    const isMember =
      collaboration.inviterId === userId ||
      collaboration.inviteeId === userId;

    if (!isMember) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          ok: false,
          error: "Not a member of this collaboration",
        }),
      };
    }

    const s3Key = `collabs/${collabId}/${userId}/${body.fileName}`;

    const putCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      ContentType: body.contentType,
      Metadata: {
        collabId,
        uploadedBy: userId,
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 3600,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        presignedUrl,
        uploadMetadata: {
          bucket: S3_BUCKET,
          key: s3Key,
          expiresIn: 3600,
          collabId,
        },
      }),
    };
  } catch (error) {
    console.error("[presign-upload] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to generate presigned URL" }),
    };
  }
};