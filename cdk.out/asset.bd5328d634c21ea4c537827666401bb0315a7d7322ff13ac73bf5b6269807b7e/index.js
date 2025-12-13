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
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}));
var TABLE_NAME = process.env.TABLE_NAME;
var PK_NAME = process.env.PK_NAME || "pk";
var SK_NAME = process.env.SK_NAME || "sk";
function mustGet(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) cur = cur?.[p];
  if (cur === void 0 || cur === null) throw new Error(`Missing required field: ${path}`);
  return cur;
}
var handler = async (event) => {
  console.log("notify-admin start");
  console.log("notify-admin event:", JSON.stringify(event));
  try {
    const taskToken = mustGet(event, "token");
    const item = mustGet(event, "item");
    const approvalId = item.id || item.itemId || item.closetItemId;
    if (!approvalId) {
      throw new Error("Could not determine approvalId from event.item (expected item.id)");
    }
    const pk = `ITEM#${approvalId}`;
    const sk = "META";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await ddb.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
        UpdateExpression: [
          // force status to PENDING (safe even if already pending)
          "SET #status = :pending",
          "    , taskToken = :tok",
          "    , approvalRequestedAt = :now",
          "    , processedImageKey = :pkey",
          "    , updatedAt = :now"
        ].join(" "),
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":pending": "PENDING",
          ":tok": taskToken,
          ":now": now,
          ":pkey": event.processedImageKey ?? null
        }
      })
    );
    console.log("notify-admin wrote taskToken to ddb", { pk, sk });
    return {
      ok: true,
      approvalId
    };
  } catch (err) {
    console.error("notify-admin error", err?.message || err, err);
    throw err;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
