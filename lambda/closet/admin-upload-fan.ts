// lambda/closet/admin-upload-fan.ts
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const FAN_APPROVAL_SM_ARN = process.env.FAN_APPROVAL_SM_ARN!;

/**
 * POST /admin/fan/closet/upload
 * Body: { ownerSub: string, s3Key: string, itemId?: string }
 */
export const handler = async (event: any) => {
  try {
    const body = typeof event?.body === "string" ? JSON.parse(event.body) : event?.body ?? {};
    const ownerSub = body?.ownerSub;
    const s3Key = body?.s3Key;
    const itemId = body?.itemId ?? randomUUID();

    if (!ownerSub || typeof ownerSub !== "string") return resp(400, { message: "Missing ownerSub" });
    if (!s3Key || typeof s3Key !== "string") return resp(400, { message: "Missing s3Key" });

    await ddb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall({
          pk: `ITEM#${itemId}`,
          sk: "META",
          entityType: "CLOSET_ITEM",
          ownerSub,
          rawMediaKey: s3Key,
          status: "PENDING",
          approvalRequestedAt: new Date().toISOString(),
        }),
      }),
    );

    await sfn.send(
      new StartExecutionCommand({
        stateMachineArn: FAN_APPROVAL_SM_ARN,
        input: JSON.stringify({ item: { id: itemId, s3Key, ownerSub } }),
      }),
    );

    return resp(200, { itemId, status: "PENDING" });
  } catch (err: any) {
    console.error("[admin-upload-fan] error", err);
    return resp(500, { message: "Internal error", error: err?.message ?? String(err) });
  }
};

function resp(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
    },
    body: JSON.stringify(body),
  };
}
