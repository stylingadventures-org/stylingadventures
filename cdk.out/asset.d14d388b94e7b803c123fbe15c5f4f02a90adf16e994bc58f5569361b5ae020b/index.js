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

// lambda/shopping/link-closet-item-to-product.ts
var link_closet_item_to_product_exports = {};
__export(link_closet_item_to_product_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(link_closet_item_to_product_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME = process.env.CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME;
var ddbClient = new import_client_dynamodb.DynamoDBClient({});
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(ddbClient);
var handler = async (event) => {
  try {
    const {
      closetItemId,
      productId,
      matchConfidence,
      source
    } = getInputFromEvent(event);
    if (!closetItemId || !productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing closetItemId or productId"
        })
      };
    }
    await docClient.send(
      new import_lib_dynamodb.PutCommand({
        TableName: CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME,
        Item: {
          closetItemId,
          productId,
          matchConfidence: matchConfidence ?? 100,
          source: source ?? "Manual"
        }
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Mapping saved",
        closetItemId,
        productId,
        matchConfidence: matchConfidence ?? 100,
        source: source ?? "Manual"
      })
    };
  } catch (err) {
    console.error(
      "Error in link-closet-item-to-product:",
      err
    );
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error"
      })
    };
  }
};
function getInputFromEvent(event) {
  if (event.closetItemId || event.productId) {
    return {
      closetItemId: event.closetItemId,
      productId: event.productId,
      matchConfidence: event.matchConfidence,
      source: event.source
    };
  }
  if (event.arguments) {
    return {
      closetItemId: event.arguments.closetItemId,
      productId: event.arguments.productId,
      matchConfidence: event.arguments.matchConfidence,
      source: event.arguments.source
    };
  }
  if (event.body) {
    try {
      const parsed = JSON.parse(event.body);
      return {
        closetItemId: parsed.closetItemId,
        productId: parsed.productId,
        matchConfidence: parsed.matchConfidence,
        source: parsed.source
      };
    } catch {
    }
  }
  return {
    closetItemId: void 0,
    productId: void 0,
    matchConfidence: void 0,
    source: void 0
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
