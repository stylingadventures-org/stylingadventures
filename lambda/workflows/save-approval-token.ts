// lambda/workflows/save-approval-token.ts
import { SNSHandler, SNSEvent } from "aws-lambda";
import {
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

interface ApprovalMessage {
  type: "CLOSET_UPLOAD" | "BESTIE_BACKGROUND_CHANGE" | string;
  detail: {
    itemId: string;
    userId?: string;
    ownerSub?: string;
    // and any extra context you pass
  };
  taskToken: string;
}

export const handler: SNSHandler = async (event: SNSEvent) => {
  const records = event.Records || [];

  for (const record of records) {
    const msg: ApprovalMessage = JSON.parse(record.Sns.Message);

    const { itemId, ...detail } = msg.detail;
    const pk = `CLOSET#${itemId}`; // 👈 adjust if your items are keyed differently
    const sk = "ITEM";

    // Option A: store the taskToken on the existing item
    await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: {
          [PK_NAME]: { S: pk },
          [SK_NAME]: { S: sk },
        },
        UpdateExpression:
          "SET approvalTaskToken = :taskToken, approvalType = :type, approvalDetail = :detail, approvalStatus = :status",
        ExpressionAttributeValues: {
          ":taskToken": { S: msg.taskToken },
          ":type": { S: msg.type },
          ":detail": { S: JSON.stringify(detail) },
          ":status": { S: "PENDING" },
        },
      }),
    );
  }
};
