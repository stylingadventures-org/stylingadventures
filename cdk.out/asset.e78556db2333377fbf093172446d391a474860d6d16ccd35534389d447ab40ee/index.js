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

// lambda/closet/notify-admin.ts
var notify_admin_exports = {};
__export(notify_admin_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(notify_admin_exports);
var handler = async (event) => {
  console.log("[notify-admin] incoming event:", JSON.stringify(event));
  const itemId = event.itemId || event.closetItemId || void 0;
  const storyId = event.storyId || void 0;
  return {
    ok: true,
    notified: false,
    // flip to true once you actually notify someone
    itemId,
    storyId,
    note: "Admin notification stub \u2013 no real notifications sent yet."
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
