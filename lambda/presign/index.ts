import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET!;
const ORIGIN = process.env.WEB_ORIGIN || '*';

const cors = () => ({
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Let API Gateway preflight succeed quickly too (useful if you ever proxy OPTIONS through)
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: cors(), body: '' };
    }

    const claims = (event.requestContext.authorizer as any)?.claims;
    const sub = claims?.sub;
    if (!sub) {
      return { statusCode: 401, headers: cors(), body: 'Unauthorized' };
    }

    // GET /list
    if (event.httpMethod === 'GET' && event.path.endsWith('/list')) {
      const Prefix = `users/${sub}/`;
      const data = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix }));
      const keys = (data.Contents || [])
        .map(o => o.Key)
        .filter((k): k is string => Boolean(k));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', ...cors() },
        body: JSON.stringify({ prefix: Prefix, items: keys }),
      };
    }

    // POST /presign
    if (event.httpMethod === 'POST' && event.path.endsWith('/presign')) {
      const body = event.body ? JSON.parse(event.body) : {};
      const keyInput: string = String(body.key || 'file.bin');
      const contentType: string = String(body.contentType || 'application/octet-stream');
      const Key = `users/${sub}/${keyInput.replace(/^\/*/, '')}`;

      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: BUCKET, Key, ContentType: contentType }),
        { expiresIn: 900 }
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', ...cors() },
        body: JSON.stringify({ url, key: Key }),
      };
    }

    return { statusCode: 404, headers: cors(), body: 'Not Found' };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, headers: cors(), body: 'Server error' };
  }
};
