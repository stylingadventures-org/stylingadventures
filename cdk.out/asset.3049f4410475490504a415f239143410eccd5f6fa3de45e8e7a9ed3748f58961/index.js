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
var ddbClient = new import_client_dynamodb.DynamoDBClient({});
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(ddbClient);
var CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME = process.env.CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME;
var handler = async (event) => {
  console.log("linkClosetItemToProduct called", JSON.stringify(event, null, 2));
  const closetItemId = event.closetItemId ?? event.arguments?.closetItemId ?? null;
  const productId = event.productId ?? event.arguments?.productId ?? null;
  const matchConfidence = event.matchConfidence ?? event.arguments?.matchConfidence ?? 100;
  const source = event.source ?? event.arguments?.source ?? "Lala";
  if (!closetItemId || !productId) {
    throw new Error("closetItemId and productId are required");
  }
  await ddb.send(
    new import_lib_dynamodb.PutCommand({
      TableName: CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME,
      Item: {
        closetItemId,
        productId,
        matchConfidence,
        source
      }
    })
  );
  return {
    closetItemId,
    productId,
    matchConfidence,
    source,
    status: "OK"
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
