// lambda/shopping/get-shop-lalas-look.ts
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import { AppSyncResolverEvent } from "aws-lambda";

const PRODUCT_TABLE = process.env.PRODUCT_TABLE_NAME!;
const AFFILIATE_TABLE = process.env.AFFILIATE_LINK_TABLE_NAME!;
const CLOSET_MAP_TABLE =
  process.env.CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME!;

const client = new DynamoDBClient({});
const ddbDoc = DynamoDBDocumentClient.from(client);

// Matches GraphQL: shopLalasLook(closetItemId: ID!): [ShopProduct!]!
type Arguments = { closetItemId: string };

type ProductItem = {
  productId: string;
  name?: string;
  brand?: string;
  imageUrl?: string;
  category?: string;
  price?: number;
  color?: string;
  sizeOptions?: string[];
};

type AffiliateLinkItem = {
  affiliateLinkId: string;
  productId: string;
  retailerName: string;
  url: string;
  commissionRate?: number;
};

export const handler = async (
  event: AppSyncResolverEvent<Arguments>,
) => {
  try {
    const closetItemId = event.arguments.closetItemId;
    if (!closetItemId) {
      // For AppSync, throw to surface a GraphQL error
      throw new Error("Missing closetItemId");
    }

    // 1) Find productIds for this closet item
    const mapResp = await ddbDoc.send(
      new QueryCommand({
        TableName: CLOSET_MAP_TABLE,
        KeyConditionExpression: "closetItemId = :cid",
        ExpressionAttributeValues: {
          ":cid": closetItemId,
        },
      }),
    );

    const productIds = (mapResp.Items ?? []).map(
      (i: any) => i.productId as string,
    );

    if (productIds.length === 0) {
      // Matches [ShopProduct!]! — empty list is fine
      return [];
    }

    const uniqueProductIds = Array.from(new Set(productIds));

    // 2) Load product records via BatchGet
    const productBatch = await ddbDoc.send(
      new BatchGetCommand({
        RequestItems: {
          [PRODUCT_TABLE]: {
            Keys: uniqueProductIds.map((id) => ({ productId: id })),
          },
        },
      }),
    );

    const products: ProductItem[] =
      (productBatch.Responses?.[PRODUCT_TABLE] as ProductItem[]) ??
      [];

    // 3) Load affiliate links for each product using GSI productId-index
    const linksByProductId: Record<string, any[]> = {};

    for (const pid of uniqueProductIds) {
      const linkResp = await ddbDoc.send(
        new QueryCommand({
          TableName: AFFILIATE_TABLE,
          IndexName: "productId-index",
          KeyConditionExpression: "productId = :pid",
          ExpressionAttributeValues: {
            ":pid": pid,
          },
        }),
      );

      const links =
        (linkResp.Items ?? []) as AffiliateLinkItem[];

      linksByProductId[pid] = links.map((link) => ({
        affiliateLinkId: link.affiliateLinkId,
        retailerName: link.retailerName,
        url: link.url,
        commissionRate: link.commissionRate,
      }));
    }

    // 4) Build ShopProduct[] result to match schema
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
      affiliateLinks: linksByProductId[p.productId] ?? [],
    }));

    return result;
  } catch (err) {
    console.error("Error in get-shop-lalas-look:", err);
    // Bubble up to AppSync as a GraphQL error
    throw err;
  }
};
