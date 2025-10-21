// lambda/thumb-head/index.ts
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET!;
const ORIGIN = process.env.WEB_ORIGIN || "*"; // set in stack; fallback for safety

const baseHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Vary": "Origin",
};

/**
 * INPUT:  GET /thumb-head?key=<users/.../filename.ext>
 * OUTPUT: { ready: boolean }
 */
export const handler = async (event: any) => {
  const raw = event?.queryStringParameters?.key;
  if (!raw) {
    return {
      statusCode: 400,
      headers: baseHeaders,
      body: JSON.stringify({ message: "Missing key" }),
    };
  }

  // Expect the *source* key; translate to the JPEG thumb key
  const srcKey = decodeURIComponent(raw);
  const thumbKey = `thumbs/${srcKey.replace(/\.[^.]+$/, ".jpg")}`;

  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: thumbKey }));
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: JSON.stringify({ ready: true }),
    };
  } catch {
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: JSON.stringify({ ready: false }),
    };
  }
};

