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

// lambda/closet/pii-check.ts
var pii_check_exports = {};
__export(pii_check_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(pii_check_exports);
function basicPiiScan(text) {
  let findings = [];
  let redacted = text;
  const emailRe = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  if (emailRe.test(text)) {
    findings.push("EMAIL");
    redacted = redacted.replace(emailRe, "[redacted-email]");
  }
  const phoneRe = /(\+?\d{1,2}[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g;
  if (phoneRe.test(text)) {
    findings.push("PHONE");
    redacted = redacted.replace(phoneRe, "[redacted-phone]");
  }
  const ccRe = /\b(?:\d[ -]*?){13,16}\b/g;
  if (ccRe.test(text)) {
    findings.push("CARD");
    redacted = redacted.replace(ccRe, "[redacted-card]");
  }
  return {
    hasPii: findings.length > 0,
    redacted,
    findings
  };
}
var handler = async (event) => {
  console.log("[pii-check] event =", JSON.stringify(event));
  const text = typeof (event == null ? void 0 : event.text) === "string" && event.text || typeof (event == null ? void 0 : event.body) === "string" && event.body || "";
  const { hasPii, redacted, findings } = basicPiiScan(text || "");
  return {
    ok: true,
    hasPii,
    redactedText: redacted,
    findings
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
