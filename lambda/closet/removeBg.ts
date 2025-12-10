import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fetch from "node-fetch";

const s3 = new S3Client({});

type RemoveBgParams = {
  bucket: string;
  key: string;
  destKeyPrefix: string;
};

export async function removeBackgroundForS3Object({
  bucket,
  key,
  destKeyPrefix,
}: RemoveBgParams): Promise<string> {
  const rembgUrl = "https://your-lakechain-endpoint.amazonaws.com/segment";

  // Step 1: Fetch image from S3
  const orig = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = await streamToBuffer(orig.Body as any);

  // Step 2: Call Lakechain RemBG
  const response = await fetch(rembgUrl, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body,
  });

  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`RemBG API failed (${response.status}): ${txt}`);
  }

  const cutout = Buffer.from(await response.arrayBuffer());

  // Step 3: Upload back to S3
  const destKey = `${destKeyPrefix}-cutout.png`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: destKey,
      Body: cutout,
      ContentType: "image/png",
    })
  );

  return destKey;
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c) => chunks.push(Buffer.from(c)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
