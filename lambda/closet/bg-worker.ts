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
  REMOVE_BG_API_KEY = "",
  OUTPUT_BUCKET = "",
} = process.env;

if (!TABLE_NAME) throw new Error("Missing env: TABLE_NAME");
if (!RAW_MEDIA_GSI_NAME) throw new Error("Missing env: RAW_MEDIA_GSI_NAME");
if (!REMOVE_BG_API_KEY) throw new Error("Missing env: REMOVE_BG_API_KEY");

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
 */
async function callRemoveBg(imageB64: string): Promise<Buffer> {
  console.log("[bg-worker] Calling remove.bg");

  const params = new URLSearchParams();
  params.set("image_file_b64", imageB64);
  params.set("size", "auto");
  params.set("format", "png"); // always get PNG with alpha

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
  return Buffer.from(arrayBuf);
}

/**
 * Process one S3 object: find the closet item, remove background, update Dynamo.
 */
async function processRecord(bucket: string, key: string): Promise<void> {
  console.log("[bg-worker] Processing record", { bucket, key });

  // Look up closet item by rawMediaKey
  const q = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: RAW_MEDIA_GSI_NAME,
      KeyConditionExpression: "rawMediaKey = :k",
      ExpressionAttributeValues: { ":k": S(key) },
      Limit: 1,
    })
  );

  const item = q.Items?.[0];
  if (!item) {
    console.warn(
      "[bg-worker] No closet item found for rawMediaKey",
      key
    );
    return;
  }

  const pk = item.pk?.S;
  const sk = item.sk?.S || "META";
  const id = item.id?.S || pk?.replace(/^ITEM#/, "");

  if (!pk) {
    console.warn("[bg-worker] Item missing pk; skipping", { item });
    return;
  }

  console.log("[bg-worker] Found closet item", { id, pk, sk });

  // Download original
  const { buf } = await bufferFromS3(bucket, key);
  const imgB64 = buf.toString("base64");

  // Call remove.bg
  const cutoutBuf = await callRemoveBg(imgB64);

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
      ContentType: "image/png",
      ACL: "private",
    })
  );

  // Update Dynamo row with mediaKey
  const updatedAt = nowIso();
  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(pk), sk: S(sk) },
      UpdateExpression: "SET mediaKey = :m, updatedAt = :u",
      ExpressionAttributeValues: {
        ":m": S(cutoutKey),
        ":u": S(updatedAt),
      },
    })
  );

  console.log("[bg-worker] Updated item with mediaKey", {
    id,
    mediaKey: cutoutKey,
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
