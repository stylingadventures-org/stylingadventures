import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const claims = (event.requestContext.authorizer as any)?.claims;
    const sub = claims?.sub;
    if (!sub) return { statusCode: 401, body: 'Unauthorized' };

    if (event.httpMethod === 'GET' && event.path.endsWith('/list')) {
      const Prefix = `users/${sub}/`;
      const data = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix }));
      const keys = (data.Contents || []).map(o => o.Key).filter(Boolean);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: Prefix, items: keys }),
      };
    }

    if (event.httpMethod === 'POST' && event.path.endsWith('/presign')) {
      const body = event.body ? JSON.parse(event.body) : {};
      const keyInput: string = String(body.key || 'file.bin');
      const contentType: string = String(body.contentType || 'application/octet-stream');
      const Key = `users/${sub}/${keyInput.replace(/^\/*/, '')}`;
      const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key, ContentType: contentType }), { expiresIn: 900 });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, key: Key }),
      };
    }

    return { statusCode: 404, body: 'Not Found' };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, body: 'Server error' };
  }
};
