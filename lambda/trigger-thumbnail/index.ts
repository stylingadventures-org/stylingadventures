// lambda/trigger-thumbnail/index.ts
import type { SQSEvent, SQSRecord } from "aws-lambda";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const sfn = new SFNClient({});
const STATE_MACHINE_ARN = process.env.THUMB_SM_ARN || "";

// Now supports both users/* and closet/* image keys
const isSupportedKey = (key: string) =>
  /^(users\/|closet\/)/i.test(key) && /\.(?:jpe?g|png|webp)$/i.test(key);

function extractS3RecordsFromBody(
  bodyStr: string,
): Array<{ bucket: string; key: string }> {
  const out: Array<{ bucket: string; key: string }> = [];
  let body: any;
  try {
    body = JSON.parse(bodyStr);
  } catch {
    console.warn("Skipping record; non-JSON body:", bodyStr.slice(0, 256));
    return out;
  }

  // 1) S3→SQS (Records array)
  const candidates: any[] = Array.isArray(body?.Records)
    ? body.Records
    : body?.s3
    ? [body] // 2) single S3 record
    : body?.detail?.bucket?.name && body?.detail?.object?.key
    ? [
        // 3) EventBridge-like shape
        {
          s3: {
            bucket: { name: body.detail.bucket.name || body.detail.bucket },
            object: { key: body.detail.object.key },
          },
        },
      ]
    : [];

  if (candidates.length === 0) {
    console.warn("Skipping record; unrecognized body:", bodyStr.slice(0, 512));
    return out;
  }

  for (const rec of candidates) {
    const bucket = rec?.s3?.bucket?.name;
    let key = rec?.s3?.object?.key as string | undefined;
    if (!bucket || !key) continue;

    // S3 can URL-encode keys and turn spaces to "+"
    key = decodeURIComponent(String(key).replace(/\+/g, " "));

    if (!isSupportedKey(key)) {
      console.info("Ignored (filter)", { key });
      continue;
    }
    out.push({ bucket, key });
  }
  return out;
}

export const handler = async (event: SQSEvent) => {
  if (!STATE_MACHINE_ARN) throw new Error("Missing env THUMB_SM_ARN");

  console.info("SQS batch size:", event.Records.length);
  const toStart: Array<{ bucket: string; key: string }> = [];

  for (const r of event.Records as SQSRecord[]) {
    toStart.push(...extractS3RecordsFromBody(r.body ?? ""));
  }

  for (const item of toStart) {
    const input = JSON.stringify(item);
    await sfn.send(
      new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        input,
      }),
    );
    console.info("Started execution", item);
  }

  console.info("Dispatched", toStart.length, "execution(s).");
  return { ok: true, count: toStart.length };
};
