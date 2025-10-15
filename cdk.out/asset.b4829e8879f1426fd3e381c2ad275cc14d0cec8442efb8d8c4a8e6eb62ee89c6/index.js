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
var import_client_sqs = require("@aws-sdk/client-sqs");
var s3 = new import_client_s3.S3Client({});
var sqs = new import_client_sqs.SQSClient({});
var BUCKET = process.env.BUCKET || "";
var THUMBS_CDN = process.env.THUMBS_CDN || "";
var QUEUE_URL = process.env.THUMB_QUEUE_URL || "";
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token,X-Api-Key",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
};
var json = (x) => typeof x === "string" ? x : JSON.stringify(x);
var ok = (data, statusCode = 200) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  body: json(data)
});
var txt = (text = "", statusCode = 200) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: text
});
var err = (message, statusCode = 500) => ok({ message }, statusCode);
var handler = async (event) => {
  if ((event.httpMethod || "").toUpperCase() === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  try {
    if (!BUCKET) return err("Server misconfigured: missing BUCKET", 500);
    const method = (event.httpMethod || "GET").toUpperCase();
    const path = (event.path || "").toLowerCase();
    const sub = event?.requestContext?.authorizer?.claims?.sub;
    if (!sub) return err("Unauthorized", 401);
    if (method === "GET" && path.endsWith("/list")) {
      const Prefix = `users/${sub}/`;
      const data = await s3.send(
        new import_client_s3.ListObjectsV2Command({ Bucket: BUCKET, Prefix })
      );
      const items = await Promise.all(
        (data.Contents || []).filter((o) => o.Key).map(async (o) => {
          const key = o.Key;
          const viewUrl = await (0, import_s3_request_presigner.getSignedUrl)(
            s3,
            new import_client_s3.GetObjectCommand({ Bucket: BUCKET, Key: key }),
            { expiresIn: 900 }
          );
          let thumbUrl;
          if (THUMBS_CDN) {
            const baseName = key.replace(`users/${sub}/`, "");
            thumbUrl = `${THUMBS_CDN}/thumbs/${sub}/${baseName}`.replace(
              /\.(png|gif|webp|avif)$/i,
              ".jpg"
            );
          }
          return {
            key,
            size: o.Size ?? 0,
            lastModified: o.LastModified ? o.LastModified.toISOString() : null,
            viewUrl,
            ...thumbUrl ? { thumbUrl } : {}
          };
        })
      );
      return ok({ prefix: Prefix, items });
    }
    if (method === "POST" && path.endsWith("/presign")) {
      const body = event.body ? JSON.parse(event.body) : {};
      const keyInput = String(body.key || "file.bin");
      const contentType = String(
        body.contentType || "application/octet-stream"
      );
      const Key = `users/${sub}/${keyInput.replace(/^\/*/, "")}`;
      const url = await (0, import_s3_request_presigner.getSignedUrl)(
        s3,
        new import_client_s3.PutObjectCommand({ Bucket: BUCKET, Key, ContentType: contentType }),
        { expiresIn: 900 }
      );
      return ok({ url, key: Key, headers: { "Content-Type": contentType } });
    }
    if (method === "DELETE" && path.endsWith("/delete")) {
      const key = String(event.queryStringParameters?.key || "");
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) return err("Forbidden key", 403);
      await s3.send(new import_client_s3.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return txt("", 204);
    }
    if (method === "POST" && path.endsWith("/thumb")) {
      const body = event.body ? JSON.parse(event.body) : {};
      const key = String(body.key || "");
      const expectedPrefix = `users/${sub}/`;
      if (!key.startsWith(expectedPrefix)) return err("Forbidden key", 403);
      if (QUEUE_URL) {
        await sqs.send(
          new import_client_sqs.SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({ key })
          })
        );
      }
      return txt("", 202);
    }
    return err("Not found", 404);
  } catch (e) {
    console.error("UPLOADS ERROR", {
      path: event.path,
      method: event.httpMethod,
      headers: event.headers,
      message: e?.message,
      stack: e?.stack
    });
    return err(e?.message || "Internal server error", 500);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
