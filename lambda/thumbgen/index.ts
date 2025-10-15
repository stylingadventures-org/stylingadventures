// lambda/thumbgen/index.ts
import { S3Event, S3Handler } from "aws-lambda";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET!;

export const handler: S3Handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // only images from users/, skip anything already under thumbs/
    if (!/^users\//i.test(key)) continue;
    if (/^thumbs\//i.test(key)) continue;
    if (!/\.(png|jpe?g|webp)$/i.test(key)) continue;

    const thumbKey = key
      .replace(/^users\//i, 'thumbs/')
      .replace(/\.[^.]+$/, '.jpg'); // <- force .jpg

    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const buf = await obj.Body!.transformToByteArray();

    const resized = await sharp(buf)
      .resize(320, 320, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: thumbKey,
      Body: resized,
      ContentType: "image/jpeg",
      Metadata: { source: key }
    }));

    console.log(`✅ Generated: ${thumbKey}`);
  }
};
