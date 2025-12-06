// lambda/presign/index.ts
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,             // ⬅️ NEW
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const BUCKET = process.env.BUCKET!;
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "https://stylingadventures.com";

// Comma-separated list of allowed origins, e.g.
// "https://d3fghr37bcpbig.cloudfront.net,http://localhost:5173"
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? WEB_ORIGIN)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const THUMBS_CDN = process.env.THUMBS_CDN;
const DISABLE_UPLOAD_AUTH =
  process.env.DISABLE_UPLOAD_AUTH === "true" ||
  process.env.DISABLE_UPLOAD_AUTH === "1";

const s3 = new S3Client({});

// ----- helpers -----

type AnyEvent = APIGatewayProxyEventV2 & { requestContext: any };

function resolveOrigin(event: AnyEvent): string {
  const hdrs = event.headers || {};
  const reqOrigin = (hdrs.origin || hdrs.Origin || "").trim();
  if (!reqOrigin) return WEB_ORIGIN;

  // 🔓 Dev convenience: always allow localhost / 127.0.0.1
  if (
    reqOrigin.startsWith("http://localhost") ||
    reqOrigin.startsWith("http://127.0.0.1")
  ) {
    return reqOrigin;
  }

  // Normal prod path: only if explicitly allowed
  if (ALLOWED_ORIGINS.includes(reqOrigin)) {
    return reqOrigin;
  }

  // Fallback to main web origin
  return WEB_ORIGIN;
}

function makeBaseHeaders(origin: string) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

function methodOf(event: AnyEvent): string {
  return (
    event.requestContext?.http?.method ||
    (event as any).httpMethod ||
    "GET"
  ).toUpperCase();
}

function pathOf(event: AnyEvent): string {
  return event.rawPath || (event as any).path || "/";
}

function claimsOf(event: AnyEvent): Record<string, any> {
  return (
    event.requestContext?.authorizer?.jwt?.claims ||
    event.requestContext?.authorizer?.claims ||
    {}
  );
}

function parseBody<T = any>(event: AnyEvent): T | undefined {
  if (!event.body) return;
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString()
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function ok(
  headers: Record<string, string>,
  body: any,
  extraHeaders: Record<string, string> = {},
): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers: { ...headers, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

function err(
  headers: Record<string, string>,
  statusCode: number,
  message: string,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers,
    body: JSON.stringify({ message }),
  };
}

// ----- handler -----

export const handler = async (
  event: AnyEvent,
): Promise<APIGatewayProxyResultV2> => {
  const origin = resolveOrigin(event);
  const headers = makeBaseHeaders(origin);
  const method = methodOf(event);
  const path = pathOf(event);
  const claims = claimsOf(event);
  const sub: string | undefined = claims.sub;

  // CORS preflight
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  try {
    // --- GET /presign?key=...&method=GET ---
    // Used by thumbs.js and any "view" presign callers
    if (method === "GET" && /\/presign$/.test(path)) {
      const qs = event.queryStringParameters || {};
      const rawKey = qs.key ? decodeURIComponent(qs.key) : "";
      const op = (qs.method || "GET").toString().toUpperCase();

      if (!rawKey) return err(headers, 400, 'Missing "key"');
      if (rawKey.includes("..")) return err(headers, 400, "Illegal key");

      const key = rawKey.replace(/^\/+/, "");

      // For GET we just return a read URL for the exact key
      const getCmd = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      });

      const url = await getSignedUrl(s3, getCmd, { expiresIn: 900 });

      return ok(headers, {
        url,
        key,
        method: op,
        thumbsCdn: THUMBS_CDN ?? undefined,
      });
    }

    // --- POST /presign --- (uploads; you already had this)
    if (method === "POST" && /\/presign$/.test(path)) {
      const body = parseBody<{
        key: string;
        contentType: string;
        kind?: string;
      }>(event);
      if (!body) return err(headers, 400, "Missing body");

      let { key, contentType, kind } = body;

      if (!key || typeof key !== "string") {
        return err(headers, 400, 'Invalid "key"');
      }
      if (!contentType || typeof contentType !== "string") {
        return err(headers, 400, 'Invalid "contentType"');
      }
      if (key.includes("..")) {
        return err(headers, 400, "Illegal key");
      }

      // Normalise leading slashes
      key = key.replace(/^\/+/, "");

      const isClosetUpload = kind === "closet";

      if (isClosetUpload) {
        // Force all closet uploads under closet/ so the S3 trigger fires.
        if (!key.startsWith("closet/")) {
          key = `closet/${key}`;
        }
      } else if (sub && !key.startsWith("users/")) {
        // Normal user-scoped uploads.
        key = `users/${sub}/${key}`;
      }

      const put = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3, put, { expiresIn: 900 });

      return ok(headers, { url, key, thumbsCdn: THUMBS_CDN ?? undefined });
    }

    // --- GET /list ---
    if (method === "GET" && /\/list$/.test(path)) {
      const listParams: any = { Bucket: BUCKET };

      // In normal mode: only list user's own objects.
      if (!DISABLE_UPLOAD_AUTH && sub) {
        listParams.Prefix = `users/${sub}/`;
      }

      const res = await s3.send(new ListObjectsV2Command(listParams));
      const items =
        res.Contents?.map((obj) => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified?.toISOString?.(),
        })) ?? [];

      return ok(headers, { items });
    }

    // --- DELETE /delete ---
    if (method === "DELETE" && /\/delete$/.test(path)) {
      const body = parseBody<{ key?: string }>(event);
      const qsKey = event.queryStringParameters?.key
        ? decodeURIComponent(event.queryStringParameters.key)
        : undefined;
      const key = body?.key ?? qsKey;

      if (!key || typeof key !== "string") {
        return err(headers, 400, 'Invalid "key"');
      }

      // In normal mode, enforce ownership; in DISABLE_UPLOAD_AUTH we skip this.
      if (!DISABLE_UPLOAD_AUTH && sub && !key.startsWith(`users/${sub}/`)) {
        return err(headers, 403, "Forbidden");
      }

      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: key,
        }),
      );

      return ok(headers, { deleted: key });
    }

    // Fallback
    return err(headers, 404, "Not Found");
  } catch (e: any) {
    console.error("presign handler error", e);
    return err(headers, 500, e?.message ?? "Server error");
  }
};
