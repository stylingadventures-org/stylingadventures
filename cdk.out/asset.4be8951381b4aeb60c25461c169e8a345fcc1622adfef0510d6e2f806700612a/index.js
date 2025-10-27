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

// lambda/thumb-head/index.ts
var thumb_head_exports = {};
__export(thumb_head_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(thumb_head_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var s3 = new import_client_s3.S3Client({ region: process.env.AWS_REGION || "us-east-1" });
var BUCKET = process.env.BUCKET;
var ORIGIN = process.env.WEB_ORIGIN || "https://stylingadventures.com";
var baseHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Vary": "Origin"
};
var handler = async (event) => {
  const raw = event?.queryStringParameters?.key;
  if (!raw) {
    return {
      statusCode: 400,
      headers: baseHeaders,
      body: JSON.stringify({ message: "Missing key" })
    };
  }
  const srcKey = decodeURIComponent(raw);
  const thumbKey = `thumbs/${srcKey.replace(/\.[^.]+$/, ".jpg")}`;
  try {
    await s3.send(new import_client_s3.HeadObjectCommand({ Bucket: BUCKET, Key: thumbKey }));
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: JSON.stringify({ ready: true })
    };
  } catch {
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: JSON.stringify({ ready: false })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
