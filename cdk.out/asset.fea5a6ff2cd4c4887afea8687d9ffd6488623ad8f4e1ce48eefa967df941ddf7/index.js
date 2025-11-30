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
var handler = async (event) => {
  console.log("[publish] incoming event:", JSON.stringify(event));
  const itemId = event.itemId || event.closetItemId || void 0;
  const storyId = event.storyId || void 0;
  return {
    ok: true,
    itemId,
    storyId,
    status: "PUBLISHED"
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
