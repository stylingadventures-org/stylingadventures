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

// lambda/auth/pre-token-generation.ts
var pre_token_generation_exports = {};
__export(pre_token_generation_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(pre_token_generation_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var ddb = new import_client_dynamodb.DynamoDBClient({});
var TABLE_NAME = process.env.TABLE_NAME;
var PK_NAME = process.env.PK_NAME || "pk";
var SK_NAME = process.env.SK_NAME || "sk";
function deriveGroupsFromTier(tier) {
  switch (tier) {
    case "ADMIN":
      return ["ADMIN"];
    case "PRIME":
      return ["PRIME"];
    case "CREATOR":
      return ["CREATOR"];
    case "COLLAB":
      return ["COLLAB"];
    case "BESTIE":
      return ["BESTIE"];
    case "FREE":
    default:
      return ["FAN"];
  }
}
async function getTierFromDynamo(sub) {
  const pk = `USER#${sub}`;
  const sk = "PROFILE";
  const res = await ddb.send(
    new import_client_dynamodb.GetItemCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK_NAME]: { S: pk },
        [SK_NAME]: { S: sk }
      },
      ProjectionExpression: "#tier",
      ExpressionAttributeNames: {
        "#tier": "tier"
      }
    })
  );
  const tierAttr = res.Item?.tier?.S;
  return tierAttr || "FREE";
}
var handler = async (event) => {
  const sub = event.request.userAttributes.sub;
  if (!sub) {
    return event;
  }
  console.log("\u{1F50D} pre-token handler triggered for user:", sub);
  console.log("\u{1F4E6} groupConfiguration:", JSON.stringify(event.request.groupConfiguration));
  let groupsToUse = [];
  if (event.request.groupConfiguration?.groupsToOverride && event.request.groupConfiguration.groupsToOverride.length > 0) {
    groupsToUse = event.request.groupConfiguration.groupsToOverride;
    console.log("\u2705 Found groups from Cognito:", groupsToUse);
  } else {
    console.log("\u26A0\uFE0F No groups found in Cognito, trying DynamoDB...");
    const tier = await getTierFromDynamo(sub);
    groupsToUse = deriveGroupsFromTier(tier);
    console.log("\u{1F4CB} Derived groups from tier:", tier, "->", groupsToUse);
    if (!event.response.claimsOverrideDetails) {
      event.response.claimsOverrideDetails = {};
    }
    if (!event.response.claimsOverrideDetails.claimsToAddOrOverride) {
      event.response.claimsOverrideDetails.claimsToAddOrOverride = {};
    }
    event.response.claimsOverrideDetails.claimsToAddOrOverride.tier = tier;
  }
  if (!event.response.claimsOverrideDetails) {
    event.response.claimsOverrideDetails = {};
  }
  if (!event.response.claimsOverrideDetails.claimsToAddOrOverride) {
    event.response.claimsOverrideDetails.claimsToAddOrOverride = {};
  }
  event.response.claimsOverrideDetails.claimsToAddOrOverride["cognito:groups"] = groupsToUse.join(",");
  event.response.claimsOverrideDetails.groupOverrideDetails = {
    groupsToOverride: groupsToUse
  };
  console.log("\u2705 Final cognito:groups claim:", groupsToUse.join(","));
  return event;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
