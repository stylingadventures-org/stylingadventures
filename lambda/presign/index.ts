import { APIGatewayProxyResult } from 'aws-lambda';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Path-style so host stays s3.us-east-1.amazonaws.com and avoids per-bucket DNS lookups.
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  forcePathStyle: true,
});

const BUCKET = process.env.BUCKET!;
const ORIGIN = process.env.WEB_ORIGIN ?? 'https://d1682i07dc1r3k.cloudfront.net';
const THUMBS_CDN = process.env.THUMBS_CDN;

type AnyEvent = any;

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers':
    'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  Vary: 'Origin',
};

function ok(body: unknown, extra: Record<string, string> = {}): APIGatewayProxyResult {
  return { statusCode: 200, headers: { ...corsHeaders, ...extra }, body: JSON.stringify(body) };
}
function bad(status: number, msg: string): APIGatewayProxyResult {
  return { statusCode: status, headers: corsHeaders, body: JSON.stringify({ message: msg }) };
}

function getMethod(e: AnyEvent): string {
  return e.httpMethod ?? e.requestContext?.http?.method ?? 'GET';
}
function getPath(e: AnyEvent): string {
  return e.resource ?? e.rawPath ?? e.path ?? '/';
}
function getClaims(e: AnyEvent): Record<string, any> {
  return e.requestContext?.authorizer?.claims ?? e.requestContext?.authorizer?.jwt?.claims ?? {};
}
function parseBody(e: AnyEvent): any {
  if (!e.body) return undefined;
  const raw = e.isBase64Encoded ? Buffer.from(e.body, 'base64').toString() : e.body;
  try { return JSON.parse(raw); } catch { return undefined; }
}

export const handler = async (event: AnyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const method = getMethod(event);
    const path = getPath(event);
    const claims = getClaims(event);
    const userSub = claims?.sub as string | undefined;

    // CORS preflight
    if (method === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };

    // --- POST /presign ---
    if (method === 'POST' && /\/presign$/.test(path)) {
      const body = parseBody(event);
      if (!body) return bad(400, 'Missing body');

      let { key, contentType } = body as { key?: string; contentType?: string };
      if (!key || typeof key !== 'string') return bad(400, 'Invalid "key"');
      if (!contentType || typeof contentType !== 'string') return bad(400, 'Invalid "contentType"');
      if (key.includes('..')) return bad(400, 'Illegal key');

      // Keep uploads in the caller’s folder unless client already specified full path
      if (userSub && !key.startsWith('users/')) key = `users/${userSub}/${key}`;

      const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
      const url = await getSignedUrl(s3, cmd, { expiresIn: 900 });

      return ok({ url, key, thumbsCdn: THUMBS_CDN });
    }

    // --- DELETE /delete ---
    if (method === 'DELETE' && /\/delete$/.test(path)) {
      const body = parseBody(event);

      // Accept key from JSON body OR from query string (?key=...)
      const keyFromQuery = event?.queryStringParameters?.key
        ? decodeURIComponent(event.queryStringParameters.key)
        : undefined;
      const key = (body?.key as string | undefined) ?? keyFromQuery;

      if (!key || typeof key !== 'string') return bad(400, 'Invalid "key"');
      if (userSub && !key.startsWith(`users/${userSub}/`)) return bad(403, 'Forbidden');

      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return ok({ deleted: key });
    }

    return bad(404, 'Not Found');
  } catch (e: any) {
    console.error('handler error', e);
    return bad(500, e?.message ?? 'Server error');
  }
};
