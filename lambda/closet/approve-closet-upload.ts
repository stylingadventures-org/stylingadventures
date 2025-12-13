import { SFNClient, SendTaskSuccessCommand } from "@aws-sdk/client-sfn";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const sfn = new SFNClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

export const handler = async (event: any) => {
  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : (event.body ?? {});
    const approvalId = body.approvalId;
    const decision = body.decision;

    if (!approvalId || !decision) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing approvalId or decision" }) };
    }
    if (decision !== "APPROVE" && decision !== "REJECT") {
      return { statusCode: 400, body: JSON.stringify({ message: "decision must be APPROVE or REJECT" }) };
    }

    // ✅ MATCH YOUR REAL TABLE SHAPE
    const pk = `ITEM#${approvalId}`;
    const sk = "META";

    const res = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      }),
    );

    if (!res.Item) {
      return { statusCode: 404, body: JSON.stringify({ message: "Item not found" }) };
    }

    if (res.Item.status !== "PENDING") {
      return { statusCode: 409, body: JSON.stringify({ message: `Already ${res.Item.status}` }) };
    }

    const taskToken = res.Item.taskToken as string | undefined;
    if (!taskToken) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "Missing taskToken on item META. NotifyAdminFn must save token before approval can work.",
        }),
      };
    }

    // ✅ IMPORTANT: use SendTaskSuccess for BOTH because your Choice checks decision
    await sfn.send(
      new SendTaskSuccessCommand({
        taskToken,
        output: JSON.stringify({
          decision,
          reason: decision === "APPROVE" ? "Approved by admin UI" : "Rejected by admin UI",
        }),
      }),
    );

    const now = new Date().toISOString();

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
        UpdateExpression: "SET #status = :s, decidedAt = :t, updatedAt = :t REMOVE taskToken",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":s": decision === "APPROVE" ? "APPROVED" : "REJECTED",
          ":t": now,
        },
      }),
    );

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal error" }) };
  }
};

