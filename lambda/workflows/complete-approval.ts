// lambda/workflows/complete-approval.ts
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  SFNClient,
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
} from "@aws-sdk/client-sfn";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    return { statusCode: 400, body: "Missing body" };
  }
  const { itemId, decision, reason } = JSON.parse(event.body) as {
    itemId: string;
    decision: "APPROVE" | "REJECT";
    reason?: string;
  };

  const pk = `CLOSET#${itemId}`;
  const sk = "ITEM";

  const result = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK_NAME]: { S: pk },
        [SK_NAME]: { S: sk },
      },
      ProjectionExpression: "approvalTaskToken",
    }),
  );

  const taskToken = result.Item?.approvalTaskToken?.S;
  if (!taskToken) {
    return {
      statusCode: 404,
      body: `No approvalTaskToken found for itemId=${itemId}`,
    };
  }

  if (decision === "APPROVE") {
    await sfn.send(
      new SendTaskSuccessCommand({
        taskToken,
        output: JSON.stringify({ approved: true }),
      }),
    );
  } else {
    await sfn.send(
      new SendTaskFailureCommand({
        taskToken,
        error: "REJECTED",
        cause: reason || "Rejected by admin",
      }),
    );
  }

  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK_NAME]: { S: pk },
        [SK_NAME]: { S: sk },
      },
      UpdateExpression:
        "SET approvalStatus = :status, approvalReason = :reason REMOVE approvalTaskToken",
      ExpressionAttributeValues: {
        ":status": { S: decision },
        ":reason": { S: reason || "" },
      },
    }),
  );

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
