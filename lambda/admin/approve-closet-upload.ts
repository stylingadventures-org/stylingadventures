import { SFNClient, SendTaskSuccessCommand } from "@aws-sdk/client-sfn";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sfn = new SFNClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const eb = new EventBridgeClient({});
const sns = new SNSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const AUDIT_TABLE_NAME = process.env.AUDIT_TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";
const NOTIFY_TOPIC_ARN = process.env.NOTIFY_TOPIC_ARN;

function response(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "OPTIONS,POST",
      "access-control-allow-headers": "*",
    },
    body: JSON.stringify(body),
  };
}

function getHttpMethod(event: any): string | undefined {
  const m2 = event?.requestContext?.http?.method;
  if (m2) return String(m2).toUpperCase();
  const m1 = event?.requestContext?.httpMethod;
  if (m1) return String(m1).toUpperCase();
  const mf = event?.httpMethod;
  if (mf) return String(mf).toUpperCase();
  return undefined;
}

function safeJsonParse(s: any): any {
  if (typeof s !== "string") return s ?? {};
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function isConditionalCheckFailed(err: any) {
  return err?.name === "ConditionalCheckFailedException";
}

function isTaskTokenInvalidOrClosed(err: any) {
  const name = String(err?.name || "");
  const msg = String(err?.message || "").toLowerCase();
  return (
    name.includes("TaskTimedOut") ||
    name.includes("InvalidToken") ||
    name.includes("TaskDoesNotExist") ||
    name.includes("ExecutionDoesNotExist") ||
    msg.includes("invalid token") ||
    msg.includes("task does not exist") ||
    msg.includes("timed out")
  );
}

function emitMetric(metricName: string, value: number, unit: "Seconds" | "Count", dims: Record<string, string> = {}) {
  console.log(
    JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: "StylingAdventures/ClosetApprovals",
            Dimensions: [Object.keys(dims)],
            Metrics: [{ Name: metricName, Unit: unit }],
          },
        ],
      },
      ...dims,
      [metricName]: value,
    }),
  );
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
  } catch (err) {
    console.warn("[approve] EventBridge emit failed:", err);
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
  } catch (err) {
    console.warn("[approve] SNS publish failed:", err);
  }
}

async function audit(action: string, approvalId: string, detail: any) {
  const ts = new Date();
  try {
    await ddb.send(
      new PutCommand({
        TableName: AUDIT_TABLE_NAME,
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
  } catch (err) {
    console.warn("[approve] audit write failed:", err);
  }
}

export const handler = async (event: any) => {
  const method = getHttpMethod(event);
  if (method === "OPTIONS") return response(200, { ok: true });

  try {
    const body = safeJsonParse(event?.body);

    const approvalId = body?.approvalId;
    const decision = body?.decision;
    const reason =
      body?.reason ??
      (decision === "APPROVE" ? "Approved by admin" : "Rejected by admin");

    if (!approvalId || !decision) {
      return response(400, { message: "Missing approvalId or decision" });
    }
    if (decision !== "APPROVE" && decision !== "REJECT") {
      return response(400, { message: "decision must be APPROVE or REJECT" });
    }

    const pk = `ITEM#${approvalId}`;
    const sk = "META";

    const { Item } = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
        ConsistentRead: true,
      }),
    );

    if (!Item) return response(404, { message: "Item not found" });

    // Idempotency: safe replay
    if (Item.status !== "PENDING") {
      return response(200, {
        ok: true,
        idempotent: true,
        approvalId,
        status: Item.status,
      });
    }

    const taskToken = Item.taskToken as string | undefined;
    if (!taskToken) {
      return response(409, {
        message: "Missing taskToken (NotifyAdminFn not run yet)",
      });
    }

    // Metrics
    const requestedAt = Item.approvalRequestedAt as string | undefined;
    if (requestedAt) {
      const latencySeconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(requestedAt).getTime()) / 1000),
      );
      emitMetric("ApprovalLatencySeconds", latencySeconds, "Seconds", {
        Outcome: decision === "APPROVE" ? "APPROVED" : "REJECTED",
      });
    }
    emitMetric("ApprovalCount", 1, "Count", {
      Outcome: decision === "APPROVE" ? "APPROVED" : "REJECTED",
    });

    const now = new Date().toISOString();
    const newStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";

    // 1) Resume Step Functions
    let sfnOk = true;
    try {
      await sfn.send(
        new SendTaskSuccessCommand({
          taskToken,
          output: JSON.stringify({ decision, reason }),
        }),
      );
    } catch (err: any) {
      sfnOk = false;
      if (isTaskTokenInvalidOrClosed(err)) {
        console.warn("[approve] task token already closed/invalid; continuing", {
          approvalId,
          err: err?.name || err,
        });
        await audit("ADMIN_DECISION_TOKEN_CLOSED", approvalId, {
          approvalId,
          decision,
          reason,
          at: now,
          error: String(err?.message || err),
        });
      } else {
        console.error("[approve] SendTaskSuccess failed", err);
        await audit("ADMIN_DECISION_SFN_ERROR", approvalId, {
          approvalId,
          decision,
          reason,
          at: now,
          error: String(err?.message || err),
        });
      }
    }

    // 2) Race-safe conditional update
    try {
      await ddb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { [PK_NAME]: pk, [SK_NAME]: sk },
          ConditionExpression: "#s = :pending",
          UpdateExpression: `
            SET #s = :s,
                decidedAt = :t,
                updatedAt = :t,
                decision = :d,
                decisionReason = :r
            REMOVE taskToken, taskTokenExpiresAt
          `,
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: {
            ":pending": "PENDING",
            ":s": newStatus,
            ":t": now,
            ":d": decision,
            ":r": reason,
          },
        }),
      );
    } catch (err: any) {
      if (isConditionalCheckFailed(err)) {
        return response(200, { ok: true, idempotent: true, approvalId });
      }
      throw err;
    }

    // 3) Audit + events + notifications
    await audit(decision === "APPROVE" ? "ADMIN_APPROVE" : "ADMIN_REJECT", approvalId, {
      approvalId,
      decision,
      reason,
      decidedAt: now,
      sfnOk,
    });

    await emit(decision === "APPROVE" ? "ClosetItemApproved" : "ClosetItemRejected", {
      approvalId,
      decision,
      reason,
      decidedAt: now,
      sfnOk,
    });

    await notify("Closet approval decision", `${decision} for ${approvalId}`, {
      approvalId,
      decision,
      reason,
      decidedAt: now,
      sfnOk,
    });

    return response(200, { ok: true, approvalId, status: newStatus, sfnOk });
  } catch (err: any) {
    console.error("[approve] error:", err);
    if (isConditionalCheckFailed(err)) return response(200, { ok: true, idempotent: true });
    return response(500, { message: "Internal error" });
  }
};
