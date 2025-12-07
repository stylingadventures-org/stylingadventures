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

// lambda/workflows/complete-approval.ts
var complete_approval_exports = {};
__export(complete_approval_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(complete_approval_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_client_sfn = require("@aws-sdk/client-sfn");
var ddb = new import_client_dynamodb.DynamoDBClient({});
var sfn = new import_client_sfn.SFNClient({});
var TABLE_NAME = process.env.TABLE_NAME;
var PK_NAME = process.env.PK_NAME || "pk";
var SK_NAME = process.env.SK_NAME || "sk";
var handler = async (event) => {
  if (!event.body) {
    return { statusCode: 400, body: "Missing body" };
  }
  const { itemId, decision, reason } = JSON.parse(event.body);
  const pk = `CLOSET#${itemId}`;
  const sk = "ITEM";
  const result = await ddb.send(
    new import_client_dynamodb.GetItemCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK_NAME]: { S: pk },
        [SK_NAME]: { S: sk }
      },
      ProjectionExpression: "approvalTaskToken"
    })
  );
  const taskToken = result.Item?.approvalTaskToken?.S;
  if (!taskToken) {
    return {
      statusCode: 404,
      body: `No approvalTaskToken found for itemId=${itemId}`
    };
  }
  if (decision === "APPROVE") {
    await sfn.send(
      new import_client_sfn.SendTaskSuccessCommand({
        taskToken,
        output: JSON.stringify({ approved: true })
      })
    );
  } else {
    await sfn.send(
      new import_client_sfn.SendTaskFailureCommand({
        taskToken,
        error: "REJECTED",
        cause: reason || "Rejected by admin"
      })
    );
  }
  await ddb.send(
    new import_client_dynamodb.UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK_NAME]: { S: pk },
        [SK_NAME]: { S: sk }
      },
      UpdateExpression: "SET approvalStatus = :status, approvalReason = :reason REMOVE approvalTaskToken",
      ExpressionAttributeValues: {
        ":status": { S: decision },
        ":reason": { S: reason || "" }
      }
    })
  );
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
