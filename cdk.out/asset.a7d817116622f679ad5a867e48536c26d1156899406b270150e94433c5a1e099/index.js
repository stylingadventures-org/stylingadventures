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
var TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS || 60 * 60 * 24);
var EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;
var EVENT_SOURCE = process.env.EVENT_SOURCE || "stylingadventures.closet";
function mustGet(obj, key) {
  const val = obj?.[key];
  if (val === void 0 || val === null) {
    throw new Error(
      `Missing required field: ${key}. Keys present: ${Object.keys(obj || {}).join(", ")}`
    );
  }
  return val;
}
async function emit(detailType, detail) {
  try {
    await eb.send(
      new import_client_eventbridge.PutEventsCommand({
        Entries: [
          {
            EventBusName: EVENT_BUS_NAME || void 0,
            Source: EVENT_SOURCE,
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
  const token = mustGet(event, "token");
  const item = mustGet(event, "item");
  const approvalId = item.id || item.itemId || item.closetItemId;
  if (!approvalId) {
    throw new Error(
      `Could not determine approvalId. Expected item.id (or itemId/closetItemId). item keys: ${Object.keys(
        item || {}
      ).join(", ")}`
    );
  }
  const pk = `ITEM#${approvalId}`;
  const sk = "META";
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const expiresAt = Math.floor(Date.now() / 1e3) + TOKEN_TTL_SECONDS;
  const condition = [
    "attribute_not_exists(#status)",
    "OR (",
    "  #status <> :approved",
    "  AND #status <> :rejected",
    "  AND #status <> :published",
    ")"
  ].join(" ");
  console.log("[notify-admin] saving token", {
    table: TABLE_NAME,
    pk,
    sk,
    tokenLen: token.length,
    expiresAt,
    processedImageKey: event.processedImageKey
  });
  await ddb.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      ConditionExpression: condition,
      UpdateExpression: [
        "SET #status = :pending",
        "    , taskToken = :token",
        "    , taskTokenExpiresAt = :exp",
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
        ":token": token,
        ":exp": expiresAt,
        ":now": nowIso,
        ":pkey": event.processedImageKey ?? null,
        ":raw": event,
        // terminal guards
        ":approved": "APPROVED",
        ":rejected": "REJECTED",
        ":published": "PUBLISHED"
      }
    })
  );
  await emit("ClosetItemPendingApproval", {
    approvalId,
    pk,
    sk,
    processedImageKey: event.processedImageKey ?? null,
    taskTokenExpiresAt: expiresAt,
    requestedAt: nowIso,
    // keep it small; rawInput already stored in DDB
    ownerSub: item.ownerSub ?? item.userId ?? null
  });
  return { ok: true, approvalId, taskTokenExpiresAt: expiresAt };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
