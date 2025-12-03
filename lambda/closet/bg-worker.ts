// lambda/closet/bg-worker.ts

import { S3Event, S3Handler } from "aws-lambda";
import {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import fetch from "node-fetch";

const ddb = new DynamoDBClient({});
const s3 = new S3Client({});

const {
  TABLE_NAME = "",
  RAW_MEDIA_GSI_NAME = "rawMediaKeyIndex",
  REMOVE_BG_API_KEY,
  OUTPUT_BUCKET = "",
} = process.env;

if (!TABLE_NAME) throw new Error("Missing env: TABLE_NAME");
if (!RAW_MEDIA_GSI_NAME) throw new Error("Missing env: RAW_MEDIA_GSI_NAME");

const REMOVE_BG_URL = "https://api.remove.bg/v1.0/removebg";

const S = (v: string) => ({ S: v });

function nowIso() {
  return new Date().toISOString();
}

/**
 * Read an S3 object body into a Buffer.
 */
async function bufferFromS3(
  bucket: string,
  key: string
): Promise<{ buf: Buffer; contentType?: string }> {
  console.log("[bg-worker] Fetching from S3", { bucket, key });
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const body = res.Body;
  if (!body) throw new Error("Empty S3 body");

  const chunks: Uint8Array[] = [];
  for await (const chunk of body as any) {
    chunks.push(
      typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Uint8Array)
    );
  }

  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return { buf, contentType: res.ContentType };
}

/**
 * Call remove.bg with the image as base64 and return the cutout buffer.
 * If no API key is configured, just return the original buffer.
 */
async function callRemoveBgOrStub(imageB64: string): Promise<{
  buf: Buffer;
  status: string;
  contentType: string;
}> {
  if (!REMOVE_BG_API_KEY) {
    console.warn(
      "[bg-worker] REMOVE_BG_API_KEY not set – using original image as cutout"
    );
    return {
      buf: Buffer.from(imageB64, "base64"),
      status: "SKIPPED",
      contentType: "image/png",
    };
  }

  console.log("[bg-worker] Calling remove.bg");

  const params = new URLSearchParams();
  params.set("image_file_b64", imageB64);
  params.set("size", "auto");
  params.set("format", "png"); // always PNG with alpha

  const res = await fetch(REMOVE_BG_URL, {
    method: "POST",
    headers: {
      "X-Api-Key": REMOVE_BG_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      "[bg-worker] remove.bg failed",
      res.status,
      res.statusText,
      text
    );
    throw new Error(
      `remove.bg failed (${res.status} ${res.statusText}): ${text}`
    );
  }

  const arrayBuf = await res.arrayBuffer();
  return {
    buf: Buffer.from(arrayBuf),
    status: "DONE",
    contentType: "image/png",
  };
}

/**
 * Try to find a closet item by rawMediaKey, being tolerant of small key differences.
 */
async function findClosetItemByRawKey(rawKey: string) {
  // Try several common variants:
  const candidates = Array.from(
    new Set([
      rawKey,
      // add a leading slash
      "/" + rawKey.replace(/^\/+/, ""),
      // strip leading slash
      rawKey.replace(/^\/+/, ""),
      // strip "public/" prefix
      rawKey.replace(/^public\//, ""),
      // strip leading slash + "public/"
      rawKey.replace(/^\/?public\//, ""),
    ])
  );

  console.log("[bg-worker] Looking up closet item by rawMediaKey", {
    rawKey,
    candidates,
  });

  for (const candidate of candidates) {
    const q = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: RAW_MEDIA_GSI_NAME,
        KeyConditionExpression: "rawMediaKey = :k",
        ExpressionAttributeValues: { ":k": S(candidate) },
        Limit: 1,
      })
    );

    const item = q.Items?.[0];
    if (item) {
      console.log("[bg-worker] Found closet item for candidate key", {
        candidate,
        pk: item.pk?.S,
        sk: item.sk?.S,
        id: item.id?.S,
      });
      return item;
    }
  }

  console.warn(
    "[bg-worker] No closet item found for any rawMediaKey candidate",
    candidates
  );
  return null;
}

/**
 * Process one S3 object: find the closet item, remove background (or stub),
 * update Dynamo.
 */
async function processRecord(bucket: string, key: string): Promise<void> {
  console.log("[bg-worker] Processing record", { bucket, key });

  const item = await findClosetItemByRawKey(key);
  if (!item) {
    // Nothing to do; we already logged.
    return;
  }

  const pk = item.pk?.S;
  const sk = item.sk?.S || "META";
  const id = item.id?.S || pk?.replace(/^ITEM#/, "");

  if (!pk) {
    console.warn("[bg-worker] Item missing pk; skipping", { item });
    return;
  }

  console.log("[bg-worker] Using closet item", { id, pk, sk });

  // Download original
  const { buf, contentType } = await bufferFromS3(bucket, key);
  const imgB64 = buf.toString("base64");

  // Try to remove bg; fall back to original on error.
  let cutoutBuf: Buffer;
  let bgStatus = "DONE";
  let outContentType = "image/png";

  try {
    const res = await callRemoveBgOrStub(imgB64);
    cutoutBuf = res.buf;
    bgStatus = res.status;
    outContentType = res.contentType || contentType || "image/png";
  } catch (err) {
    console.error(
      "[bg-worker] Background removal failed, falling back to original image",
      err
    );
    cutoutBuf = buf;
    bgStatus = "FAILED_FALLBACK_ORIGINAL";
    outContentType = contentType || "image/png";
  }

  // Decide where to store the cutout
  const outBucket = OUTPUT_BUCKET || bucket;
  const destPrefix = `uploads/closet/${id}`;
  const cutoutKey = `${destPrefix.replace(/\/+$/, "")}/removed-bg.png`;

  console.log("[bg-worker] Writing cutout to S3", {
    outBucket,
    cutoutKey,
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: outBucket,
      Key: cutoutKey,
      Body: cutoutBuf,
      ContentType: outContentType,
      ACL: "private",
    })
  );

  // Update Dynamo row with mediaKey + backgroundStatus
  const updatedAt = nowIso();
  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(pk), sk: S(sk) },
      UpdateExpression:
        "SET mediaKey = :m, updatedAt = :u, backgroundStatus = :s",
      ExpressionAttributeValues: {
        ":m": S(cutoutKey),
        ":u": S(updatedAt),
        ":s": S(bgStatus),
      },
    })
  );

  console.log("[bg-worker] Updated item with mediaKey", {
    id,
    mediaKey: cutoutKey,
    backgroundStatus: bgStatus,
  });
}

/**
 * Lambda entry point.
 */
export const handler: S3Handler = async (event: S3Event) => {
  console.log(
    "[bg-worker] Received S3 event",
    JSON.stringify(
      event.Records.map((r) => ({
        bucket: r.s3.bucket.name,
        key: decodeURIComponent(r.s3.object.key.replace(/\+/g, " ")),
      })),
      null,
      2
    )
  );

  for (const record of event.Records || []) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(
      record.s3.object.key.replace(/\+/g, " ")
    );

    try {
      await processRecord(bucket, key);
    } catch (err) {
      console.error("[bg-worker] Error processing object", {
        bucket,
        key,
        error: (err as Error).message,
      });
    }
  }
};
