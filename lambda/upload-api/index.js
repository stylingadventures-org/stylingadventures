// lambda/upload-api/index.js

// Use AWS SDK v3 (matches CDK's --external:@aws-sdk/* bundling)
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({});

// Bucket name is passed in from the CDK stack as an env var
const UPLOADS_BUCKET = process.env.UPLOADS_BUCKET_NAME;

if (!UPLOADS_BUCKET) {
  throw new Error("Missing env: UPLOADS_BUCKET_NAME");
}

exports.handler = async (event) => {
  console.log("[upload-api] event:", JSON.stringify(event));

  const { httpMethod, path } = event;

  // Normalize path (in case of stage prefixes, etc.)
  const fullPath = path || "";
  const isPresignRoute = fullPath.endsWith("/presign");
  const isGetRoute = fullPath.endsWith("/get");

  // ───────────────────────────────────────────────
  // POST /.../presign  → presigned PUT for uploads
  // body: { key, kind?, contentType? }
  // ───────────────────────────────────────────────
  if (httpMethod === "POST" && isPresignRoute) {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      console.error("[upload-api] invalid JSON body for /presign", e);
      return json(400, { error: "Invalid JSON body" });
    }

    const { key, kind, contentType } = body;

    if (!key) {
      return json(400, { error: "Missing key" });
    }

    // If kind === "closet", store under "closet/" prefix. Otherwise keep as-is.
    const prefix = kind === "closet" ? "closet/" : "";
    const fullKey = `${prefix}${String(key).replace(/^\/+/, "")}`;

    const putCommand = new PutObjectCommand({
      Bucket: UPLOADS_BUCKET,
      Key: fullKey,
      ContentType: contentType || "application/octet-stream",
      ACL: "private",
    });

    // Signed PUT URL (5 minutes)
    const url = await getSignedUrl(s3, putCommand, { expiresIn: 60 * 5 });

    console.log("[upload-api] presign ->", { fullKey });

    return json(200, { url, key: fullKey });
  }

  // ───────────────────────────────────────────────
  // POST /.../get  → presigned GET for viewing
  // body: { key }
  // (You may not actually be using this anymore, but it’s safe to keep.)
  // ───────────────────────────────────────────────
  if (httpMethod === "POST" && isGetRoute) {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      console.error("[upload-api] invalid JSON body for /get", e);
      return json(400, { error: "Invalid JSON body" });
    }

    const { key } = body;

    if (!key) {
      return json(400, { error: "Missing key" });
    }

    const cleanKey = String(key).replace(/^\/+/, "");

    const getCommand = new GetObjectCommand({
      Bucket: UPLOADS_BUCKET,
      Key: cleanKey,
    });

    // Signed GET URL (10 minutes)
    const url = await getSignedUrl(s3, getCommand, { expiresIn: 60 * 10 });

    console.log("[upload-api] getSignedGetUrl ->", { cleanKey });

    return json(200, { url });
  }

  // Fallback 404
  return json(404, { error: "Not found" });
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
    body: JSON.stringify(body),
  };
}
