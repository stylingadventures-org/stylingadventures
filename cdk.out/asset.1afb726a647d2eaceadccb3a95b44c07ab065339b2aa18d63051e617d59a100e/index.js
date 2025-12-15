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
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true }
});
var TABLE_NAME = process.env.TABLE_NAME;
var PK_NAME = process.env.PK_NAME || "pk";
var SK_NAME = process.env.SK_NAME || "sk";
function mustGet(obj, key) {
  const val = obj?.[key];
  if (val === void 0 || val === null || val === "") {
    throw new Error(
      `Missing required field: ${key}. Keys present: ${Object.keys(obj || {}).join(", ")}`
    );
  }
  return val;
}
function pickApprovalId(item) {
  return item?.id || item?.itemId || item?.closetItemId || item?.approvalId;
}
function resolveDdbKey(item, approvalId) {
  const itemPk = item?.[PK_NAME] || item?.pk;
  const itemSk = item?.[SK_NAME] || item?.sk;
  if (itemPk && itemSk) {
    return { pk: itemPk, sk: itemSk };
  }
  const type = String(item?.type || item?.entityType || "").toUpperCase();
  if (type === "CLOSET") {
    const k = `CLOSET#${approvalId}`;
    return { pk: k, sk: k };
  }
  return { pk: `ITEM#${approvalId}`, sk: "META" };
}
var handler = async (event) => {
  console.log("[notify-admin] incoming event:", JSON.stringify(event));
  const taskToken = mustGet(event, "token");
  const item = mustGet(event, "item");
  const approvalId = pickApprovalId(item);
  if (!approvalId) {
    throw new Error(
      `Could not determine approvalId (expected item.id/itemId/closetItemId). item keys: ${Object.keys(
        item || {}
      ).join(", ")}`
    );
  }
  const { pk, sk } = resolveDdbKey(item, approvalId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const processedImageKey = event?.processedImageKey ?? event?.segmentation?.outputKey ?? event?.segmentationBg?.outputKey ?? null;
  console.log("[notify-admin] writing token to ddb", {
    table: TABLE_NAME,
    pk,
    sk,
    tokenLen: taskToken.length,
    processedImageKey
  });
  const result = await ddb.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      UpdateExpression: [
        "SET #status = :pending",
        "    , taskToken = :tok",
        "    , approvalRequestedAt = :now",
        "    , processedImageKey = :pkey",
        "    , updatedAt = :now",
        "    , rawInput = :raw",
        "    , approvalId = :aid"
      ].join(" "),
      ExpressionAttributeNames: {
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":pending": "PENDING",
        ":tok": taskToken,
        ":now": now,
        ":pkey": processedImageKey,
        ":raw": event,
        ":aid": approvalId
      },
      ReturnValues: "ALL_NEW"
    })
  );
  console.log("[notify-admin] ddb ALL_NEW:", JSON.stringify(result.Attributes));
  return { ok: true, approvalId, pk, sk };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
