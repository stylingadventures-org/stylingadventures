import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Path-style so host stays s3.us-east-1.amazonaws.com and avoids per-bucket DNS lookups.
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  forcePathStyle: true,
});

const BUCKET = process.env.BUCKET!;
const ORIGIN = process.env.WEB_ORIGIN || 'https://stylingadventures.com';

const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Content-Type': 'application/json',
  'Vary': 'Origin',
};

export const handler = async (event: any) => {
  if ((event?.httpMethod || event?.requestContext?.http?.method) === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  try {
    const claims =
      event?.requestContext?.authorizer?.claims ??
      event?.requestContext?.authorizer?.jwt?.claims ??
      {};
    const sub = claims?.sub as string | undefined;

    const queryPrefix = (event?.queryStringParameters?.prefix ?? '')
      .replace(/\.\./g, '')
      .replace(/^[/\\]+/, '');

    const userPrefix = sub ? `users/${sub}/` : '';
    const prefix = `${userPrefix}${queryPrefix}`;

    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix || undefined,
        MaxKeys: 1000,
      })
    );

    const items = (res.Contents ?? []).map(o => ({
      key: o.Key,
      size: o.Size,
      lastModified: o.LastModified?.toISOString?.() ?? null,
    }));

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ prefix, items, isTruncated: !!res.IsTruncated, nextToken: res.NextContinuationToken ?? null }),
    };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e?.message ?? String(e) }) };
  }
};

