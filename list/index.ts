// lambda/list/index.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME!;        // <- matches your CDK
const THUMBS_CDN = (process.env.THUMBS_CDN || '').replace(/\/+$/, '');

function ok(body: unknown) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
function bad(status: number, msg: string) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: msg }),
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const claims: any =
      (event.requestContext as any)?.authorizer?.claims ??
      (event.requestContext as any)?.authorizer?.jwt?.claims ?? {};
    const sub: string | undefined = claims.sub || claims['cognito:username'];
    if (!sub) return bad(401, 'Missing user identity');

    const q = event.queryStringParameters ?? {};
    const userRoot = `users/${sub}/`;
    const prefix = q.prefix && q.prefix.startsWith(userRoot) ? q.prefix : userRoot;
    const maxKeys = Math.min(parseInt(q.maxKeys || '1000', 10) || 1000, 1000);
    let token: string | undefined = q.token;

    const items: Array<{ key: string; size: number; lastModified?: string; thumb?: string }> = [];
    do {
      const resp = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,            // <- important
          Prefix: prefix,
          ContinuationToken: token,
          MaxKeys: maxKeys,
        })
      );

      for (const obj of resp.Contents ?? []) {
        if (!obj.Key) continue;
        if (!/^users\//i.test(obj.Key)) continue;

        const key = obj.Key;
        const size = obj.Size ?? 0;
        const lastModified = obj.LastModified?.toISOString();
        let thumb: string | undefined;
        if (THUMBS_CDN) {
          const tkey = key.replace(/^users\//, 'thumbs/').replace(/\.[^.]+$/, '.jpg');
          thumb = `${THUMBS_CDN}/${tkey}`;
        }
        items.push({ key, size, lastModified, thumb });
      }

      token = resp.IsTruncated ? resp.NextContinuationToken : undefined;
      if (!q.token) break; // only auto-page if caller asked with a token
    } while (token);

    return ok({ prefix, count: items.length, items, nextToken: token });
  } catch (e: any) {
    console.error(e);
    return bad(500, e?.message || 'Server error');
  }
};
