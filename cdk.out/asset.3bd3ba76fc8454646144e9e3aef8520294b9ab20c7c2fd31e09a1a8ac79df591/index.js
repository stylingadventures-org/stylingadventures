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
var import_client_s3 = require("@aws-sdk/client-s3");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var s3 = new import_client_s3.S3Client({});
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true }
});
var TABLE_NAME = process.env.TABLE_NAME;
var BUCKET_NAME = process.env.BUCKET_NAME;
var PUBLISHED_PREFIX = process.env.PUBLISHED_PREFIX || "published";
var PK_NAME = process.env.PK_NAME || "pk";
var SK_NAME = process.env.SK_NAME || "sk";
function firstDefined(...vals) {
  for (const v of vals) if (v !== void 0 && v !== null) return v;
  return void 0;
}
function stripLeadingSlashes(key) {
  return String(key || "").replace(/^\/+/, "");
}
function baseName(key) {
  const k = stripLeadingSlashes(key);
  const parts = k.split("/");
  return parts[parts.length - 1] || k;
}
function resolveItem(event) {
  return event?.item ?? event ?? {};
}
function resolveApprovalId(item) {
  const id = firstDefined(item?.id, item?.itemId, item?.closetItemId);
  if (!id) {
    throw new Error(
      `publish: missing item id. expected item.id|item.itemId|item.closetItemId. keys=${Object.keys(
        item || {}
      ).join(",")}`
    );
  }
  return id;
}
function resolveBestSourceKey(event, item) {
  const segKey = firstDefined(event?.segmentation?.outputKey, event?.processedImageKey);
  if (segKey) return stripLeadingSlashes(segKey);
  const k = firstDefined(item?.s3Key, item?.rawMediaKey, event?.s3Key, event?.rawMediaKey);
  return k ? stripLeadingSlashes(k) : void 0;
}
async function objectExists(bucket, key) {
  try {
    await s3.send(new import_client_s3.HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}
async function copyToPublished({
  bucket,
  sourceKey,
  approvalId
}) {
  const filename = baseName(sourceKey);
  const destKey = stripLeadingSlashes(`${PUBLISHED_PREFIX}/${approvalId}/${filename}`);
  const exists = await objectExists(bucket, sourceKey);
  if (!exists) {
    throw new Error(`publish: source object not found in s3: s3://${bucket}/${sourceKey}`);
  }
  await s3.send(
    new import_client_s3.CopyObjectCommand({
      Bucket: bucket,
      Key: destKey,
      CopySource: `${bucket}/${encodeURIComponent(sourceKey)}`.replace(/%2F/g, "/"),
      MetadataDirective: "COPY"
    })
  );
  return destKey;
}
async function updateDdbRecord({
  pk,
  sk,
  mediaKey,
  rawMediaKey,
  approvalId,
  extra
}) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const UpdateExpressionParts = [
    "SET #status = :published",
    "#updatedAt = :now",
    "#mediaKey = :mediaKey"
  ];
  const ExpressionAttributeNames = {
    "#status": "status",
    "#updatedAt": "updatedAt",
    "#mediaKey": "mediaKey"
  };
  const ExpressionAttributeValues = {
    ":published": "PUBLISHED",
    ":now": now,
    ":mediaKey": mediaKey
  };
  if (rawMediaKey) {
    UpdateExpressionParts.push("#rawMediaKey = :rawMediaKey");
    ExpressionAttributeNames["#rawMediaKey"] = "rawMediaKey";
    ExpressionAttributeValues[":rawMediaKey"] = rawMediaKey;
  }
  UpdateExpressionParts.push("REMOVE taskToken");
  UpdateExpressionParts.push("#publishedAt = :now");
  ExpressionAttributeNames["#publishedAt"] = "publishedAt";
  UpdateExpressionParts.push("#publishMeta = :meta");
  ExpressionAttributeNames["#publishMeta"] = "publishMeta";
  ExpressionAttributeValues[":meta"] = {
    approvalId,
    publishedAt: now,
    ...extra
  };
  const resp = await ddb.send(
    new import_lib_dynamodb.UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      UpdateExpression: UpdateExpressionParts.join(", "),
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "ALL_NEW"
    })
  );
  return resp.Attributes;
}
var handler = async (event) => {
  console.log("[publish] incoming event:", JSON.stringify(event));
  const item = resolveItem(event);
  const approvalId = resolveApprovalId(item);
  const rawMediaKey = firstDefined(item?.rawMediaKey, event?.rawMediaKey, item?.s3Key, event?.s3Key) ?? null;
  const sourceKey = resolveBestSourceKey(event, item);
  if (!sourceKey) {
    throw new Error(
      `publish: missing source key (expected segmentation.outputKey or item.s3Key/rawMediaKey). itemKeys=${Object.keys(
        item || {}
      ).join(",")}`
    );
  }
  let publishedKey = sourceKey;
  let copyDidRun = false;
  if (BUCKET_NAME) {
    try {
      publishedKey = await copyToPublished({ bucket: BUCKET_NAME, sourceKey, approvalId });
      copyDidRun = true;
    } catch (err) {
      console.warn("[publish] copyToPublished failed, continuing with sourceKey", {
        approvalId,
        sourceKey,
        error: err?.message || String(err)
      });
      publishedKey = sourceKey;
    }
  } else {
    console.warn("[publish] BUCKET_NAME not set; skipping S3 copy. Using sourceKey as mediaKey.");
  }
  const ddbTargets = [
    { pk: `ITEM#${approvalId}`, sk: "META" },
    { pk: `CLOSET#${approvalId}`, sk: `CLOSET#${approvalId}` }
  ];
  const updates = [];
  for (const t of ddbTargets) {
    try {
      const attrs = await updateDdbRecord({
        pk: t.pk,
        sk: t.sk,
        mediaKey: publishedKey,
        rawMediaKey,
        approvalId,
        extra: {
          sourceKey,
          publishedKey,
          copyDidRun
        }
      });
      updates.push({ ...t, ok: true, status: attrs?.status, mediaKey: attrs?.mediaKey });
    } catch (err) {
      console.warn("[publish] ddb update failed", {
        pk: t.pk,
        sk: t.sk,
        error: err?.message || String(err)
      });
      updates.push({ ...t, ok: false, error: err?.message || String(err) });
    }
  }
  const ok = updates.some((u) => u.ok);
  if (!ok) {
    throw new Error(`publish: failed to update DynamoDB for approvalId=${approvalId}`);
  }
  return {
    ok: true,
    approvalId,
    status: "PUBLISHED",
    sourceKey,
    publishedKey,
    copyDidRun,
    ddb: updates.map((u) => ({ pk: u.pk, sk: u.sk, ok: u.ok }))
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
