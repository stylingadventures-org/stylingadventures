// lambda/thumb-head/index.ts
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
// Prefer WEB_BUCKET, fall back to BUCKET for back-compat with older CDK stacks
const BUCKET = (process.env.WEB_BUCKET || process.env.BUCKET || "").trim();
const THUMBS_PREFIX = "thumbs/";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    // CORS preflight
    if ((event.requestContext?.http?.method || "").toUpperCase() === "OPTIONS") {
      return {
        statusCode: 204,
        headers: corsHeaders(),
        body: "",
      };
    }

    if (!BUCKET) {
      return json(500, { message: "Missing WEB_BUCKET (or BUCKET) env var" });
    }

    const qs = event.queryStringParameters || {};
    const key = (qs.key || "").trim();

    // Require a concrete thumbnail key like "thumbs/.../file.jpg"
    if (!key || !key.startsWith(THUMBS_PREFIX)) {
      return json(400, { message: "Missing or invalid 'key' query parameter" });
    }

    // HEAD the object
    try {
      const resp = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      return json(200, {
        exists: true,
        contentLength: resp.ContentLength ?? null,
        contentType: resp.ContentType ?? null,
      });
    } catch (err: any) {
      // Not found
      if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") {
        return json(404, { exists: false });
      }
      // Any other S3 error
      return json(502, { message: "S3 head failed", error: stringify(err) });
    }
  } catch (e: any) {
    return json(500, { message: "Unhandled error", error: stringify(e) });
  }
};

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

// Simple permissive CORS (never return HTML)
function corsHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,HEAD,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,x-amz-date,x-api-key,x-amz-security-token",
    "cache-control": "private, max-age=2",
  };
}

function stringify(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in (e as any)) return String((e as any).message);
  try {
    return JSON.stringify(e);
  } catch {
    return "Unknown error";
  }
}






