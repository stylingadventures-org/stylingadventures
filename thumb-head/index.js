const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET = process.env.BUCKET;

const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function pickAllowedOrigin(event) {
  const o = event?.headers?.origin || event?.headers?.Origin || "";
  return ALLOWED_ORIGINS.includes(o) ? o : undefined;
}

function baseHeaders(origin) {
  const h = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers":
      "authorization,Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Cache-Control": "private, max-age=2",
    Vary: "Origin",
  };
  if (origin) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function toThumbKey(srcKey) {
  const decoded = decodeURIComponent(srcKey);
  if (decoded.startsWith("thumbs/")) return decoded;
  return `thumbs/${decoded.replace(/\.[^.]+$/, ".jpg")}`;
}

exports.handler = async (event) => {
  const origin = pickAllowedOrigin(event);
  const method = event?.httpMethod || event?.requestContext?.http?.method;

  if (method === "OPTIONS") {
    if ((event?.headers?.origin || event?.headers?.Origin) && !origin) {
      return { statusCode: 403, headers: baseHeaders(undefined), body: "" };
    }
    return { statusCode: 204, headers: baseHeaders(origin), body: "" };
  }

  try {
    if (!BUCKET) throw new Error("BUCKET env var is not set");

    const raw = event?.queryStringParameters?.key;
    if (!raw) {
      return {
        statusCode: 400,
        headers: baseHeaders(origin),
        body: JSON.stringify({ message: "Missing key" }),
      };
    }

    const thumbKey = toThumbKey(raw);
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: thumbKey }));

    if (method === "HEAD") {
      return { statusCode: 204, headers: baseHeaders(origin), body: "" };
    }
    return {
      statusCode: 200,
      headers: baseHeaders(origin),
      body: JSON.stringify({ ready: true }),
    };
  } catch {
    if (method === "HEAD") {
      return { statusCode: 404, headers: baseHeaders(origin), body: "" };
    }
    return {
      statusCode: 200,
      headers: baseHeaders(origin),
      body: JSON.stringify({ ready: false }),
    };
  }
};
