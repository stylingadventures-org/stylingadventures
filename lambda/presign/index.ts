// lambda/presign/index.ts
import {
  S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

type APIGWEvent = {
  httpMethod?: string;
  path?: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
  queryStringParameters?: Record<string, string | undefined> | null;
  // keep requestContext loose so we can read Cognito claims
  requestContext?: any;
};

const s3 = new S3Client({});
const sqs = new SQSClient({});

const BUCKET = process.env.BUCKET || '';
const QUEUE_URL = process.env.THUMB_QUEUE_URL || ''; // may be unset; still return 202

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
};

const json = (data: unknown) =>
  typeof data === 'string' ? data : JSON.stringify(data);

const ok = (data: unknown, statusCode = 200) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  body: json(data),
});

const txt = (text = '', statusCode = 200) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: text,
});

const err = (message: string, statusCode = 500) =>
  ok({ message }, statusCode);

export const handler = async (event: APIGWEvent) => {
  // ✅ Let CORS preflight through fast
  if ((event.httpMethod || '').toUpperCase() === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  try {
    if (!BUCKET) {
      return err('Server is not configured (missing BUCKET)', 500);
    }

    const method = (event.httpMethod || 'GET').toUpperCase();
    const path = (event.path || '').toLowerCase();

    // Pull Cognito subject (user id) from the JWT-verified authorizer claims
    const sub: string | undefined =
      (event as any)?.requestContext?.authorizer?.claims?.sub;

    if (!sub) {
      return err('Unauthorized', 401);
    }

    // === GET /list  ->  { prefix, items: [{ key, size, lastModified }] }
    if (method === 'GET' && path.endsWith('/list')) {
      const Prefix = `users/${sub}/`;
      const data = await s3.send(
        new ListObjectsV2Command({ Bucket: BUCKET, Prefix })
      );
      const items = (data.Contents || [])
        .filter((o) => o.Key)
        .map((o) => ({
          key: o!.Key!,
          size: o!.Size ?? 0,
          lastModified: o!.LastModified ? o!.LastModified.toISOString() : null,
        }));
      return ok({ prefix: Prefix, items });
    }

    // === POST /presign  { key, contentType } -> { url, key, headers? }
    if (method === 'POST' && path.endsWith('/presign')) {
      const body = event.body ? JSON.parse(event.body) : {};
      const keyInput: string = String(body.key || 'file.bin');
      const contentType: string = String(
        body.contentType || 'application/octet-stream'
      );
      // Ensure key is namespaced to the caller
      const Key = `users/${sub}/${keyInput.replace(/^\/*/, '')}`;

      // Generate a PUT presigned URL
      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: BUCKET, Key, ContentType: contentType }),
        { expiresIn: 900 }
      );

      // Optionally surface headers clients should send for PUT
      const headers = { 'Content-Type': contentType };

      return ok({ url, key: Key, headers });
    }

    // === DELETE /delete?key=users/<sub>/...
    if (method === 'DELETE' && path.endsWith('/delete')) {
      const key = String(event.queryStringParameters?.key || '');
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) {
        return err('Forbidden key', 403);
      }
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return txt('', 204);
    }

    // === POST /thumb  { key } -> enqueue job (202)
    if (method === 'POST' && path.endsWith('/thumb')) {
      const body = event.body ? JSON.parse(event.body) : {};
      const key: string = String(body.key || '');

      // Guard: only allow enqueuing for the caller's own namespace
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) {
        return err('Forbidden key', 403);
      }

      // If queue isn't configured yet, still return 202 for a smooth UX
      if (QUEUE_URL) {
        await sqs.send(
          new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({ key }),
          })
        );
      }
      return txt('', 202);
    }

    return err('Not found', 404);
  } catch (e: any) {
    console.error('UPLOADS ERROR', {
      path: event.path,
      method: event.httpMethod,
      headers: event.headers,
      message: e?.message,
      stack: e?.stack,
    });
    return err(e?.message || 'Internal server error', 500);
  }
};

