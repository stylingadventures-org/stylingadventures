import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

type APIGWEvent = {
  httpMethod?: string;
  path?: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
  queryStringParameters?: Record<string, string | undefined> | null;
  requestContext?: any; // authorizer claims
};

const s3 = new S3Client({});
const sqs = new SQSClient({});

// Required
const BUCKET = process.env.BUCKET || "";
// Optional: CloudFront domain for thumbs (e.g. https://dxxxx.cloudfront.net)
const THUMBS_CDN = process.env.THUMBS_CDN || "";
// Optional: enqueue thumbnail job manually via /thumb
const QUEUE_URL = process.env.THUMB_QUEUE_URL || "";
// Frontend origin to allow for CORS (in addition to localhost)
const WEB_ORIGIN = process.env.WEB_ORIGIN || "";

function pickOrigin(h: Record<string, string | undefined> | undefined) {
  if (!h) return undefined;
  // API Gateway may pass either casing
  const origin = h["origin"] || h["Origin"];
  if (!origin) return undefined;
  const allow = new Set([WEB_ORIGIN, "http://localhost:5173"]);
  return allow.has(origin) ? origin : undefined;
}

function corsHeaders(origin?: string) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token,X-Api-Key",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

const json = (x: unknown) => (typeof x === "string" ? x : JSON.stringify(x));
const ok = (data: unknown, statusCode = 200, origin?: string) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  body: json(data),
});
const txt = (text = "", statusCode = 200, origin?: string) => ({
  statusCode,
  headers: corsHeaders(origin),
  body: text,
});
const err = (message: string, statusCode = 500, origin?: string) =>
  ok({ message }, statusCode, origin);

export const handler = async (event: APIGWEvent) => {
  const origin = pickOrigin(event.headers);

  // Preflight
  if ((event.httpMethod || "").toUpperCase() === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(origin), body: "" };
  }

  try {
    if (!BUCKET) return err("Server misconfigured: missing BUCKET", 500, origin);

    const method = (event.httpMethod || "GET").toUpperCase();
    const path = (event.path || "").toLowerCase();

    // user id (verified by API GW authorizer)
    const sub: string | undefined =
      (event as any)?.requestContext?.authorizer?.claims?.sub;
    if (!sub) return err("Unauthorized", 401, origin);

    // === GET /list
    if (method === "GET" && path.endsWith("/list")) {
      const Prefix = `users/${sub}/`;
      const data = await s3.send(
        new ListObjectsV2Command({ Bucket: BUCKET, Prefix })
      );

      const items = await Promise.all(
        (data.Contents || [])
          .filter((o) => o.Key)
          .map(async (o) => {
            const key = o!.Key!;

            // Presigned GET for original
            const viewUrl = await getSignedUrl(
              s3,
              new GetObjectCommand({ Bucket: BUCKET, Key: key }),
              { expiresIn: 900 }
            );

            // Optional CDN thumb: thumbs/<sub>/<filename>.jpg
            let thumbUrl: string | undefined;
            if (THUMBS_CDN) {
              const baseName = key.replace(`users/${sub}/`, "");
              thumbUrl = `${THUMBS_CDN}/thumbs/${sub}/${baseName}`.replace(
                /\.(png|gif|webp|avif)$/i,
                ".jpg"
              );
            }

            return {
              key,
              size: o!.Size ?? 0,
              lastModified: o!.LastModified
                ? o!.LastModified.toISOString()
                : null,
              viewUrl,
              ...(thumbUrl ? { thumbUrl } : {}),
            };
          })
      );

      return ok({ prefix: Prefix, items }, 200, origin);
    }

    // === POST /presign  { key, contentType } -> { url, key, headers }
    if (method === "POST" && path.endsWith("/presign")) {
      const body = event.body ? JSON.parse(event.body) : {};
      const keyInput: string = String(body.key || "file.bin");
      const contentType: string = String(
        body.contentType || "application/octet-stream"
      );
      const Key = `users/${sub}/${keyInput.replace(/^\/*/, "")}`;

      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: BUCKET, Key, ContentType: contentType }),
        { expiresIn: 900 }
      );

      return ok({ url, key: Key, headers: { "Content-Type": contentType } }, 200, origin);
    }

    // === DELETE /delete?key=users/<sub>/...
    if (method === "DELETE" && path.endsWith("/delete")) {
      const key = String(event.queryStringParameters?.key || "");
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) return err("Forbidden key", 403, origin);

      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return txt("", 204, origin);
    }

    // === POST /thumb  { key } -> enqueue job (optional)
    if (method === "POST" && path.endsWith("/thumb")) {
      const body = event.body ? JSON.parse(event.body) : {};
      const key: string = String(body.key || "");
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) return err("Forbidden key", 403, origin);

      if (QUEUE_URL) {
        await sqs.send(
          new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({ key }),
          })
        );
      }
      return txt("", 202, origin);
    }

    return err("Not found", 404, origin);
  } catch (e: any) {
    console.error("UPLOADS ERROR", {
      path: event.path,
      method: event.httpMethod,
      headers: event.headers,
      message: e?.message,
      stack: e?.stack,
    });
    return err(e?.message || "Internal server error", 500, pickOrigin(event.headers));
  }
};
