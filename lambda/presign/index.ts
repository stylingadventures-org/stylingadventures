import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/* Use path-style to avoid some blockers on virtual-hosted S3 */
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  forcePathStyle: true,
});

const BUCKET = process.env.BUCKET!;

/* ---------------- CORS helpers ---------------- */
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const FALLBACK_ORIGIN = (process.env.WEB_ORIGIN || "").replace(/\/+$/, "");
const ALLOW_HEADERS = [
  "authorization",
  "Authorization",
  "Content-Type",
  "X-Amz-Date",
  "X-Api-Key",
  "X-Amz-Security-Token",
].join(",");

function reqOrigin(event: any): string {
  return String(event?.headers?.origin || event?.headers?.Origin || "").replace(
    /\/+$/,
    ""
  );
}

function pickAllowedOrigin(event: any): string | undefined {
  const o = reqOrigin(event);
  if (ALLOWED_ORIGINS.length > 0) {
    return o && ALLOWED_ORIGINS.includes(o) ? o : undefined;
  }
  return FALLBACK_ORIGIN || undefined;
}

function baseCorsHeaders(origin?: string) {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Expose-Headers":
      "ETag,Content-Type,Content-Length,Last-Modified,Accept-Ranges",
    Vary:
      "Origin, Access-Control-Request-Headers, Access-Control-Request-Method",
  };
  if (origin) h["Access-Control-Allow-Origin"] = origin;
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
    headers: {
      ...baseCorsHeaders(origin),
      "Cache-Control": "no-store",
      ...extra,
    },
    body: JSON.stringify(body),
  };
}

function noContent(event: any): APIGatewayProxyResult {
  const origin = pickAllowedOrigin(event);
  return { statusCode: 204, headers: baseCorsHeaders(origin), body: "" };
}

function bad(event: any, status: number, msg: string): APIGatewayProxyResult {
  const origin = pickAllowedOrigin(event);
  const hadReqOrigin = !!reqOrigin(event);
  if (hadReqOrigin && !origin) {
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
/* ------------------------------------------------ */

type AnyEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2 | any;
const methodOf = (e: AnyEvent) =>
  (e as any).httpMethod ?? e.requestContext?.http?.method ?? "GET";
const claimsOf = (e: AnyEvent) =>
  (e as any).requestContext?.authorizer?.claims ??
  (e as any).requestContext?.authorizer?.jwt?.claims ??
  {};
const parseJson = (e: AnyEvent) => {
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
};
/** sanitize + enforce users/<sub>/ prefix */
function scopeUserKey(sub: string, raw: string): string {
  const safe = String(raw || "").replace(/\.\./g, "").replace(/^[/\\]+/, "");
  const alreadyScoped = safe.startsWith(`users/${sub}/`);
  const foreignUser = /^users\/[^/]+\//.test(safe) && !alreadyScoped;
  return alreadyScoped
    ? safe
    : `users/${sub}/${foreignUser ? safe.replace(/^users\/[^/]+\//, "") : safe}`;
}

function readGroups(claims: any): string[] {
  const g = claims?.["cognito:groups"];
  if (Array.isArray(g)) return g;
  if (typeof g === "string") return g.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

export const handler = async (
  event: AnyEvent
): Promise<APIGatewayProxyResult> => {
  const method = methodOf(event);

  // CORS preflight
  if (method === "OPTIONS") {
    const origin = pickAllowedOrigin(event);
    if (!origin && reqOrigin(event)) {
      return { statusCode: 403, headers: baseCorsHeaders(undefined), body: "" };
    }
    return noContent(event);
  }

  try {
    const claims = claimsOf(event);
    const sub = (claims?.sub as string) || "";
    if (!sub) return bad(event, 401, "Not authorized");

    // ---- tiered upload limits (in MB) ----
    const groups = readGroups(claims);
    const baseMb = Number(process.env.BASE_UPLOAD_LIMIT_MB || "50");
    const bestieMb = Number(process.env.BESTIE_UPLOAD_LIMIT_MB || "200");
    const maxMb = groups.includes("BESTIE") ? bestieMb : baseMb;

    if (method === "POST") {
      // Create PUT + GET presigns for a new upload
      const body: any = parseJson(event);
      const rawKey: string = String(body.key || "");
      const contentType: string = String(
        body.contentType || "application/octet-stream"
      );
      if (!rawKey) return bad(event, 400, "Missing 'key'");

      // If client sent size, enforce quota now
      const contentLength = Number(body.contentLength || 0);
      if (contentLength > 0 && contentLength > maxMb * 1024 * 1024) {
        return bad(event, 413, `Max upload ${maxMb} MB for your tier`);
      }

      const key = scopeUserKey(sub, rawKey);
      const putCmd = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
      });
      const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });

      const putUrl = await getSignedUrl(s3, putCmd, { expiresIn: 900 }); // 15m
      const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 300 }); // 5m

      // IMPORTANT: include 'url' and 'headers' for clients that expect them
      return ok(event, {
        bucket: BUCKET,
        key,
        method: "PUT",
        url: putUrl,
        headers: { "Content-Type": contentType },
        putUrl,
        getUrl,
        maxBytesAllowed: maxMb * 1024 * 1024,
      });
    }

    if (method === "GET") {
      // Mint a fresh GET presign for an existing key (for previews after refresh)
      const rawKey = String(
        event?.queryStringParameters?.key ??
          (event as any).pathParameters?.key ??
          ""
      );
      if (!rawKey) return bad(event, 400, "Missing 'key'");
      const key = scopeUserKey(sub, rawKey);

      const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
      const getUrl = await getSignedUrl(s3, getCmd, { expiresIn: 300 }); // 5m

      // Mirror the field names the UI may look for
      return ok(event, {
        bucket: BUCKET,
        key,
        getUrl,
        url: getUrl,
        publicUrl: getUrl,
      });
    }

    if (method === "DELETE") {
      // Delete a user-scoped object
      const rawKey = String(
        event?.queryStringParameters?.key ??
          (event as any).pathParameters?.key ??
          ""
      );
      if (!rawKey) return bad(event, 400, "Missing 'key'");
      const key = scopeUserKey(sub, rawKey);

      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return ok(event, { deleted: true, key });
    }

    return bad(event, 405, "Method Not Allowed");
  } catch (e: any) {
    console.error(e);
    return bad(event, 500, e?.message ?? String(e));
  }
};
