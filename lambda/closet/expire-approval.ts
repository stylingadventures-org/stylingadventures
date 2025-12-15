import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const eb = new EventBridgeClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

function isConditionalCheckFailed(err: any) {
  return err?.name === "ConditionalCheckFailedException";
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
    console.warn("[expire-approval] EventBridge put failed:", e);
  }
}

export const handler = async (event: any) => {
  console.log("[expire-approval] event:", JSON.stringify(event));

  const approvalId = event.approvalId || event.itemId || event?.item?.id;
  if (!approvalId) throw new Error("Missing approvalId");

  const pk = `ITEM#${approvalId}`;
  const sk = "META";
  const now = new Date().toISOString();

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
        // Only expire if still pending (idempotency)
        ConditionExpression: "#status = :pending",
        UpdateExpression:
          "SET #status = :expired, decidedAt = :t, updatedAt = :t REMOVE taskToken, taskTokenExpiresAt",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":pending": "PENDING",
          ":expired": "EXPIRED",
          ":t": now,
        },
      }),
    );
  } catch (err: any) {
    if (isConditionalCheckFailed(err)) {
      // Idempotent: already decided/approved/rejected/expired
      console.log("[expire-approval] already decided; no-op", { approvalId });
      return { ok: true, approvalId, idempotent: true };
    }
    console.error("[expire-approval] update failed", err);
    throw err;
  }

  // Optional lightweight counter metric for expirations
  emitMetric("ApprovalExpired", 1, { Outcome: "EXPIRED" });

  await emit("ClosetItemExpired", {
    approvalId,
    expiredAt: now,
    reason: event.reason ?? "Timed out waiting for admin approval",
  });

  return { ok: true, approvalId, status: "EXPIRED" };
};
