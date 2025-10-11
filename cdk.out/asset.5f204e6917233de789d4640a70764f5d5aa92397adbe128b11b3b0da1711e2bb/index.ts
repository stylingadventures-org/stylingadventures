import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SQSHandler } from 'aws-lambda';
import sharp from 'sharp';
import { Readable } from 'stream';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET!;
const OUT_PREFIX = process.env.THUMBS_PREFIX || 'thumbnails/';
const MAX_W = parseInt(process.env.MAX_WIDTH || '360', 10);
const QUALITY = parseInt(process.env.JPEG_QUALITY || '80', 10);

function streamToBuffer(stream: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export const handler: SQSHandler = async (event) => {
  for (const rec of event.Records) {
    const { key } = JSON.parse(rec.body) as { key: string };
    console.log('Thumb job for key:', key);

    // Download
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = obj.Body as Readable;
    const buf = await streamToBuffer(body);

    // Process
    const thumb = await sharp(buf).resize({ width: MAX_W, withoutEnlargement: true }).jpeg({ quality: QUALITY }).toBuffer();

    // Build output key: thumbnails/<original-filename>.jpg
    const base = key.split('/').pop() || 'image';
    const outKey = `${OUT_PREFIX}${base.replace(/\.[^.]+$/, '')}.jpg`;

    // Upload
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: outKey,
      Body: thumb,
      ContentType: 'image/jpeg',
      Metadata: { source: key }
    }));

    console.log('Wrote thumbnail:', outKey);
  }
};
