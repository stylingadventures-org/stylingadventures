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
var ddbClient = new import_client_dynamodb.DynamoDBClient({});
var ddb = import_lib_dynamodb.DynamoDBDocumentClient.from(ddbClient);
var PRODUCT_TABLE = process.env.PRODUCT_TABLE_NAME;
var AFFILIATE_LINK_TABLE = process.env.AFFILIATE_LINK_TABLE_NAME;
var CLOSET_ITEM_PRODUCT_MAP_TABLE = process.env.CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME;
async function getAffiliateLinksForProduct(productId) {
  const res = await ddb.send(
    new import_lib_dynamodb.QueryCommand({
      TableName: AFFILIATE_LINK_TABLE,
      IndexName: "productId-index",
      KeyConditionExpression: "productId = :pid",
      ExpressionAttributeValues: {
        ":pid": productId
      }
    })
  );
  return res.Items ?? [];
}
var handler = async (event) => {
  console.log("getShopLalasLook called", JSON.stringify(event, null, 2));
  const closetItemId = event.closetItemId ?? event.arguments?.closetItemId ?? null;
  if (!closetItemId) {
    throw new Error("closetItemId is required");
  }
  const mapRes = await ddb.send(
    new import_lib_dynamodb.QueryCommand({
      TableName: CLOSET_ITEM_PRODUCT_MAP_TABLE,
      KeyConditionExpression: "closetItemId = :cid",
      ExpressionAttributeValues: {
        ":cid": closetItemId
      }
    })
  );
  const mappings = mapRes.Items ?? [];
  if (mappings.length === 0) {
    return {
      closetItemId,
      matches: []
    };
  }
  const productIds = Array.from(
    new Set(mappings.map((m) => m.productId))
  );
  const batchRes = await ddb.send(
    new import_lib_dynamodb.BatchGetCommand({
      RequestItems: {
        [PRODUCT_TABLE]: {
          Keys: productIds.map((productId) => ({ productId }))
        }
      }
    })
  );
  const productItems = batchRes.Responses && batchRes.Responses[PRODUCT_TABLE] ? batchRes.Responses[PRODUCT_TABLE] : [];
  const productById = /* @__PURE__ */ new Map();
  for (const p of productItems) {
    if (p.productId) {
      productById.set(p.productId, p);
    }
  }
  const matches = [];
  for (const m of mappings) {
    const productId = m.productId;
    const product = productById.get(productId) ?? null;
    const affiliateLinks = await getAffiliateLinksForProduct(productId);
    matches.push({
      productId,
      matchConfidence: m.matchConfidence ?? null,
      source: m.source ?? null,
      product,
      affiliateLinks
    });
  }
  return {
    closetItemId,
    matches
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
