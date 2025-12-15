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
  if (val === void 0 || val === null) {
    throw new Error(
      `Missing required field: ${key}. Keys present: ${Object.keys(obj || {}).join(", ")}`
    );
  }
  return val;
}
function pickFirst(...vals) {
  for (const v of vals) {
    if (v !== void 0 && v !== null && v !== "") return v;
  }
  return void 0;
}
var handler = async (event) => {
  console.log("[notify-admin] incoming event:", JSON.stringify(event));
  const taskToken = mustGet(event, "token");
  const item = mustGet(event, "item");
  const approvalId = pickFirst(item.id, item.itemId, item.closetItemId);
  if (!approvalId) {
    throw new Error(
      `Could not determine approvalId (expected item.id/itemId/closetItemId). item keys: ${Object.keys(
        item || {}
      ).join(", ")}`
    );
  }
  const ownerSub = pickFirst(item.ownerSub, item.userId, item.sub);
  const userId = pickFirst(item.userId, item.ownerSub);
  const s3Key = pickFirst(item.s3Key, item.rawMediaKey);
  if (!s3Key) {
    throw new Error(
      `Missing upload key (expected item.s3Key or item.rawMediaKey). item keys: ${Object.keys(
        item || {}
      ).join(", ")}`
    );
  }
  const pk = `ITEM#${approvalId}`;
  const sk = "META";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const processedImageKey = event.processedImageKey ?? event.segmentation?.outputKey ?? null;
  console.log("[notify-admin] writing token to ddb", {
    table: TABLE_NAME,
    pk,
    sk,
    tokenLen: taskToken.length,
    processedImageKey
  });
  const update = await ddb.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      // Keep your admin queue/index consistent:
      // status=PENDING AND gsi2pk=STATUS#PENDING
      UpdateExpression: [
        "SET #status = :pending",
        "  , gsi2pk = :gsi2pk",
        "  , gsi2sk = :gsi2sk",
        "  , taskToken = :tok",
        "  , approvalRequestedAt = :now",
        "  , processedImageKey = :pkey",
        "  , updatedAt = :now",
        "  , approvalId = :approvalId",
        "  , ownerSub = :ownerSub",
        "  , userId = :userId",
        "  , rawMediaKey = :rawMediaKey",
        "  , rawInput = :raw",
        "REMOVE decidedAt, decision, reason"
      ].join(" "),
      ExpressionAttributeNames: {
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":pending": "PENDING",
        ":gsi2pk": "STATUS#PENDING",
        ":gsi2sk": now,
        ":tok": taskToken,
        ":now": now,
        ":pkey": processedImageKey,
        ":approvalId": approvalId,
        ":ownerSub": ownerSub ?? null,
        ":userId": userId ?? null,
        ":rawMediaKey": s3Key,
        ":raw": event
      },
      ReturnValues: "ALL_NEW"
    })
  );
  console.log("[notify-admin] ddb ALL_NEW:", JSON.stringify(update.Attributes));
  return { ok: true, approvalId };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
