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

// lambda/list/index.ts
var list_exports = {};
__export(list_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(list_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var s3 = new import_client_s3.S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  forcePathStyle: true
});
var BUCKET = process.env.BUCKET;
var ORIGIN = process.env.WEB_ORIGIN;
var cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Content-Type": "application/json",
  Vary: "Origin"
};
var handler = async (event) => {
  if ((event?.httpMethod || event?.requestContext?.http?.method) === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  try {
    const claims = event?.requestContext?.authorizer?.claims ?? event?.requestContext?.authorizer?.jwt?.claims ?? {};
    const sub = claims?.sub;
    const queryPrefix = (event?.queryStringParameters?.prefix ?? "").replace(/\.\./g, "").replace(/^[/\\]+/, "");
    const userPrefix = sub ? `users/${sub}/` : "";
    const prefix = `${userPrefix}${queryPrefix}`;
    const res = await s3.send(
      new import_client_s3.ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix || void 0,
        MaxKeys: 1e3
      })
    );
    const items = (res.Contents ?? []).map((o) => ({
      key: o.Key,
      size: o.Size,
      lastModified: o.LastModified?.toISOString?.() ?? null
    }));
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        prefix,
        items,
        isTruncated: !!res.IsTruncated,
        nextToken: res.NextContinuationToken ?? null
      })
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: e?.message ?? String(e) })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
