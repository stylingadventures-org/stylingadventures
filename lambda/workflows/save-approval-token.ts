// lambda/workflows/save-approval-token.ts
import { SNSHandler } from "aws-lambda";
import {
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});
const { TABLE_NAME = "" } = process.env;
if (!TABLE_NAME) throw new Error("Missing env: TABLE_NAME");

/**
 * SNS message from WAIT_FOR_TASK_TOKEN contains:
 *  {
 *    "token": "<task token>",
 *    "itemId": "<id>",
 *    "ownerSub": "<sub>"
 *  }
 * We persist `approvalToken` on the item so the admin resolver can callback SFN.
 */
export const handler: SNSHandler = async (event) => {
  for (const rec of event.Records) {
    if (!rec.Sns?.Message) continue;
    let msg: any;
    try {
      msg = JSON.parse(rec.Sns.Message);
    } catch {
      console.warn("Bad SNS message:", rec.Sns.Message);
      continue;
    }
    const token = msg?.token;
    const itemId = msg?.itemId;
    if (!token || !itemId) {
      console.warn("Missing token or itemId in SNS message:", msg);
      continue;
    }

    await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { pk: { S: `ITEM#${itemId}` }, sk: { S: "META" } },
        UpdateExpression:
          "SET approvalToken = :t, updatedAt = :u, gsi2pk = if_not_exists(gsi2pk, :g2), gsi2sk = if_not_exists(gsi2sk, :u)",
        ExpressionAttributeValues: {
          ":t": { S: token },
          ":u": { S: new Date().toISOString() },
          ":g2": { S: "STATUS#PENDING" },
        },
      })
    );
  }
};
