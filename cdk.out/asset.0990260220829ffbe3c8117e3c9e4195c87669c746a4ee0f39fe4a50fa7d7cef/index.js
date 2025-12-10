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

// lambda/shopping/get-shop-lalas-look.ts
var get_shop_lalas_look_exports = {};
__export(get_shop_lalas_look_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(get_shop_lalas_look_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME;
var AFFILIATE_LINK_TABLE_NAME = process.env.AFFILIATE_LINK_TABLE_NAME;
var CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME = process.env.CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME;
var ddbClient = new import_client_dynamodb.DynamoDBClient({});
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(ddbClient);
var handler = async (event) => {
  try {
    const closetItemId = getClosetItemIdFromEvent(event);
    if (!closetItemId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing closetItemId"
        })
      };
    }
    const mapResult = await docClient.send(
      new import_lib_dynamodb.QueryCommand({
        TableName: CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME,
        KeyConditionExpression: "closetItemId = :cid",
        ExpressionAttributeValues: {
          ":cid": closetItemId
        }
      })
    );
    const mappings = mapResult.Items || [];
    if (mappings.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          closetItemId,
          products: []
        })
      };
    }
    mappings.sort(
      (a, b) => (b.matchConfidence ?? 0) - (a.matchConfidence ?? 0)
    );
    const productIds = Array.from(
      new Set(mappings.map((m) => m.productId))
    );
    const batchGetResult = await docClient.send(
      new import_lib_dynamodb.BatchGetCommand({
        RequestItems: {
          [PRODUCT_TABLE_NAME]: {
            Keys: productIds.map((productId) => ({ productId }))
          }
        }
      })
    );
    const productsById = /* @__PURE__ */ new Map();
    const productItems = batchGetResult.Responses?.[PRODUCT_TABLE_NAME] || [];
    for (const item of productItems) {
      const p = item;
      productsById.set(p.productId, p);
    }
    const results = [];
    for (const mapping of mappings) {
      const product = productsById.get(mapping.productId);
      if (!product) continue;
      const linkResult = await docClient.send(
        new import_lib_dynamodb.QueryCommand({
          TableName: AFFILIATE_LINK_TABLE_NAME,
          IndexName: "productId-index",
          KeyConditionExpression: "productId = :pid",
          ExpressionAttributeValues: {
            ":pid": mapping.productId
          }
        })
      );
      const links = linkResult.Items || [];
      results.push({
        productId: mapping.productId,
        matchConfidence: mapping.matchConfidence ?? null,
        source: mapping.source ?? null,
        product,
        affiliateLinks: links
      });
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        closetItemId,
        products: results
      })
    };
  } catch (err) {
    console.error("Error in get-shop-lalas-look:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error"
      })
    };
  }
};
function getClosetItemIdFromEvent(event) {
  if (event.closetItemId) return event.closetItemId;
  if (event.arguments?.closetItemId)
    return event.arguments.closetItemId;
  if (event.body) {
    try {
      const parsed = JSON.parse(event.body);
      if (parsed.closetItemId) return parsed.closetItemId;
    } catch {
    }
  }
  return void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
