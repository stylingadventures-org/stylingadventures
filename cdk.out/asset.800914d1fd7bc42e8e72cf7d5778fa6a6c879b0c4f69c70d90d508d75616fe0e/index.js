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

// lambda/trigger-thumbnail/index.ts
var trigger_thumbnail_exports = {};
__export(trigger_thumbnail_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(trigger_thumbnail_exports);
var import_client_sfn = require("@aws-sdk/client-sfn");
var sfn = new import_client_sfn.SFNClient({});
var { STATE_MACHINE_ARN = "" } = process.env;
var handler = async (event) => {
  if (!STATE_MACHINE_ARN) {
    throw new Error("STATE_MACHINE_ARN is not set");
  }
  const payload = typeof event?.body === "string" ? JSON.parse(event.body) : event ?? {};
  const input = JSON.stringify({
    ...payload,
    receivedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  await sfn.send(
    new import_client_sfn.StartExecutionCommand({
      stateMachineArn: STATE_MACHINE_ARN,
      input
    })
  );
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true })
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
