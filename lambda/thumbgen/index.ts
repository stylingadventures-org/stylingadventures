// lambda/thumbgen/index.ts
import type { S3Event, S3Handler } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

/**
 * Environment
 *  - UPLOADS_BUCKET : required (source/originals)
 *  - DEST_BUCKET    : required (where thumbnails are stored)
 *  - DEST_PREFIX    : optional; default "thumbs/"
 *  - THUMBS_PREFIX  : optional alias of DEST_PREFIX for compatibility
 *  - MAX_WIDTH      : optional; default "360"
 *  - JPEG_QUALITY   : optional; default "80"
 */

const UPLOADS_BUCKET = process.env.UPLOADS_BUCKET || process.env.BUCKET;
const DEST_BUCKET = process.env.DEST_BUCKET;
if (!UPLOADS_BUCKET) throw new Error("Missing env UPLOADS_BUCKET (or BUCKET)");
if (!DEST_BUCKET) throw new Error("Missing env DEST_BUCKET");

// prefer DEST_PREFIX; fall back to THUMBS_PREFIX; default to "thumbs/"
const RAW_PREFIX =
  process.env.DEST_PREFIX ??
  process.env.THUMBS_PREFIX ??
  "thumbs/";
const DEST_PREFIX =
  String(RAW_PREFIX).replace(/^\/+|\/+$/g, "") + "/";

const MAX_WIDTH = Math.max(
  1,
  parseInt(String(process.env.MAX_WIDTH ?? "360"), 10)
);
const JPEG_QUALITY = Math.min(
  100,
  Math.max(1, parseInt(String(process.env.JPEG_QUALITY ?? "80"), 10))
);

const s3 = new S3Client({});

/** True if key has a supported image extension */
function isSupportedImage(key: string): boolean {
  return /\.(png|jpe?g|webp|gif|tiff|avif)$/i.test(key);
}

/** Normalize S3 key */
function cleanKey(raw: string): string {
  return decodeURIComponent(raw.replace(/\+/g, " ")).replace(/^\/*/, "");
}

/** users/a/b/file.ext  ->  DEST_PREFIX + users/a/b/file.jpg */
function toThumbKey(srcKey: string): string {
  const cleaned = cleanKey(srcKey);
  return (DEST_PREFIX + cleaned).replace(/\.[^.]+$/, ".jpg");
}

/** Only create thumbs for objects under users/, never for items already under DEST_PREFIX */
function shouldProcess(srcKey: string, sourceBucket: string): boolean {
  const k = cleanKey(srcKey);
  if (!/^users\//i.test(k)) return false;
  // If source and destination buckets are the same, avoid processing anything already under DEST_PREFIX
  if (sourceBucket === DEST_BUCKET) {
    const destPrefixEsc = DEST_PREFIX.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    if (new RegExp(`^${destPrefixEsc}`, "i").test(k)) return false;
  }
  return isSupportedImage(k);
}

export const handler: S3Handler = async (event: S3Event) => {
  for (const rec of event.Records ?? []) {
    const srcBucket = rec.s3?.bucket?.name;
    const rawKey = rec.s3?.object?.key;

    if (!srcBucket || !rawKey) continue;
    // Only react to events from the configured uploads bucket
    if (srcBucket !== UPLOADS_BUCKET) {
      console.log(`⏭️  Ignoring event from bucket ${srcBucket}`);
      continue;
    }

    const srcKey = cleanKey(rawKey);
    if (!shouldProcess(srcKey, srcBucket)) {
      console.log(`⏭️  Skipping ${srcKey}`);
      continue;
    }

    const destKey = toThumbKey(srcKey);

    try {
      // Fast path: if dest already exists, skip
      try {
        await s3.send(
          new HeadObjectCommand({ Bucket: DEST_BUCKET, Key: destKey })
        );
        console.log(`✔️  Thumb exists, skip: s3://${DEST_BUCKET}/${destKey}`);
        continue;
      } catch {
        // not found — proceed
      }

      // Fetch original
      const obj = await s3.send(
        new GetObjectCommand({ Bucket: srcBucket, Key: srcKey })
      );
      const input = await obj.Body!.transformToByteArray();

      // Generate JPEG thumb
      const output = await sharp(input)
        .rotate() // auto-orient via EXIF
        .resize({
          width: MAX_WIDTH,
          height: MAX_WIDTH,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();

      // Store thumbnail (long-cache; immutable)
      await s3.send(
        new PutObjectCommand({
          Bucket: DEST_BUCKET,
          Key: destKey,
          Body: output,
          ContentType: "image/jpeg",
          CacheControl: "public, max-age=31536000, immutable",
          Metadata: { source: `${srcBucket}/${srcKey}` },
        })
      );

      console.log(`✅ Generated: s3://${DEST_BUCKET}/${destKey}`);
    } catch (err) {
      console.error(`❌ Failed for ${srcBucket}/${srcKey} -> ${DEST_BUCKET}/${destKey}:`, err);
      // continue with remaining records
    }
  }
};

