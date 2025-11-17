// lambda/closet/removeBg.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fetch from "node-fetch";

const s3 = new S3Client({});
const REMOVE_BG_API = "https://api.remove.bg/v1.0/removebg";

type RemoveBgParams = {
  bucket: string;
  key: string;
  destKeyPrefix: string;
};

/**
 * Download the original S3 object, send it to remove.bg, and write
 * the cutout image back to S3. Returns the final S3 key to store as mediaKey.
 */
export async function removeBackgroundForS3Object({
  bucket,
  key,
  destKeyPrefix,
}: RemoveBgParams): Promise<string> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    throw new Error("Missing REMOVE_BG_API_KEY env var");
  }

  // 1) Get the original image from S3
  const orig = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  // Read the body as a Buffer
  const body = await streamToBuffer(orig.Body as any);

  // 2) Call remove.bg
  const form = new FormData();
  form.append("image_file", new Blob([body]), "source.png");
  form.append("size", "auto"); // or "medium", etc.

  const resp = await fetch(REMOVE_BG_API, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
    },
    body: form as any,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`remove.bg failed (${resp.status}): ${txt}`);
  }

  const cutout = Buffer.from(await resp.arrayBuffer());

  // 3) Save the cutout back to S3
  const destKey = `${destKeyPrefix}/cutout.png`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: destKey,
      Body: cutout,
      ContentType: "image/png",
    }),
  );

  return destKey;
}

// helper to read Node stream -> Buffer
function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c) => chunks.push(Buffer.from(c)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
