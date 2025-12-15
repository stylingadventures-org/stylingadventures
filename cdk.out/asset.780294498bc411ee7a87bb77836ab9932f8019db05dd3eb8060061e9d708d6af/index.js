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
var TOKEN_TTL_SECONDS = 60 * 60 * 24;
var handler = async (event) => {
  console.log("[notify-admin] event:", JSON.stringify(event));
  const token = event.token;
  const item = event.item;
  if (!token || !item?.id) {
    throw new Error("Missing task token or item.id");
  }
  const pk = `ITEM#${item.id}`;
  const sk = "META";
  const now = /* @__PURE__ */ new Date();
  const nowIso = now.toISOString();
  const expiresAt = Math.floor(now.getTime() / 1e3) + TOKEN_TTL_SECONDS;
  try {
    await ddb.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
        // ✅ Don’t clobber terminal decisions.
        // ✅ Don’t overwrite an existing outstanding token.
        ConditionExpression: "attribute_not_exists(taskToken) AND (attribute_not_exists(#status) OR (#status IN (:new, :pending)))",
        UpdateExpression: `
          SET #status = :pending,
              taskToken = :token,
              taskTokenExpiresAt = :exp,
              approvalRequestedAt = :now,
              processedImageKey = :pkey,
              updatedAt = :now
        `,
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":new": "NEW",
          ":pending": "PENDING",
          ":token": token,
          ":exp": expiresAt,
          ":now": nowIso,
          ":pkey": event.processedImageKey ?? null
        }
      })
    );
  } catch (err) {
    if (err?.name === "ConditionalCheckFailedException") {
      console.log("[notify-admin] idempotent/no-op (already has token or terminal status)", {
        approvalId: item.id
      });
      return { ok: true, approvalId: item.id, idempotent: true };
    }
    throw err;
  }
  return { ok: true, approvalId: item.id };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
