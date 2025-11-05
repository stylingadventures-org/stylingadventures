import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

/** S3 */
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});
const BUCKET = process.env.BUCKET || "";

/** CORS allow-list */
const ALLOWED_ORIGINS: string[] = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Optional single-origin fallback for back-compat */
const FALLBACK_ORIGIN = (process.env.WEB_ORIGIN || "").trim();

/** pick an allowed origin for the response */
function pickAllowedOrigin(event: APIGatewayProxyEventV2): string | undefined {
  const req =
    (event.headers?.origin as string) ||
    (event.headers?.Origin as string) ||
    "";
  if (ALLOWED_ORIGINS.length > 0) {
    return ALLOWED_ORIGINS.includes(req) ? req : undefined;
  }
  return FALLBACK_ORIGIN || undefined;
}

/** shared headers */
function baseHeaders(origin?: string): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers":
      "authorization,Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Cache-Control": "private, max-age=2",
    Vary: "Origin",
  };
  if (origin) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

/** Convert a *source* key (users/..../file.ext) to its thumb key (thumbs/..../file.jpg) */
function toThumbKey(srcKey: string): string {
  const decoded = decodeURIComponent(String(srcKey));
  const safe = decoded.replace(/^[/\\]+/, "").replace(/\.\./g, "");
  if (safe.startsWith("thumbs/")) return safe;
  return `thumbs/${safe.replace(/\.[^.]+$/, ".jpg")}`;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const origin = pickAllowedOrigin(event);
  const method =
    event.requestContext?.http?.method || (event as any).httpMethod || "GET";

  // --- CORS preflight ---
  if (method === "OPTIONS") {
    const hadReqOrigin = !!(
      event.headers?.origin || event.headers?.Origin
    );
    if (hadReqOrigin && !origin) {
      // preflight from non-allowed origin
      return { statusCode: 403, headers: baseHeaders(undefined), body: "" };
    }
    return { statusCode: 204, headers: baseHeaders(origin), body: "" };
  }

  // Safety checks
  if (!BUCKET) {
    return {
      statusCode: 500,
      headers: baseHeaders(origin),
      body: JSON.stringify({ message: "Missing BUCKET env var" }),
    };
  }

  const rawKey = event.queryStringParameters?.key || "";
  if (!rawKey) {
    return {
      statusCode: 400,
      headers: baseHeaders(origin),
      body: JSON.stringify({ message: "Missing key" }),
    };
  }

  const thumbKey = toThumbKey(rawKey);

  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: thumbKey }));

    // HEAD => just the status
    if (method === "HEAD") {
      return { statusCode: 204, headers: baseHeaders(origin), body: "" };
    }

    // GET => structured response for polling
    return {
      statusCode: 200,
      headers: baseHeaders(origin),
      body: JSON.stringify({ ready: true, key: thumbKey }),
    };
  } catch {
    // Not found yet
    if (method === "HEAD") {
      return { statusCode: 404, headers: baseHeaders(origin), body: "" };
    }
    return {
      statusCode: 200,
      headers: baseHeaders(origin),
      body: JSON.stringify({ ready: false, key: thumbKey }),
    };
  }
};





