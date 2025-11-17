// lambda/closet/bg-worker.ts
import type { S3Event } from "aws-lambda";
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

const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg";

const ddb = new DynamoDBClient({});
const s3 = new S3Client({});

// ---- env vars (set in CDK / CloudFormation, NOT in code) ----
const TABLE_NAME = process.env.TABLE_NAME!;
const RAW_INDEX = process.env.RAW_MEDIA_GSI_NAME || "rawMediaKeyIndex";
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY!;
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET || ""; // optional override

if (!TABLE_NAME) throw new Error("Missing env: TABLE_NAME");
if (!REMOVE_BG_API_KEY) throw new Error("Missing env: REMOVE_BG_API_KEY");

type RemoveBgOpts = {
  bucket: string;
  key: string;
  destKeyPrefix: string;
};

/** Convert S3 stream to Buffer */
async function streamToBuffer(stream: any): Promise<Buffer> {
  if (!stream) return Buffer.alloc(0);
  if (Buffer.isBuffer(stream)) return stream;

  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Download original from S3, send to remove.bg, upload cleaned PNG to S3.
 * Returns the final S3 key for the cleaned image.
 */
async function removeBackgroundForS3Object(
  opts: RemoveBgOpts,
): Promise<string> {
  const { bucket, key, destKeyPrefix } = opts;

  // 1) Download original from S3
  const getRes = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
  const originalBuf = await streamToBuffer(getRes.Body as any);

  // 2) Build multipart/form-data request to remove.bg
  const form = new FormData();
  form.set("size", "auto");
  form.set("format", "png");
  form.set("image_file", new Blob([originalBuf]), "original.png");

  const resp = await fetch(REMOVE_BG_ENDPOINT, {
    method: "POST",
    headers: {
      "X-Api-Key": REMOVE_BG_API_KEY,
    },
    body: form as any,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error("remove.bg failed:", resp.status, text);
    throw new Error(`remove.bg failed (${resp.status})`);
  }

  const cleanedArrayBuf = await resp.arrayBuffer();
  const cleanedBuf = Buffer.from(cleanedArrayBuf);

  // 3) Upload cleaned PNG back to S3
  const outBucket = OUTPUT_BUCKET || bucket;
  const finalKey = `${destKeyPrefix.replace(/\/+$/, "")}/removed-bg.png`;

  await s3.send(
    new PutObjectCommand({
      Bucket: outBucket,
      Key: finalKey,
      Body: cleanedBuf,
      ContentType: "image/png",
    }),
  );

  return finalKey;
}

export const handler = async (event: S3Event) => {
  for (const record of event.Records ?? []) {
    try {
      const key = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, " "),
      );
      const bucket = record.s3.bucket.name;

      // 1) Find closet item by rawMediaKey
      const q = await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: RAW_INDEX,
          KeyConditionExpression: "rawMediaKey = :rk",
          ExpressionAttributeValues: { ":rk": { S: key } },
          Limit: 1,
        }),
      );

      const item = q.Items?.[0];
      if (!item) {
        console.log("[bg-worker] no closet item found for rawMediaKey", key);
        continue;
      }

      const pk = item.pk?.S || "";
      const sk = item.sk?.S || "META";
      const id = item.id?.S || pk.replace(/^ITEM#/, "");

      if (!pk) {
        console.warn("[bg-worker] item missing pk; skipping", JSON.stringify(item));
        continue;
      }

      console.log(
        "[bg-worker] processing closet item",
        id,
        "rawMediaKey=",
        key,
      );

      // 2) Call remove.bg
      const finalKey = await removeBackgroundForS3Object({
        bucket,
        key,
        destKeyPrefix: `uploads/closet/${id}`,
      });

      // 3) Update DynamoDB item with final mediaKey
      await ddb.send(
        new UpdateItemCommand({
          TableName: TABLE_NAME,
          Key: { pk: { S: pk }, sk: { S: sk } },
          UpdateExpression: "SET mediaKey = :mk, updatedAt = :u",
          ExpressionAttributeValues: {
            ":mk": { S: finalKey },
            ":u": { S: new Date().toISOString() },
          },
        }),
      );

      console.log(
        "[bg-worker] updated item",
        id,
        "with mediaKey",
        finalKey,
      );
    } catch (e: any) {
      console.error(
        "[bg-worker] error processing record",
        e?.message || e,
      );
      // move on to next record
    }
  }
};
