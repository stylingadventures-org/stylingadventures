import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/* ---------------- S3 client (path-style) ---------------- */
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  forcePathStyle: true,
});

const BUCKET = process.env.BUCKET!;

/* ============================== CORS helpers ============================== */
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const FALLBACK_ORIGIN = process.env.WEB_ORIGIN || "";

// Include lowercase 'authorization' since browsers may send that in preflight.
const ALLOW_HEADERS = [
  "authorization",
  "Authorization",
  "Content-Type",
  "X-Amz-Date",
  "X-Api-Key",
  "X-Amz-Security-Token",
].join(",");

function pickAllowedOrigin(event: any): string | undefined {
  const reqOrigin = event?.headers?.origin || event?.headers?.Origin || "";
  if (ALLOWED_ORIGINS.length) {
    return ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : undefined;
  }
  return FALLBACK_ORIGIN || undefined; // back-compat single origin
}

function baseCorsHeaders(origin?: string) {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    // Help caches/proxies treat each origin/request-method/header set distinctly
    Vary: "Origin, Access-Control-Request-Headers, Access-Control-Request-Method",
  };
  if (origin) h["Access-Control-Allow-Origin"] = origin; // EXACTLY one origin, only if allowed
  return h;
}

function ok(
  event: any,
  body: unknown,
  extra: Record<string, string> = {}
): APIGatewayProxyResult {
  const origin = pickAllowedOrigin(event);
  return {
    statusCode: 200,
    headers: { ...baseCorsHeaders(origin), ...extra },
    body: JSON.stringify(body),
  };
}

function noContent(event: any): APIGatewayProxyResult {
  const origin = pickAllowedOrigin(event);
  return { statusCode: 204, headers: baseCorsHeaders(origin), body: "" };
}

function bad(
  event: any,
  status: number,
  msg: string
): APIGatewayProxyResult {
  const origin = pickAllowedOrigin(event);
  const hasReqOrigin = !!(event.headers?.origin || event.headers?.Origin);
  if (hasReqOrigin && !origin) {
    // Do NOT echo ACAO for disallowed origins
    return {
      statusCode: 403,
      headers: baseCorsHeaders(undefined),
      body: JSON.stringify({ message: "CORS: origin not allowed" }),
    };
  }
  return {
    statusCode: status,
    headers: baseCorsHeaders(origin),
    body: JSON.stringify({ message: msg }),
  };
}
/* ============================ end CORS helpers ============================ */

/* ----------------------------- utils ----------------------------- */
type AnyEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2 | any;

function getMethod(e: AnyEvent): string {
  return (e as any).httpMethod ?? e.requestContext?.http?.method ?? "GET";
}

function getClaims(e: AnyEvent): Record<string, any> {
  return (
    (e as any).requestContext?.authorizer?.claims ??
    (e as any).requestContext?.authorizer?.jwt?.claims ??
    {}
  );
}

function parseJsonBody(e: AnyEvent): any {
  const raw = (e as any).body ?? "";
  if (!raw) return {};
  const txt =
    (e as any).isBase64Encoded && typeof raw === "string"
      ? Buffer.from(raw, "base64").toString()
      : raw;
  try {
    return typeof txt === "string" ? JSON.parse(txt) : txt;
  } catch {
    return {};
  }
}

/** Sanitize a user-provided key and enforce users/<sub>/ prefix */
function scopeUserKey(sub: string, raw: string): string {
  const safe = String(raw || "").replace(/\.\./g, "").replace(/^[/\\]+/, "");
  // If caller passed a fully scoped key, keep it; otherwise prefix it
  return safe.startsWith(`users/${sub}/`) ? safe : `users/${sub}/${safe}`;
}

/* ----------------------------- handler ----------------------------- */
export const handler = async (
  event: AnyEvent
): Promise<APIGatewayProxyResult> => {
  const method = getMethod(event);

  // CORS preflight
  if (method === "OPTIONS") {
    const origin = pickAllowedOrigin(event);
    if (!origin && (event.headers?.origin || event.headers?.Origin)) {
      return { statusCode: 403, headers: baseCorsHeaders(undefined), body: "" };
    }
    return noContent(event);
  }

  try {
    const claims = getClaims(event);
    const sub = claims?.sub as string | undefined;
    if (!sub) return bad(event, 401, "Not authorized");

    if (method === "POST") {
      // Create a presigned PUT URL for user-scoped key
      const body = parseJsonBody(event);
      const rawKey: string = String(body.key || "");
      const contentType: string = String(
        body.contentType || "application/octet-stream"
      );
      if (!rawKey) return bad(event, 400, "Missing 'key'");

      const key = scopeUserKey(sub, rawKey);

      const cmd = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3, cmd, { expiresIn: 900 }); // 15 min
      return ok(event, { key, url });
    }

    if (method === "DELETE") {
      // Delete a user-scoped object
      const rawKey =
        event?.queryStringParameters?.key ??
        (event as any).pathParameters?.key ??
        "";
      if (!rawKey) return bad(event, 400, "Missing 'key'");

      const key = scopeUserKey(sub, String(rawKey));

      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: key,
        })
      );

      // 204 is typical for delete, but 200 with JSON is easier to consume.
      return ok(event, { deleted: true, key });
    }

    return bad(event, 405, "Method Not Allowed");
  } catch (e: any) {
    console.error(e);
    return bad(event, 500, e?.message ?? String(e));
  }
};
