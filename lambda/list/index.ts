import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET!;
const ORIGIN = process.env.WEB_ORIGIN!;

const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Vary': 'Origin',
};

export const handler = async (event: any) => {
  try {
    const prefix = (event?.queryStringParameters?.prefix ?? '').replace(/\.\./g, '').replace(/^[/\\]+/, '');
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix || undefined,
      MaxKeys: 1000,
    }));
    const items = (res.Contents ?? []).map(o => ({
      key: o.Key, size: o.Size, lastModified: o.LastModified?.toISOString?.() ?? null,
    }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ items, isTruncated: !!res.IsTruncated, nextToken: res.NextContinuationToken ?? null }) };
  } catch (e:any) {
    console.error(e);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message ?? String(e) }) };
  }
};
