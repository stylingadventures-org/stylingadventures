// list.js — S3 list using AWS SDK v3 (works on Node 18/20 runtimes)

const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3 = new S3Client({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION });

const ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const BUCKET = process.env.BUCKET;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

function sanitizePrefix(raw) {
  let s = (raw || "").trim();
  if (s.includes("..")) s = "";
  s = s.replace(/^\/*/, "").replace(/[^A-Za-z0-9_\-\/.]/g, "");
  return s;
}

exports.handler = async (event) => {
  try {
    if (!BUCKET) throw new Error("Missing BUCKET env var");

    const qs = event.queryStringParameters || {};
    const prefix = sanitizePrefix(qs.prefix || "");
    const token = qs.token;

    const cmd = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix || undefined,
      ContinuationToken: token || undefined,
      MaxKeys: 1000,
    });

    const res = await s3.send(cmd);

    const items = (res.Contents || []).map((o) => ({
      key: o.Key,
      size: o.Size,
      lastModified: o.LastModified ? new Date(o.LastModified).toISOString() : null,
    }));

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        items,
        isTruncated: !!res.IsTruncated,
        nextToken: res.IsTruncated ? res.NextContinuationToken : null,
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: String(err.message || err) }),
    };
  }
};

