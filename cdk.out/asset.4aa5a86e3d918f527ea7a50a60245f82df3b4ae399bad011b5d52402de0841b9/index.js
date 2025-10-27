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
var s3 = new import_client_s3.S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  forcePathStyle: true
});
var BUCKET = process.env.BUCKET;
var ORIGIN = process.env.WEB_ORIGIN ?? "https://stylingadventures.com";
var THUMBS_CDN = process.env.THUMBS_CDN;
var corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  Vary: "Origin"
};
function ok(body, extra = {}) {
  return { statusCode: 200, headers: { ...corsHeaders, ...extra }, body: JSON.stringify(body) };
}
function bad(status, msg) {
  return { statusCode: status, headers: corsHeaders, body: JSON.stringify({ message: msg }) };
}
function getMethod(e) {
  return e.httpMethod ?? e.requestContext?.http?.method ?? "GET";
}
function getPath(e) {
  return e.resource ?? e.rawPath ?? e.path ?? "/";
}
function getClaims(e) {
  return e.requestContext?.authorizer?.claims ?? e.requestContext?.authorizer?.jwt?.claims ?? {};
}
function parseBody(e) {
  if (!e.body) return void 0;
  const raw = e.isBase64Encoded ? Buffer.from(e.body, "base64").toString() : e.body;
  try {
    return JSON.parse(raw);
  } catch {
    return void 0;
  }
}
var handler = async (event) => {
  try {
    const method = getMethod(event);
    const path = getPath(event);
    const claims = getClaims(event);
    const userSub = claims?.sub;
    if (method === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
    if (method === "POST" && /\/presign$/.test(path)) {
      const body = parseBody(event);
      if (!body) return bad(400, "Missing body");
      let { key, contentType } = body;
      if (!key || typeof key !== "string") return bad(400, 'Invalid "key"');
      if (!contentType || typeof contentType !== "string") return bad(400, 'Invalid "contentType"');
      if (key.includes("..")) return bad(400, "Illegal key");
      if (userSub && !key.startsWith("users/")) key = `users/${userSub}/${key}`;
      const cmd = new import_client_s3.PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
      const url = await (0, import_s3_request_presigner.getSignedUrl)(s3, cmd, { expiresIn: 900 });
      return ok({ url, key, thumbsCdn: THUMBS_CDN });
    }
    if (method === "DELETE" && /\/delete$/.test(path)) {
      const body = parseBody(event);
      const keyFromQuery = event?.queryStringParameters?.key ? decodeURIComponent(event.queryStringParameters.key) : void 0;
      const key = body?.key ?? keyFromQuery;
      if (!key || typeof key !== "string") return bad(400, 'Invalid "key"');
      if (userSub && !key.startsWith(`users/${userSub}/`)) return bad(403, "Forbidden");
      await s3.send(new import_client_s3.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return ok({ deleted: key });
    }
    return bad(404, "Not Found");
  } catch (e) {
    console.error("handler error", e);
    return bad(500, e?.message ?? "Server error");
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
