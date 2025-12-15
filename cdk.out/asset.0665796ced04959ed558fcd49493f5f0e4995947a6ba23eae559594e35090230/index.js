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
function isDdbAttrValue(x) {
  return x && typeof x === "object" && ("S" in x || "N" in x || "BOOL" in x);
}
function unwrapMaybeAttrValue(x) {
  if (!isDdbAttrValue(x)) return x;
  if (typeof x.S === "string") return x.S;
  if (typeof x.N === "string") return Number(x.N);
  if (typeof x.BOOL === "boolean") return x.BOOL;
  return x;
}
function unwrapPayloadDeep(obj, maxDepth = 5) {
  let cur = obj;
  for (let i = 0; i < maxDepth; i++) {
    if (!cur || typeof cur !== "object") break;
    if (cur.Payload && typeof cur.Payload === "object") {
      cur = cur.Payload;
      continue;
    }
    if (cur.body && typeof cur.body === "string") {
      try {
        cur = JSON.parse(cur.body);
        continue;
      } catch {
        break;
      }
    }
    break;
  }
  return cur;
}
function findFirstStringByKeysDeep(obj, keys, maxNodes = 2e3) {
  const seen = /* @__PURE__ */ new Set();
  const stack = [obj];
  let visited = 0;
  while (stack.length && visited < maxNodes) {
    const cur = stack.pop();
    visited++;
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const k of keys) {
      if (k in cur) {
        const v = unwrapMaybeAttrValue(cur[k]);
        if (typeof v === "string" && v.trim().length > 0) return v;
      }
    }
    for (const v of Object.values(cur)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return void 0;
}
function getApprovalId(event) {
  const direct = unwrapMaybeAttrValue(event?.item?.id) || unwrapMaybeAttrValue(event?.itemId) || unwrapMaybeAttrValue(event?.closetItemId) || unwrapMaybeAttrValue(event?.approvalId) || unwrapMaybeAttrValue(event?.admin?.approvalId);
  if (typeof direct === "string" && direct.trim()) return direct;
  const unwrapped = unwrapPayloadDeep(event);
  const deep = findFirstStringByKeysDeep(unwrapped, ["approvalId", "id", "itemId", "closetItemId"]);
  return deep;
}
function pickMediaKey(event) {
  const e = unwrapPayloadDeep(event);
  const candidates = [
    // current SM output shape (payloadResponseOnly = true)
    e?.segmentation?.outputKey,
    // older / wrapper shapes
    e?.segmentation?.Payload?.outputKey,
    // if someone passes it directly
    e?.processedImageKey,
    // fallback raw
    e?.item?.s3Key
  ].map(unwrapMaybeAttrValue);
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }
  return null;
}
function isConditionalCheckFailed(err) {
  return err?.name === "ConditionalCheckFailedException";
}
var handler = async (event) => {
  console.log("[publish] incoming event:", JSON.stringify(event));
  const approvalId = getApprovalId(event);
  if (!approvalId) {
    console.warn("[publish] missing approvalId; event shape unexpected");
    return { ok: false, status: "NO_ID" };
  }
  const pk = `ITEM#${approvalId}`;
  const sk = "META";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const mediaKey = pickMediaKey(event);
  const current = await ddb.send(
    new import_lib_dynamodb.GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      ConsistentRead: true
    })
  );
  if (!current.Item) {
    console.warn("[publish] META not found:", { approvalId, pk, sk });
    return { ok: false, status: "NOT_FOUND", approvalId };
  }
  const currentStatus = unwrapMaybeAttrValue(current.Item.status);
  if (currentStatus === "PUBLISHED") {
    return { ok: true, approvalId, status: "PUBLISHED", mediaKey: current.Item.mediaKey ?? null, idempotent: true };
  }
  if (currentStatus !== "APPROVED") {
    console.warn("[publish] cannot publish because status != APPROVED:", { approvalId, currentStatus });
    return { ok: false, status: "NOT_APPROVED", approvalId, currentStatus };
  }
  try {
    await ddb.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
        ConditionExpression: "#status = :approved",
        UpdateExpression: "SET #status = :published, publishedAt = :t, updatedAt = :t, mediaKey = :m",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":approved": "APPROVED",
          ":published": "PUBLISHED",
          ":t": now,
          ":m": mediaKey
        }
      })
    );
  } catch (err) {
    if (isConditionalCheckFailed(err)) {
      return { ok: true, approvalId, status: "PUBLISHED", idempotent: true };
    }
    console.error("[publish] ddb update failed:", err);
    throw err;
  }
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
