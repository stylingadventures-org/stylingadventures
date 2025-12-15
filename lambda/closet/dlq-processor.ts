import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const eb = new EventBridgeClient({});
const sns = new SNSClient({});

const APP_TABLE = process.env.TABLE_NAME!;
const AUDIT_TABLE = process.env.AUDIT_TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";
const NOTIFY_TOPIC_ARN = process.env.NOTIFY_TOPIC_ARN;

function safeJsonParse(x: any) {
  if (typeof x !== "string") return x;
  try {
    return JSON.parse(x);
  } catch {
    return x;
  }
}

async function emit(detailType: string, detail: any) {
  try {
    await eb.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "stylingadventures.closet",
            DetailType: detailType,
            Detail: JSON.stringify(detail),
          },
        ],
      }),
    );
  } catch (e) {
    console.warn("[dlq] EventBridge put failed:", e);
  }
}

async function notify(subject: string, message: string, detail: any) {
  if (!NOTIFY_TOPIC_ARN) return;
  try {
    await sns.send(
      new PublishCommand({
        TopicArn: NOTIFY_TOPIC_ARN,
        Subject: subject,
        Message: `${message}\n\n${JSON.stringify(detail, null, 2)}`,
      }),
    );
  } catch (e) {
    console.warn("[dlq] SNS publish failed:", e);
  }
}

async function audit(action: string, approvalId: string, detail: any) {
  const ts = new Date();
  try {
    await ddb.send(
      new PutCommand({
        TableName: AUDIT_TABLE,
        Item: {
          pk: `APPROVAL#${approvalId}`,
          sk: `TS#${ts.toISOString()}`,
          action,
          approvalId,
          at: ts.toISOString(),
          detail,
        },
      }),
    );
  } catch (e) {
    console.warn("[dlq] audit write failed:", e);
  }
}

function extractApprovalIdFromStepFnDetail(detail: any): string {
  // StepFn execution status change events often store input as a STRING in detail.input
  const inputObj = safeJsonParse(detail?.input);

  const approvalId =
    inputObj?.approvalId ||
    inputObj?.item?.id ||
    inputObj?.itemId ||
    inputObj?.id ||
    detail?.approvalId ||
    detail?.item?.id;

  return approvalId ? String(approvalId) : "UNKNOWN";
}

export const handler = async (event: any) => {
  const records = event.Records ?? [];
  console.log("[dlq] records:", records.length);

  for (const r of records) {
    const bodyRaw = r?.body;
    const body = safeJsonParse(bodyRaw);

    // If this was delivered via EventBridge -> SQS, the payload is the full event
    const detail = body?.detail ?? body;
    const status = detail?.status;
    const executionArn = detail?.executionArn;

    const approvalId = extractApprovalIdFromStepFnDetail(detail);

    await audit("STEPFN_DLQ", approvalId, { status, executionArn, detail });

    await emit("ClosetApprovalDeadLetter", {
      approvalId,
      status,
      executionArn,
    });

    await notify(
      "Closet approval dead-letter",
      `Step Functions execution entered DLQ state: ${status ?? "UNKNOWN"}`,
      { approvalId, status, executionArn },
    );

    // Best-effort: mark item as ERROR if we have an id
    if (approvalId !== "UNKNOWN") {
      try {
        const pk = `ITEM#${approvalId}`;
        const sk = "META";
        await ddb.send(
          new UpdateCommand({
            TableName: APP_TABLE,
            Key: { [PK_NAME]: pk, [SK_NAME]: sk },
            UpdateExpression: "SET lastError = :e, updatedAt = :t",
            ExpressionAttributeValues: {
              ":e": `StepFn execution ${status ?? "UNKNOWN"} (${executionArn ?? "no-arn"})`,
              ":t": new Date().toISOString(),
            },
          }),
        );
      } catch (e) {
        console.warn("[dlq] failed to mark item error", e);
      }
    } else {
      console.warn("[dlq] could not determine approvalId", {
        status,
        executionArn,
      });
    }
  }

  return { ok: true };
};
