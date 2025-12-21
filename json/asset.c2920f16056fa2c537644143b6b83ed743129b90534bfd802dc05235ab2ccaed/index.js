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

// lambda/closet/moderation.ts
var moderation_exports = {};
__export(moderation_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(moderation_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var ddb = new import_client_dynamodb.DynamoDBClient({});
var handler = async (event) => {
  console.log("[moderation] event =", JSON.stringify(event));
  return {
    ok: true,
    message: "Moderation placeholder executed"
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
