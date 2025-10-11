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
var import_client_sqs = require("@aws-sdk/client-sqs");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var s3 = new import_client_s3.S3Client({});
var sqs = new import_client_sqs.SQSClient({});
var BUCKET = process.env.BUCKET || "";
var ORIGIN = process.env.WEB_ORIGIN || "*";
var QUEUE_URL = process.env.THUMB_QUEUE_URL || "";
var cors = () => ({
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
});
function assertAllowedOrigin(headers) {
  const expected = process.env.WEB_ORIGIN || "";
  if (!expected) return;
  const origin = headers?.origin || headers?.Origin || "";
  const referer = headers?.referer || headers?.Referer || "";
  if (origin.startsWith(expected) || referer.startsWith(expected)) return;
  const err = new Error("Forbidden origin");
  err.statusCode = 403;
  throw err;
}
function ok(body, extraHeaders) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", ...cors(), ...extraHeaders || {} },
    body: typeof body === "string" ? body : JSON.stringify(body)
  };
}
function noContent() {
  return { statusCode: 204, headers: cors(), body: "" };
}
function errResp(status, message) {
  return { statusCode: status, headers: { "Content-Type": "application/json", ...cors() }, body: JSON.stringify({ message }) };
}
var handler = async (event) => {
  try {
    if (!BUCKET) throw Object.assign(new Error("BUCKET env not set"), { statusCode: 500 });
    assertAllowedOrigin(event.headers || {});
    if (event.httpMethod === "OPTIONS") return noContent();
    const claims = event.requestContext.authorizer?.claims;
    const sub = claims?.sub;
    if (!sub) return errResp(401, "Unauthorized");
    if (event.httpMethod === "GET" && event.path.endsWith("/list")) {
      const Prefix = `users/${sub}/`;
      const data = await s3.send(new import_client_s3.ListObjectsV2Command({ Bucket: BUCKET, Prefix }));
      const items = (data.Contents || []).filter((o) => o.Key).map((o) => ({
        key: o.Key,
        size: o.Size ?? 0,
        lastModified: o.LastModified ? o.LastModified.toISOString() : null
      }));
      return ok({ prefix: Prefix, items });
    }
    if (event.httpMethod === "POST" && event.path.endsWith("/presign")) {
      const body = event.body ? JSON.parse(event.body) : {};
      const keyInput = String(body.key || "file.bin");
      const contentType = String(body.contentType || "application/octet-stream");
      const Key = `users/${sub}/${String(keyInput).replace(/^\/*/, "")}`;
      const url = await (0, import_s3_request_presigner.getSignedUrl)(
        s3,
        new import_client_s3.PutObjectCommand({ Bucket: BUCKET, Key, ContentType: contentType }),
        { expiresIn: 900 }
      );
      return ok({ url, key: Key });
    }
    if (event.httpMethod === "DELETE" && event.path.endsWith("/delete")) {
      const key = String(event.queryStringParameters?.key || "");
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) return errResp(403, "Forbidden key");
      await s3.send(new import_client_s3.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return noContent();
    }
    if (event.httpMethod === "POST" && event.path.endsWith("/thumb")) {
      if (!QUEUE_URL) return noContent();
      const body = event.body ? JSON.parse(event.body) : {};
      const key = String(body.key || "");
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) return errResp(403, "Forbidden key");
      await sqs.send(new import_client_sqs.SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({ key })
      }));
      return { statusCode: 202, headers: cors(), body: "" };
    }
    return errResp(404, "Not Found");
  } catch (e) {
    console.error("UPLOADS ERROR", {
      path: event.path,
      method: event.httpMethod,
      headers: event.headers,
      message: e?.message,
      stack: e?.stack
    });
    const status = typeof e?.statusCode === "number" ? e.statusCode : 500;
    return errResp(status, status === 403 ? "Forbidden origin" : e?.message || "Server error");
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
