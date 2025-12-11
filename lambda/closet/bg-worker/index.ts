// lambda/closet/bg-worker/index.ts

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import sharp from "sharp";

const s3 = new S3Client({});
const ddb = new DynamoDBClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET!;
const RAW_MEDIA_GSI = process.env.RAW_MEDIA_GSI_NAME!;

// Worker is triggered by SQS messages sent by StepFunctions/ECS/etc. (your stack already configures this)
export const handler = async (event: any) => {
  console.log("BG worker event:", JSON.stringify(event));

  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const rawKey = body.rawKey;
    const itemId = body.itemId;

    console.log("Processing:", { itemId, rawKey });

    // 1. Download original
    const rawImg = await s3.send(
      new GetObjectCommand({
        Bucket: OUTPUT_BUCKET,
        Key: rawKey,
      })
    );

    const buf = Buffer.from(await rawImg.Body!.transformToByteArray());

    // 2. Remove background (simple example: just converts to PNG)
    const processedBuf = await sharp(buf).png().toBuffer();

    const processedKey = rawKey.replace("closet/", "closet/processed-");

    // 3. Upload processed output
    await s3.send(
      new PutObjectCommand({
        Bucket: OUTPUT_BUCKET,
        Key: processedKey,
        Body: processedBuf,
        ContentType: "image/png",
      })
    );

    // 4. Update DDB item
    await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { id: { S: itemId } },
        UpdateExpression: "SET mediaKey = :m, #s = :status",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":m": { S: processedKey },
          ":status": { S: "READY" },
        },
      })
    );

    console.log("✓ Background processed:", processedKey);
  }

  return {};
};
