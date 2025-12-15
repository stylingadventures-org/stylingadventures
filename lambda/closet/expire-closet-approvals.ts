import { SFNClient, SendTaskSuccessCommand } from "@aws-sdk/client-sfn";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sfn = new SFNClient({});
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

const MAX_PER_RUN = Number(process.env.MAX_PER_RUN || "25");

function nowIso() {
  return new Date().toISOString();
}

function isConditionalCheckFailed(err: any) {
  return err?.name === "ConditionalCheckFailedException";
}

function isTaskTokenInvalidOrClosed(err: any) {
  const name = err?.name || "";
  const msg = String(err?.message || "");
  // AWS SFN common cases:
  // - TaskTimedOut (token expired by StepFn)
  // - InvalidToken / InvalidTokenException
  // - TaskDoesNotExist / TaskDoesNotExistException
  // - ExecutionDoesNotExist / ExecutionDoesNotExistException
  return (
    name.includes("TaskTimedOut") ||
    name.includes("InvalidToken") ||
    name.includes("TaskDoesNotExist") ||
    name.includes("ExecutionDoesNotExist") ||
    msg.toLowerCase().includes("invalid token") ||
    msg.toLowerCase().includes("task does not exist") ||
    msg.toLowerCase().includes("timed out")
  );
}

function emitMetric(metricName: string, value: number, dims: Record<string, string> = {}) {
  // CloudWatch Embedded Metric Format (EMF)
  console.log(
    JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: "StylingAdventures/ClosetApprovals",
            Dimensions: [Object.keys(dims)],
            Metrics: [{ Name: metricName, Unit: "Seconds" }],
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
  } catch (e) {
    console.warn("[expire] EventBridge put failed:", e);
  }
}

async function notify(message: string, detail: any) {
  if (!NOTIFY_TOPIC_ARN) return;
  try {
    await sns.send(
      new PublishCommand({
        TopicArn: NOTIFY_TOPIC_ARN,
        Subject: "Closet approval expired",
        Message: `${message}\n\n${JSON.stringify(detail, null, 2)}`,
      }),
    );
  } catch (e) {
    console.warn("[expire] SNS publish failed:", e);
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
    console.warn("[expire] audit write failed:", e);
  }
}

export const handler = async () => {
  const now = Math.floor(Date.now() / 1000);
  const startedAt = nowIso();

  console.log("[expire] start", { now, MAX_PER_RUN });

  // NOTE: Scan is simplest. If this grows, add a GSI later (status + expiresAt).
  const scan = await ddb.send(
    new ScanCommand({
      TableName: APP_TABLE,
      FilterExpression:
        "#s = :pending AND attribute_exists(taskToken) AND attribute_exists(taskTokenExpiresAt) AND taskTokenExpiresAt <= :now",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":pending": "PENDING",
        ":now": now,
      },
      Limit: MAX_PER_RUN,
    }),
  );

  const items = scan.Items ?? [];
  console.log("[expire] candidates", { count: items.length });

  let expired = 0;
  let skipped = 0;
  let errors = 0;

  for (const it of items) {
    const pk = it[PK_NAME];
    const sk = it[SK_NAME];
    const approvalId = String(it.id || pk?.replace("ITEM#", "") || "");
    const taskToken = it.taskToken as string | undefined;

    if (!pk || !sk || !approvalId || !taskToken) {
      skipped++;
      continue;
    }

    const decidedAt = nowIso();
    const reason = "Approval token expired";

    // 1) First try to resume StepFn
    try {
      await sfn.send(
        new SendTaskSuccessCommand({
          taskToken,
          output: JSON.stringify({ decision: "REJECT", reason }),
        }),
      );
    } catch (err: any) {
      // If token is already closed/invalid, do NOT kill the run; still mark the record.
      if (!isTaskTokenInvalidOrClosed(err)) {
        console.error("[expire] SendTaskSuccess failed", { approvalId, err });
        errors++;
        await audit("AUTO_EXPIRE_SFN_ERROR", approvalId, {
          pk,
          sk,
          decidedAt,
          reason,
          error: String(err?.message || err),
        });
        // continue trying to update the item anyway
      } else {
        console.log("[expire] token already closed/invalid; continuing", { approvalId });
        await audit("AUTO_EXPIRE_TOKEN_CLOSED", approvalId, {
          pk,
          sk,
          decidedAt,
          reason,
          note: "Task token already closed/invalid",
        });
      }
    }

    // 2) Race-safe conditional update: only if still pending
    try {
      await ddb.send(
        new UpdateCommand({
          TableName: APP_TABLE,
          Key: { [PK_NAME]: pk, [SK_NAME]: sk },
          ConditionExpression: "#s = :pending",
          UpdateExpression: `
            SET #s = :rejected,
                decidedAt = :t,
                updatedAt = :t
            REMOVE taskToken, taskTokenExpiresAt
          `,
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: {
            ":pending": "PENDING",
            ":rejected": "REJECTED",
            ":t": decidedAt,
          },
        }),
      );
    } catch (err: any) {
      if (isConditionalCheckFailed(err)) {
        console.log("[expire] already decided", { approvalId });
        skipped++;
        continue;
      }
      console.error("[expire] update failed", { approvalId, err });
      errors++;
      await audit("AUTO_EXPIRE_UPDATE_ERROR", approvalId, {
        pk,
        sk,
        decidedAt,
        reason,
        error: String(err?.message || err),
      });
      continue;
    }

    // 3) Emit metric for approval latency (metric related to the expired item)
    const latencySeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(it.createdAt).getTime()) / 1000),
    );

    emitMetric("ApprovalLatencySeconds", latencySeconds, {
      Outcome: "EXPIRED",
    });

    // 4) Emit + notify + audit success
    await audit("AUTO_EXPIRE_REJECT", approvalId, { pk, sk, decidedAt, reason });

    await emit("ClosetItemAutoExpired", {
      approvalId,
      pk,
      sk,
      decidedAt,
      reason,
    });

    await notify(`Auto-rejected expired approval: ${approvalId}`, {
      approvalId,
      pk,
      sk,
      decidedAt,
      reason,
    });

    expired++;
  }

  const result = {
    ok: true,
    startedAt,
    expired,
    skipped,
    errors,
    scanned: items.length,
  };
  console.log("[expire] done", result);
  return result;
};
