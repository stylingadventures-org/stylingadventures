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

// lambda/auth/token-gen.ts
var token_gen_exports = {};
__export(token_gen_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(token_gen_exports);
var handler = async (event) => {
  console.log("TOKEN_GENERATION trigger fired", JSON.stringify(event, null, 2));
  const { request, response } = event;
  if (request.groupConfiguration && request.groupConfiguration.groupsToOverride) {
    response.claimsOverrideDetails = {
      claimsToAddOrOverride: {
        "cognito:groups": request.groupConfiguration.groupsToOverride.join(",")
      },
      claimsToSuppress: [],
      groupConfiguration: {
        groupsToOverride: request.groupConfiguration.groupsToOverride
      }
    };
  }
  console.log("Response:", JSON.stringify(response, null, 2));
  return response;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
