import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Readable } from "stream";
import LayoutValidationService from "../../../lib/services/layout-validation.service";

const s3 = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const layoutService = new LayoutValidationService();

const BUCKET = process.env.LAYOUT_TEMPLATES_BUCKET || "styling-layouts";

async function streamToString(stream: any): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as Readable) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

interface ValidateLayoutRequest {
  layoutKey: string;
  schemaKey: string;
  userId: string;
  saveResult?: boolean;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log("[validate-layout] Event:", JSON.stringify(event));

    const claims = event.requestContext.authorizer?.claims;
    const requestingUserId = claims?.sub;

    if (!requestingUserId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Not authenticated" }),
      };
    }

    const body = JSON.parse(event.body || "{}") as ValidateLayoutRequest;

    if (!body.layoutKey || !body.schemaKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: "Missing layoutKey or schemaKey",
        }),
      };
    }

    const [layoutObj, schemaObj] = await Promise.all(
      [body.layoutKey, body.schemaKey].map(async (Key) => {
        const res = await s3.send(
          new GetObjectCommand({ Bucket: BUCKET, Key })
        );
        const data = await streamToString(res.Body as any);
        return JSON.parse(data);
      })
    );

    const result = await layoutService.validateLayout(layoutObj, schemaObj);

    if (body.saveResult) {
      const validationId = `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await docClient.send(
        new PutCommand({
          TableName: "LAYOUT_VALIDATIONS",
          Item: {
            validationId,
            userId: body.userId || requestingUserId,
            layoutKey: body.layoutKey,
            schemaKey: body.schemaKey,
            result,
            created_at: Date.now(),
          },
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          validationId,
          ...result,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        ...result,
      }),
    };
  } catch (error) {
    console.error("[validate-layout] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Failed to validate layout",
      }),
    };
  }
};
