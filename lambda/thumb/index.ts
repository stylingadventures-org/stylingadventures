// lambda/thumb/index.ts
import { SQSHandler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { Readable } from 'stream';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET!;
const OUT_PREFIX = process.env.THUMBS_PREFIX || 'thumbs/';
const MAX_W = parseInt(process.env.MAX_WIDTH || '320', 10);
const MAX_H = parseInt(process.env.MAX_HEIGHT || '320', 10);
const JPEG_Q = parseInt(process.env.JPEG_QUALITY || '82', 10);

function streamToBuffer(stream: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

const isImage = (k: string) => /\.(png|jpe?g)$/i.test(k);

export const handler: SQSHandler = async (event) => {
  for (const rec of event.Records) {
    const { key } = JSON.parse(rec.body) as { key: string };
    if (!isImage(key)) { console.log('skip non-image', key); continue; }
    if (key.startsWith('thumbs/')) { console.log('skip already-thumb', key); continue; }

    // Output key: thumbs/<original key>  (so the page can GET /thumbs/${key})
    const outKey = `${OUT_PREFIX}${key.replace(/^\/+/, '')}`;

    // Download
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const buf = await streamToBuffer(obj.Body as Readable);

    // Resize; keep original format (png->png, jpg->jpg)
    const ext = (key.match(/\.(png|jpe?g)$/i)?.[1] || 'jpg').toLowerCase();
    const img = sharp(buf).resize({ width: MAX_W, height: MAX_H, fit: 'inside', withoutEnlargement: true });

    let outBuf: Buffer, contentType: string;
    if (ext === 'png') {
      outBuf = await img.png({ compressionLevel: 9 }).toBuffer();
      contentType = 'image/png';
    } else {
      outBuf = await img.jpeg({ quality: JPEG_Q }).toBuffer();
      contentType = 'image/jpeg';
    }

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: outKey,
      Body: outBuf,
      ContentType: contentType,
      Metadata: { source: key },
    }));

    console.log(`✅ thumb ${key} -> ${outKey} (${contentType}, ${outBuf.length}B)`);
  }
};

