// lambda/thumbnailer/index.ts
import { SQSHandler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET!;
const OUT_PREFIX = (process.env.THUMBS_PREFIX || 'thumbs/').replace(/\/+$/, '') + '/';
const MAX_W = parseInt(process.env.MAX_WIDTH || '360', 10);
const QUALITY = parseInt(process.env.JPEG_QUALITY || '80', 10);

// Prefer sharp if available; otherwise fall back to jimp (pure JS, no Docker)
type ImgToJpeg = (buf: Buffer) => Promise<Buffer>;
let toJpegImpl: ImgToJpeg | null = null;

async function resolveTransformer(): Promise<ImgToJpeg> {
  if (toJpegImpl) return toJpegImpl;

  try {
    const sharp = (await import('sharp')).default;
    toJpegImpl = async (buf: Buffer) =>
      await sharp(buf)
        .resize({ width: MAX_W, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY })
        .toBuffer();
    console.log('Using sharp for thumbnails');
  } catch {
    const Jimp = (await import('jimp')).default;
    toJpegImpl = async (buf: Buffer) => {
      const img = await Jimp.read(buf);
      img.resize(MAX_W, Jimp.AUTO).quality(QUALITY);
      return await img.getBufferAsync(Jimp.MIME_JPEG);
    };
    console.log('Using jimp fallback for thumbnails');
  }
  return toJpegImpl!;
}

export const handler: SQSHandler = async (event) => {
  const toJpeg = await resolveTransformer();

  for (const rec of event.Records) {
    try {
      const { key } = JSON.parse(rec.body) as { key: string };
      if (!key || !/^users\/.+\.(png|jpe?g|webp)$/i.test(key)) {
        console.log('Skip key:', key);
        continue;
      }

      const srcKey = key;
      const base = srcKey.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
      const dir = srcKey.replace(/[^/]+$/, ''); // "users/<sub>/path/"
      const outKey = `${OUT_PREFIX}${dir}${base}.jpg`;

      console.log('Thumb for:', srcKey, '->', outKey);

      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: srcKey }));
      const buf = Buffer.from(await obj.Body!.transformToByteArray());

      const jpg = await toJpeg(buf);

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: outKey,
        Body: jpg,
        ContentType: 'image/jpeg',
        Metadata: { source: srcKey },
      }));

      console.log('✅ wrote', outKey);
    } catch (err) {
      console.error('❌ thumb error:', err);
    }
  }
};
