import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET = process.env.ANALYTICS_BUCKET_NAME!;
const TABLE_NAME = process.env.TABLE_NAME || "";

export const handler = async (event: any) => {
  console.log("AnalyticsIngestFn event", JSON.stringify(event));

  const records = Array.isArray(event?.Records)
    ? event.Records
    : [event];

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const key = `events/date=${date}/${now.getTime()}.json`;

  const body = JSON.stringify(records, null, 2);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "application/json",
    }),
  );

  return { ok: true, bucket: BUCKET, key };
};
