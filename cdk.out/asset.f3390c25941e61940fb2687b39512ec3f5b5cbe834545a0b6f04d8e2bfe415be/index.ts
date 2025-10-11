import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET!;
const ORIGIN = process.env.WEB_ORIGIN || '*';
const QUEUE_URL = process.env.THUMB_QUEUE_URL; // may be undefined; we handle that

const cors = () => ({
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
});

function assertAllowedOrigin(headers: Record<string, any>) {
  const expected = process.env.WEB_ORIGIN ?? '';
  const origin = headers?.origin || headers?.Origin || '';
  const referer = headers?.referer || headers?.Referer || '';
  if (!expected) return;
  const ok = origin.startsWith(expected) || referer.startsWith(expected);
  if (!ok) { const err: any = new Error('Forbidden origin'); err.statusCode = 403; throw err; }
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    assertAllowedOrigin(event.headers || {});
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: cors(), body: '' };
    }

    const claims = (event.requestContext.authorizer as any)?.claims;
    const sub = claims?.sub;
    if (!sub) return { statusCode: 401, headers: cors(), body: 'Unauthorized' };

    // GET /list
    if (event.httpMethod === 'GET' && event.path.endsWith('/list')) {
      const Prefix = `users/${sub}/`;
      const data = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix }));
      const items = (data.Contents || []).filter(o => o.Key).map(o => ({
        key: o!.Key!,
        size: o!.Size ?? 0,
        lastModified: o!.LastModified?.toISOString() ?? null,
      }));
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...cors() }, body: JSON.stringify({ prefix: Prefix, items }) };
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
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...cors() }, body: JSON.stringify({ url, key: Key }) };
    }

    // DELETE /delete
    if (event.httpMethod === 'DELETE' && event.path.endsWith('/delete')) {
      const qp = event.queryStringParameters || {};
      const key = (qp.key || '').toString();
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) {
        return { statusCode: 403, headers: cors(), body: 'Forbidden key' };
      }
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return { statusCode: 204, headers: cors(), body: '' };
    }

    // POST /thumb (enqueue) — lazy import SQS only here
    if (event.httpMethod === 'POST' && event.path.endsWith('/thumb')) {
      const body = event.body ? JSON.parse(event.body) : {};
      const key: string = String(body.key || '');
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) {
        return { statusCode: 403, headers: cors(), body: 'Forbidden key' };
      }
      // If no queue configured yet, accept the request but do nothing
      if (!QUEUE_URL) return { statusCode: 202, headers: cors(), body: '' };

      const { SQSClient, SendMessageCommand } = await import('@aws-sdk/client-sqs');
      const sqs = new SQSClient({});
      await sqs.send(new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({ key }),
      }));
      return { statusCode: 202, headers: cors(), body: '' };
    }

    return { statusCode: 404, headers: cors(), body: 'Not Found' };
  } catch (e: any) {
    console.error(e);
    const status = typeof e?.statusCode === 'number' ? e.statusCode : 500;
    const message = status === 403 ? 'Forbidden origin' : 'Server error';
    return { statusCode: status, headers: cors(), body: message };
  }
};

