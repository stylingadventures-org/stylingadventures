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
 * Env
 *  - BUCKET:        required (the uploads bucket name)
 *  - THUMBS_PREFIX: optional, default "thumbs/"
 *  - MAX_WIDTH:     optional, default "360"
 *  - JPEG_QUALITY:  optional, default "80"
 */
const BUCKET = process.env.BUCKET!;
if (!BUCKET) throw new Error("Missing env BUCKET");

const THUMBS_PREFIX = String(process.env.THUMBS_PREFIX || "thumbs/").replace(/^\/+|\/+$/g, "") + "/";
const MAX_WIDTH = Math.max(1, parseInt(String(process.env.MAX_WIDTH || "360"), 10));
const JPEG_QUALITY = Math.min(100, Math.max(1, parseInt(String(process.env.JPEG_QUALITY || "80"), 10)));

const s3 = new S3Client({});

/** Return true if the S3 key looks like an image we support */
function isSupportedImage(key: string): boolean {
  return /\.(png|jpe?g|webp|gif|tiff|avif)$/i.test(key);
}

/** Map source "users/<sub>/path/file.ext" -> "thumbs/users/<sub>/path/file.jpg" */
function toThumbKey(srcKey: string): string {
  const clean = decodeURIComponent(srcKey).replace(/^\/*/, "");
  // Keep full path under users/, but rewrite extension to .jpg and prefix with THUMBS_PREFIX
  return (THUMBS_PREFIX + clean).replace(/\.[^.]+$/, ".jpg");
}

/** Guard: only create thumbs for objects under users/ and never for any object already under thumbs/ */
function shouldProcess(key: string): boolean {
  const k = decodeURIComponent(key);
  if (!/^users\//i.test(k)) return false;
  if (new RegExp(`^${THUMBS_PREFIX.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`, "i").test(k)) return false;
  return isSupportedImage(k);
}

export const handler: S3Handler = (async (event: S3Event) => {
  for (const rec of event.Records ?? []) {
    const rawKey = rec.s3?.object?.key;
    if (!rawKey) continue;

    const key = decodeURIComponent(rawKey.replace(/\+/g, " "));

    if (!shouldProcess(key)) {
      console.log(`⏭️  Skipping ${key}`);
      continue;
    }

    const thumbKey = toThumbKey(key);

    try {
      // Skip if thumbnail already exists (fast path)
      try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: thumbKey }));
        console.log(`✔️  Thumb exists, skip: ${thumbKey}`);
        continue;
      } catch {
        /* not found -> proceed */
      }

      // Fetch original
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      const buf = await obj.Body!.transformToByteArray();

      // Process with sharp
      const out = await sharp(buf)
        .rotate() // auto-orient using EXIF, if present
        .resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();

      // Store thumbnail
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: thumbKey,
          Body: out,
          ContentType: "image/jpeg",
          CacheControl: "public, max-age=31536000, immutable",
          Metadata: { source: key },
        })
      );

      console.log(`✅ Generated: ${thumbKey}`);
    } catch (err) {
      console.error(`❌ Failed for ${key} -> ${thumbKey}:`, err);
      // keep processing other records
    }
  }
}) as S3Handler;
