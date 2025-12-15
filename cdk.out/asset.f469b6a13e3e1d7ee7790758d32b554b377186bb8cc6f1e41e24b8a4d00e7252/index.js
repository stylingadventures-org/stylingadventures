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

// lambda/closet/notify-admin.ts
var notify_admin_exports = {};
__export(notify_admin_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(notify_admin_exports);
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
function mustGet(obj, key) {
  const val = obj?.[key];
  if (val === void 0 || val === null) {
    throw new Error(
      `Missing required field: ${key}. Keys present: ${Object.keys(obj || {}).join(", ")}`
    );
  }
  return val;
}
function getApprovalId(item) {
  return item?.id || item?.itemId || item?.closetItemId || item?.approvalId;
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
    console.warn("[notify-admin] EventBridge put failed:", e);
  }
}
var handler = async (event) => {
  console.log("[notify-admin] incoming event:", JSON.stringify(event));
  const taskToken = mustGet(event, "token");
  const item = mustGet(event, "item");
  const approvalId = getApprovalId(item);
  if (!approvalId) {
    throw new Error(
      `Could not determine approvalId. item keys: ${Object.keys(item || {}).join(", ")}`
    );
  }
  const pk = `ITEM#${approvalId}`;
  const sk = "META";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const result = await ddb.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
        // Only set a token if it does not exist yet OR status is not pending (i.e. a fresh cycle)
        ConditionExpression: "attribute_not_exists(taskToken) OR #status <> :pending",
        UpdateExpression: [
          "SET #status = :pending",
          "    , taskToken = :tok",
          "    , approvalRequestedAt = :now",
          "    , processedImageKey = :pkey",
          "    , updatedAt = :now",
          "    , rawInput = :raw"
        ].join(" "),
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":pending": "PENDING",
          ":tok": taskToken,
          ":now": now,
          ":pkey": event.processedImageKey ?? null,
          ":raw": event
        },
        ReturnValues: "ALL_NEW"
      })
    );
    console.log("[notify-admin] ddb ALL_NEW:", JSON.stringify(result.Attributes));
    await emit("ClosetItemPendingReview", {
      approvalId,
      ownerSub: item.ownerSub ?? item.userId ?? null,
      processedImageKey: event.processedImageKey ?? null,
      requestedAt: now
    });
    return { ok: true, approvalId, idempotent: false };
  } catch (err) {
    if (err?.name === "ConditionalCheckFailedException") {
      const existing = await ddb.send(
        new import_lib_dynamodb.GetCommand({
          TableName: TABLE_NAME,
          Key: { [PK_NAME]: pk, [SK_NAME]: sk }
        })
      );
      console.log("[notify-admin] idempotent hit; existing:", JSON.stringify(existing.Item));
      return {
        ok: true,
        approvalId,
        idempotent: true,
        status: existing.Item?.status ?? "UNKNOWN"
      };
    }
    console.error("[notify-admin] unexpected error:", err);
    throw err;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
