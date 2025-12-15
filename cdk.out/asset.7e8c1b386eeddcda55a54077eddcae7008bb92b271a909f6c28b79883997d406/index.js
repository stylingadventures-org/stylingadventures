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

// lambda/closet/publish.ts
var publish_exports = {};
__export(publish_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(publish_exports);
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
    console.warn("[publish] EventBridge put failed:", e);
  }
}
var handler = async (event) => {
  console.log("[publish] incoming event:", JSON.stringify(event));
  const approvalId = event?.item?.id || event?.itemId || event?.closetItemId || event?.admin?.approvalId;
  if (!approvalId) {
    console.warn("[publish] missing approvalId; no-op publish");
    return { ok: false, status: "NO_ID" };
  }
  const pk = `ITEM#${approvalId}`;
  const sk = "META";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const mediaKey = event?.segmentation?.outputKey || event?.processedImageKey || event?.item?.s3Key || null;
  await ddb.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      ConditionExpression: "#status = :approved",
      UpdateExpression: "SET #status = :published, updatedAt = :t, mediaKey = :m",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":approved": "APPROVED",
        ":published": "PUBLISHED",
        ":t": now,
        ":m": mediaKey
      }
    })
  );
  await emit("ClosetItemPublished", {
    approvalId,
    publishedAt: now,
    mediaKey
  });
  return { ok: true, approvalId, status: "PUBLISHED", mediaKey };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
