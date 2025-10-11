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

// lambda/presign/index.ts
var presign_exports = {};
__export(presign_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(presign_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var s3 = new import_client_s3.S3Client({});
var BUCKET = process.env.BUCKET;
var ORIGIN = process.env.WEB_ORIGIN || "*";
var cors = () => ({
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Vary": "Origin"
});
function assertAllowedOrigin(headers) {
  const expected = process.env.WEB_ORIGIN ?? "";
  if (!expected) return;
  const origin = headers?.origin || headers?.Origin || "";
  const referer = headers?.referer || headers?.Referer || "";
  const ok = origin.startsWith(expected) || referer.startsWith(expected);
  if (!ok) {
    const err = new Error("Forbidden origin");
    err.statusCode = 403;
    throw err;
  }
}
function sanitizeUserKey(raw) {
  const k = String(raw || "").replace(/^\/*/, "");
  if (k.includes("..")) throw Object.assign(new Error("Invalid key"), { statusCode: 400 });
  if (k.length > 1024) throw Object.assign(new Error("Key too long"), { statusCode: 400 });
  return k;
}
var handler = async (event) => {
  try {
    assertAllowedOrigin(event.headers || {});
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: cors(), body: "" };
    }
    const claims = event.requestContext.authorizer?.claims;
    const sub = claims?.sub;
    if (!sub) return { statusCode: 401, headers: cors(), body: "Unauthorized" };
    if (event.httpMethod === "GET" && event.path.endsWith("/list")) {
      const qp = event.queryStringParameters || {};
      const childPrefix = qp.prefix ? sanitizeUserKey(qp.prefix) : "";
      const Prefix = `users/${sub}/${childPrefix}`;
      const items = [];
      let ContinuationToken;
      do {
        const out = await s3.send(new import_client_s3.ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix,
          ContinuationToken
        }));
        for (const o of out.Contents || []) if (o.Key) items.push(o.Key);
        ContinuationToken = out.IsTruncated ? out.NextContinuationToken : void 0;
      } while (ContinuationToken);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", ...cors() },
        body: JSON.stringify({ prefix: Prefix, items })
      };
    }
    if (event.httpMethod === "POST" && event.path.endsWith("/presign")) {
      const body = event.body ? JSON.parse(event.body) : {};
      const keyInput = sanitizeUserKey(body.key || "file.bin");
      const contentType = String(body.contentType || "application/octet-stream");
      const Key = `users/${sub}/${keyInput}`;
      const url = await (0, import_s3_request_presigner.getSignedUrl)(
        s3,
        new import_client_s3.PutObjectCommand({ Bucket: BUCKET, Key, ContentType: contentType }),
        { expiresIn: 900 }
      );
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", ...cors() },
        body: JSON.stringify({ url, key: Key })
      };
    }
    if (event.httpMethod === "DELETE" && event.path.endsWith("/delete")) {
      const qp = event.queryStringParameters || {};
      const raw = (qp.key ?? "").toString();
      const key = sanitizeUserKey(decodeURIComponent(raw));
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) {
        return { statusCode: 403, headers: cors(), body: "Forbidden key" };
      }
      await s3.send(new import_client_s3.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return { statusCode: 204, headers: cors(), body: "" };
    }
    return { statusCode: 404, headers: cors(), body: "Not Found" };
  } catch (e) {
    console.error(e);
    const status = typeof e?.statusCode === "number" ? e.statusCode : 500;
    const message = status === 403 ? "Forbidden origin" : status === 400 ? e?.message || "Bad request" : "Server error";
    return { statusCode: status, headers: cors(), body: message };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
