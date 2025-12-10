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
var PRODUCT_TABLE = process.env.PRODUCT_TABLE_NAME;
var AFFILIATE_TABLE = process.env.AFFILIATE_LINK_TABLE_NAME;
var CLOSET_MAP_TABLE = process.env.CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME;
var client = new import_client_dynamodb.DynamoDBClient({});
var ddbDoc = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
var handler = async (event) => {
  try {
    const closetItemId = event.arguments.closetItemId;
    if (!closetItemId) {
      throw new Error("Missing closetItemId");
    }
    const mapResp = await ddbDoc.send(
      new import_lib_dynamodb.QueryCommand({
        TableName: CLOSET_MAP_TABLE,
        KeyConditionExpression: "closetItemId = :cid",
        ExpressionAttributeValues: {
          ":cid": closetItemId
        }
      })
    );
    const productIds = (mapResp.Items ?? []).map(
      (i) => i.productId
    );
    if (productIds.length === 0) {
      return [];
    }
    const uniqueProductIds = Array.from(new Set(productIds));
    const productBatch = await ddbDoc.send(
      new import_lib_dynamodb.BatchGetCommand({
        RequestItems: {
          [PRODUCT_TABLE]: {
            Keys: uniqueProductIds.map((id) => ({ productId: id }))
          }
        }
      })
    );
    const products = productBatch.Responses?.[PRODUCT_TABLE] ?? [];
    const linksByProductId = {};
    for (const pid of uniqueProductIds) {
      const linkResp = await ddbDoc.send(
        new import_lib_dynamodb.QueryCommand({
          TableName: AFFILIATE_TABLE,
          IndexName: "productId-index",
          KeyConditionExpression: "productId = :pid",
          ExpressionAttributeValues: {
            ":pid": pid
          }
        })
      );
      const links = linkResp.Items ?? [];
      linksByProductId[pid] = links.map((link) => ({
        affiliateLinkId: link.affiliateLinkId,
        retailerName: link.retailerName,
        url: link.url,
        commissionRate: link.commissionRate
      }));
    }
    const result = products.map((p) => ({
      productId: p.productId,
      // GraphQL type has name: String! so ensure a non-null string
      name: p.name ?? "Unknown product",
      brand: p.brand ?? null,
      imageUrl: p.imageUrl ?? null,
      category: p.category ?? null,
      price: p.price ?? null,
      color: p.color ?? null,
      sizeOptions: p.sizeOptions ?? [],
      affiliateLinks: linksByProductId[p.productId] ?? []
    }));
    return result;
  } catch (err) {
    console.error("Error in get-shop-lalas-look:", err);
    throw err;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
