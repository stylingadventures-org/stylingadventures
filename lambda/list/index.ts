// lambda/list/index.ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

/** S3 client (region from env; default us-east-1). */
const s3 = new S3Client({
  region:
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
});

const BUCKET = process.env.BUCKET as string | undefined;

/** Comma-separated allow-list, e.g.
 *  "https://d1682i07dc1r3k.cloudfront.net,https://stylingadventures.com"
 */
const ALLOWED_ORIGINS: string[] = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/* ----------------------- helpers ----------------------- */
function getMethod(e: APIGatewayProxyEventV2): string {
  // Works for REST v1 + HTTP API v2
  return e.requestContext?.http?.method || (e as any).httpMethod || "GET";
}

function pickAllowedOrigin(event: APIGatewayProxyEventV2): string | undefined {
  const o =
    (event.headers?.origin as string | undefined) ||
    (event.headers?.Origin as string | undefined) ||
    "";
  return ALLOWED_ORIGINS.includes(o || "") ? o : undefined;
}

function baseCorsHeaders(origin?: string): Record<string, string> {
  const h: Record<string, string> = {
    // include lowercase 'authorization' because some browsers preflight with it
    "Access-Control-Allow-Headers":
      "authorization,Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
  if (origin) h["Access-Control-Allow-Origin"] = origin; // bracket syntax for hyphenated key
  return h;
}

function sanitizePrefix(raw: string | undefined): string {
  let s = String(raw || "").trim();
  if (s.includes("..")) s = "";
  s = s.replace(/^\/+/, "").replace(/[^A-Za-z0-9_\-\/.]/g, "");
  return s;
}

/* ----------------------- handler ----------------------- */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const origin = pickAllowedOrigin(event);

  // CORS preflight
  if (getMethod(event) === "OPTIONS") {
    if ((event.headers?.origin || event.headers?.Origin) && !origin) {
      return { statusCode: 403, headers: baseCorsHeaders(undefined), body: "" };
    }
    return { statusCode: 204, headers: baseCorsHeaders(origin), body: "" };
  }

  try {
    if (!BUCKET) throw new Error("Missing BUCKET env var");

    const qs = event.queryStringParameters ?? {};
    const prefix = sanitizePrefix(qs.prefix);
    const token =
      qs.token || qs.continuationToken || qs.nextToken || undefined;

    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix || undefined,
        ContinuationToken: token || undefined,
        MaxKeys: 1000,
      })
    );

    const items =
      (res.Contents || []).map((o) => ({
        key: o.Key ?? "",
        size: o.Size ?? 0,
        lastModified: o.LastModified
          ? new Date(o.LastModified as unknown as string).toISOString()
          : null,
      })) ?? [];

    return {
      statusCode: 200,
      headers: baseCorsHeaders(origin),
      body: JSON.stringify({
        prefix,
        items,
        isTruncated: !!res.IsTruncated,
        nextToken: res.IsTruncated ? res.NextContinuationToken ?? null : null,
      }),
    };
  } catch (err: unknown) {
    const message =
      (err as { message?: string })?.message ?? String(err ?? "Error");
    console.error(err);
    return {
      statusCode: 500,
      headers: baseCorsHeaders(origin),
      body: JSON.stringify({ error: message }),
    };
  }
};



