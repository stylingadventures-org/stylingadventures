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

// lambda/workflows/save-approval-token.ts
var save_approval_token_exports = {};
__export(save_approval_token_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(save_approval_token_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var ddb = new import_client_dynamodb.DynamoDBClient({});
var TABLE_NAME = process.env.TABLE_NAME;
var PK_NAME = process.env.PK_NAME || "pk";
var SK_NAME = process.env.SK_NAME || "sk";
var handler = async (event) => {
  const records = event.Records || [];
  for (const record of records) {
    const msg = JSON.parse(record.Sns.Message);
    const { itemId, ...detail } = msg.detail;
    const pk = `CLOSET#${itemId}`;
    const sk = "ITEM";
    await ddb.send(
      new import_client_dynamodb.UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: {
          [PK_NAME]: { S: pk },
          [SK_NAME]: { S: sk }
        },
        UpdateExpression: "SET approvalTaskToken = :taskToken, approvalType = :type, approvalDetail = :detail, approvalStatus = :status",
        ExpressionAttributeValues: {
          ":taskToken": { S: msg.taskToken },
          ":type": { S: msg.type },
          ":detail": { S: JSON.stringify(detail) },
          ":status": { S: "PENDING" }
        }
      })
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
