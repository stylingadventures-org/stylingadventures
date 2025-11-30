// lambda/layout/validate-layout.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

const s3 = new S3Client({});
const BUCKET = process.env.LAYOUT_TEMPLATES_BUCKET!;

// tiny helper to read body
async function streamToString(stream: any): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as Readable) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export const handler = async (event: any) => {
  const { layoutKey, schemaKey } = event;

  if (!layoutKey || !schemaKey) {
    throw new Error("layoutKey and schemaKey are required");
  }

  const [layoutObj, schemaObj] = await Promise.all(
    [layoutKey, schemaKey].map(async (Key) => {
      const res = await s3.send(
        new GetObjectCommand({ Bucket: BUCKET, Key }),
      );
      const body = await streamToString(res.Body as any);
      return JSON.parse(body);
    }),
  );

  // TODO: apply real JSON Schema validation + accessibility rules
  // For now, just return "valid: true" when it parses.
  return {
    layoutValid: true,
    issues: [],
    layoutSummary: {
      anchors: layoutObj.anchors ?? [],
      bounds: layoutObj.bounds ?? null,
    },
  };
};
