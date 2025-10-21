// lambda/thumbnailer/index.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET!;
const OUT_PREFIX = (process.env.THUMBS_PREFIX || 'thumbs/').replace(/\/+$/, '') + '/';
const MAX_W = parseInt(process.env.MAX_WIDTH || '360', 10);
const QUALITY = parseInt(process.env.JPEG_QUALITY || '80', 10);

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

// ————— helpers —————
function decodeS3Key(k: string | undefined | null): string | null {
  if (!k || typeof k !== 'string') return null;
  // S3/SNS/SQS sometimes use '+' for spaces; normalize before decodeURIComponent.
  try {
    return decodeURIComponent(k.replace(/\+/g, '%20'));
  } catch {
    // If it was plain (not encoded), just return it
    return k;
  }
}

type SqsRecord = { body: string };
type SqsEvent = { Records: SqsRecord[] };
type SfnEvent = { bucket: string; key: string };
type S3PutEvent = { Records: { s3: { bucket: { name: string }, object: { key: string } } }[] };

function* extractJobs(event: any): Generator<{ bucket: string; key: string }> {
  // 1) SQS payload (can be {bucket,key} or an S3 event envelope)
  if (event && Array.isArray(event.Records) && event.Records.length && 'body' in event.Records[0]) {
    for (const r of (event as SqsEvent).Records) {
      try {
        const msg = JSON.parse(r.body);

        // Case A: direct { bucket, key }
        const directKey = decodeS3Key(msg.key);
        const directBucket = msg.bucket || BUCKET;
        if (directKey && directBucket) {
          yield { bucket: directBucket, key: directKey };
          continue;
        }

        // Case B: S3 event inside SQS
        const recs = msg?.Records;
        if (Array.isArray(recs)) {
          for (const rr of recs) {
            const b = rr?.s3?.bucket?.name || BUCKET;
            const k = decodeS3Key(rr?.s3?.object?.key);
            if (b && k) yield { bucket: b, key: k };
          }
        }
      } catch (e) {
        console.warn('bad SQS body:', e);
      }
    }
    return;
  }

  // 2) Step Functions direct: { bucket, key }
  if (event && typeof event.bucket === 'string' && typeof event.key === 'string') {
    const k = decodeS3Key((event as SfnEvent).key);
    if (k) yield { bucket: event.bucket || BUCKET, key: k };
    return;
  }

  // 3) Bare S3 event (defensive)
  if (event && Array.isArray(event.Records) && event.Records[0]?.s3) {
    for (const r of (event as S3PutEvent).Records) {
      const b = r.s3.bucket.name;
      const k = decodeS3Key(r.s3.object.key);
      if (b && k) yield { bucket: b, key: k };
    }
    return;
  }

  console.warn('No recognizable event shape:', JSON.stringify(event).slice(0, 500));
}

async function processOne(toJpeg: ImgToJpeg, bucket: string, srcKey: string) {
  // avoid loops
  if (srcKey.startsWith(OUT_PREFIX)) {
    console.log('Skip (already a thumb):', srcKey);
    return;
  }

  // only supported types under users/
  if (!/^users\/.+\.(png|jpe?g|webp)$/i.test(srcKey)) {
    console.log('Skip key (not supported):', srcKey);
    return;
  }

  // normalize path parts and build output
  const dir = srcKey.replace(/[^/]+$/, '');              // "users/<sub>/path/"
  const base = srcKey.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
  const outKey = `${OUT_PREFIX}${dir}${base}.jpg`.replace(/\/{2,}/g, '/');

  console.log('Thumb for:', { bucket, srcKey, outKey });

  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: srcKey }));
  const buf = Buffer.from(await obj.Body!.transformToByteArray());
  const jpg = await toJpeg(buf);

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: outKey,
    Body: jpg,
    ContentType: 'image/jpeg',
    Metadata: { source: srcKey },
  }));

  console.log('✅ wrote', outKey);
}

export const handler = async (event: any) => {
  const toJpeg = await resolveTransformer();
  let hadWork = false;

  for (const job of extractJobs(event)) {
    hadWork = true;
    try {
      await processOne(toJpeg, job.bucket, job.key);
    } catch (err) {
      console.error('❌ thumb error:', err);
      // surface to SFN/SQS for retry/backoff
      throw err;
    }
  }

  if (!hadWork) throw new Error('No jobs extracted from event');
  return { ok: true };
};
