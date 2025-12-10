import { S3Event, S3Handler } from "aws-lambda";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fetch from "node-fetch"; // Ensure this is installed or use global fetch in Node 18+

const s3 = new S3Client({});

export const handler: S3Handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    if (!key.startsWith("admin-uploads/")) continue;

    try {
      const originalBuffer = await getObjectBuffer(bucket, key);
      const maskBuffer = await getClothingMaskFromApi(originalBuffer);
      const isolatedClothingBuffer = await applyMask(originalBuffer, maskBuffer);

      const outputKey = key
        .replace("admin-uploads/", "lala-closet/isolated/")
        .replace(/\.[^.]+$/, ".png");

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: outputKey,
          Body: isolatedClothingBuffer,
          ContentType: "image/png",
        })
      );

      console.log(`Saved cleaned image to ${outputKey}`);
    } catch (err) {
      console.error("Error processing image:", err);
    }
  }
};

async function getObjectBuffer(bucket: string, key: string): Promise<Buffer> {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks: Buffer[] = [];
  for await (const chunk of res.Body as any as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function getClothingMaskFromApi(imageBuffer: Buffer): Promise<Buffer> {
  const response = await fetch("https://your-rembg-clothing-api.example.com/run", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: imageBuffer,
  });

  if (!response.ok) {
    throw new Error(`Segmentation API failed: ${response.status} ${response.statusText}`);
  }

  const maskArrayBuffer = await response.arrayBuffer();
  return Buffer.from(maskArrayBuffer);
}

async function applyMask(original: Buffer, mask: Buffer): Promise<Buffer> {
  const base = sharp(original).ensureAlpha().png();
  const baseMeta = await base.metadata();

  const resizedMask = await sharp(mask)
    .resize(baseMeta.width, baseMeta.height, { fit: "fill" })
    .removeAlpha()
    .toColourspace("b-w")
    .png()
    .toBuffer();

  const result = await base
    .composite([{ input: resizedMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return result;
}