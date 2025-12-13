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

// lambda/admin/approve-closet-upload.ts
var approve_closet_upload_exports = {};
__export(approve_closet_upload_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(approve_closet_upload_exports);
var import_client_sfn = require("@aws-sdk/client-sfn");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var sfn = new import_client_sfn.SFNClient({});
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}));
var TABLE_NAME = process.env.TABLE_NAME;
var PK_NAME = process.env.PK_NAME || "pk";
var SK_NAME = process.env.SK_NAME || "sk";
var handler = async (event) => {
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body ?? {};
    const approvalId = body.approvalId;
    const decision = body.decision;
    if (!approvalId || !decision) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing approvalId or decision" }) };
    }
    if (decision !== "APPROVE" && decision !== "REJECT") {
      return { statusCode: 400, body: JSON.stringify({ message: "decision must be APPROVE or REJECT" }) };
    }
    const pk = `ITEM#${approvalId}`;
    const sk = "META";
    const res = await ddb.send(
      new import_lib_dynamodb.GetCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk }
      })
    );
    if (!res.Item) {
      return { statusCode: 404, body: JSON.stringify({ message: "Item not found" }) };
    }
    if (res.Item.status !== "PENDING") {
      return { statusCode: 409, body: JSON.stringify({ message: `Already ${res.Item.status}` }) };
    }
    const taskToken = res.Item.taskToken;
    if (!taskToken) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "No taskToken on item. NotifyAdminFn did not store it yet." })
      };
    }
    await sfn.send(
      new import_client_sfn.SendTaskSuccessCommand({
        taskToken,
        output: JSON.stringify({
          decision,
          reason: decision === "APPROVE" ? "Approved by admin UI" : "Rejected by admin UI"
        })
      })
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await ddb.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
        UpdateExpression: "SET #status = :s, decidedAt = :t, updatedAt = :t REMOVE taskToken",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":s": decision === "APPROVE" ? "APPROVED" : "REJECTED",
          ":t": now
        }
      })
    );
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal error" }) };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
