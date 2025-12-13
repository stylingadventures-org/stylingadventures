import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

function mustGet(obj: any, key: string) {
  const val = obj?.[key];
  if (val === undefined || val === null) {
    throw new Error(
      `Missing required field: ${key}. Keys present: ${Object.keys(obj || {}).join(", ")}`
    );
  }
  return val;
}

export const handler = async (event: any) => {
  console.log("[notify-admin] incoming event:", JSON.stringify(event));

  // ✅ This MUST be present when Step Functions uses WAIT_FOR_TASK_TOKEN
  // and your payload includes: token: JsonPath.taskToken
  const taskToken = mustGet(event, "token") as string;

  const item = mustGet(event, "item") as any;
  const approvalId = item.id || item.itemId || item.closetItemId;
  if (!approvalId) {
    throw new Error(
      `Could not determine approvalId (expected item.id). item keys: ${Object.keys(item || {}).join(
        ", ",
      )}`
    );
  }

  const pk = `ITEM#${approvalId}`;
  const sk = "META";
  const now = new Date().toISOString();

  console.log("[notify-admin] writing token to ddb", {
    table: TABLE_NAME,
    pk,
    sk,
    tokenLen: taskToken.length,
  });

  const result = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      UpdateExpression: [
        "SET #status = :pending",
        "    , taskToken = :tok",
        "    , approvalRequestedAt = :now",
        "    , processedImageKey = :pkey",
        "    , updatedAt = :now",
        "    , rawInput = :raw",
      ].join(" "),
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":pending": "PENDING",
        ":tok": taskToken,
        ":now": now,
        ":pkey": event.processedImageKey ?? null,
        ":raw": event,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  console.log("[notify-admin] ddb ALL_NEW:", JSON.stringify(result.Attributes));

  // IMPORTANT: do NOT call SendTaskSuccess here.
  // This Lambda's job is only to store the task token; StepFn should keep waiting.
  return { ok: true, approvalId };
};
