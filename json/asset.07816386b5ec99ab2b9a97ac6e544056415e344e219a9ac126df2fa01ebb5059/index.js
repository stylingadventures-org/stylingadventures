"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambda/closet/expire-approval.ts
var expire_approval_exports = {};
__export(expire_approval_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(expire_approval_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var import_client_eventbridge = require("@aws-sdk/client-eventbridge");
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true }
});
var eb = new import_client_eventbridge.EventBridgeClient({});
var TABLE_NAME = process.env.TABLE_NAME;
var PK_NAME = process.env.PK_NAME || "pk";
var SK_NAME = process.env.SK_NAME || "sk";
function isConditionalCheckFailed(err) {
  return err?.name === "ConditionalCheckFailedException";
}
function emitMetric(metricName, value, dims = {}) {
  console.log(
    JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: "StylingAdventures/ClosetApprovals",
            Dimensions: [Object.keys(dims)],
            Metrics: [{ Name: metricName, Unit: "Seconds" }]
          }
        ]
      },
      ...dims,
      [metricName]: value
    })
  );
}
async function emit(detailType, detail) {
  try {
    await eb.send(
      new import_client_eventbridge.PutEventsCommand({
        Entries: [
          {
            Source: "stylingadventures.closet",
            DetailType: detailType,
            Detail: JSON.stringify(detail)
          }
        ]
      })
    );
  } catch (e) {
    console.warn("[expire-approval] EventBridge put failed:", e);
  }
}
var handler = async (event) => {
  console.log("[expire-approval] event:", JSON.stringify(event));
  const approvalId = event.approvalId || event.itemId || event?.item?.id;
  if (!approvalId) throw new Error("Missing approvalId");
  const pk = `ITEM#${approvalId}`;
  const sk = "META";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await ddb.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
        // Only expire if still pending (idempotency)
        ConditionExpression: "#status = :pending",
        UpdateExpression: "SET #status = :expired, decidedAt = :t, updatedAt = :t REMOVE taskToken, taskTokenExpiresAt",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":pending": "PENDING",
          ":expired": "EXPIRED",
          ":t": now
        }
      })
    );
  } catch (err) {
    if (isConditionalCheckFailed(err)) {
      console.log("[expire-approval] already decided; no-op", { approvalId });
      return { ok: true, approvalId, idempotent: true };
    }
    console.error("[expire-approval] update failed", err);
    throw err;
  }
  emitMetric("ApprovalExpired", 1, { Outcome: "EXPIRED" });
  await emit("ClosetItemExpired", {
    approvalId,
    expiredAt: now,
    reason: event.reason ?? "Timed out waiting for admin approval"
  });
  return { ok: true, approvalId, status: "EXPIRED" };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
