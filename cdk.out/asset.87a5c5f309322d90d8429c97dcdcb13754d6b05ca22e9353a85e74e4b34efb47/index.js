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
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true }
});
var TABLE_NAME = process.env.TABLE_NAME;
var PK_NAME = process.env.PK_NAME || "pk";
var SK_NAME = process.env.SK_NAME || "sk";
function pickItemId(event) {
  return event?.item?.id || event?.item?.itemId || event?.item?.closetItemId || event?.id || event?.itemId || event?.closetItemId || null;
}
var handler = async (event) => {
  console.log("[publish] incoming event:", JSON.stringify(event));
  const closetItemId = pickItemId(event);
  if (!closetItemId) {
    throw new Error(`[publish] Missing closet item id (expected event.item.id or event.id)`);
  }
  const pk = `ITEM#${closetItemId}`;
  const sk = "META";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const processedImageKey = event?.processedImageKey ?? event?.segmentation?.outputKey ?? event?.segmentationBg?.outputKey ?? null;
  const current = await ddb.send(
    new import_lib_dynamodb.GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk }
    })
  );
  const item = current.Item || {};
  const mediaKeyMissing = !item.mediaKey || item.mediaKey === "";
  const fallbackMediaKey = item.mediaKey || processedImageKey || item.rawMediaKey || item.s3Key || event?.item?.rawMediaKey || event?.item?.s3Key || null;
  let UpdateExpression = "SET #status = :published, #updatedAt = :now, publishedAt = if_not_exists(publishedAt, :now)";
  const ExpressionAttributeNames = {
    "#status": "status",
    "#updatedAt": "updatedAt"
  };
  const ExpressionAttributeValues = {
    ":published": "PUBLISHED",
    ":now": now
  };
  if (mediaKeyMissing && fallbackMediaKey) {
    UpdateExpression += ", mediaKey = :mediaKey";
    ExpressionAttributeValues[":mediaKey"] = fallbackMediaKey;
  }
  if (processedImageKey) {
    UpdateExpression += ", processedImageKey = :pkey";
    ExpressionAttributeValues[":pkey"] = processedImageKey;
  }
  const updateResp = await ddb.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "ALL_NEW"
    })
  );
  console.log("[publish] updated item:", JSON.stringify(updateResp.Attributes));
  return {
    ok: true,
    id: closetItemId,
    status: "PUBLISHED",
    ...updateResp.Attributes
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
