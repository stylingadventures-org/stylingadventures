// lambda/shopping/get-shop-lalas-look.ts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import { AppSyncResolverEvent } from "aws-lambda";

const PRODUCT_TABLE = process.env.PRODUCT_TABLE_NAME!;
const AFFILIATE_TABLE = process.env.AFFILIATE_LINK_TABLE_NAME!;
const CLOSET_MAP_TABLE = process.env.CLOSET_ITEM_PRODUCT_MAP_TABLE_NAME!;

// --- Types that line up with your GraphQL schema ---

type ShopAffiliateLink = {
  affiliateLinkId: string;
  retailerName: string;
  url: string;
  commissionRate?: number;
};

type ShopProduct = {
  productId: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  category?: string;
  price?: number;
  color?: string;
  sizeOptions?: string[];
  affiliateLinks: ShopAffiliateLink[];
};

// Mapping table row
type ClosetItemProductMap = {
  closetItemId: string;
  productId: string;
  matchConfidence?: number;
  source?: string;
};

// AppSync arguments shape (we’ll still be flexible when reading it)
type ResolverArgs = {
  closetItemId?: string;
  closetItemID?: string;
  itemId?: string;
  input?: {
    closetItemId?: string;
    closetItemID?: string;
    itemId?: string;
  };
};

type Event = AppSyncResolverEvent<ResolverArgs> | any;

const client = new DynamoDBClient({});
const ddbDoc = DynamoDBDocumentClient.from(client);

// Flexible extractor so different argument shapes still work
function getClosetItemIdFromEvent(event: Event): string | undefined {
  const anyEvent: any = event;

  // 1) AppSync-style arguments (most common)
  const args = anyEvent.arguments || {};
  const fromArgs =
    args.closetItemId ??
    args.closetItemID ?? // alternate casing
    args.itemId ?? // if schema used itemId
    args.input?.closetItemId ??
    args.input?.closetItemID ??
    args.input?.itemId;

  if (fromArgs) return String(fromArgs);

  // 2) Direct fields on the event (direct invoke / tests)
  const direct =
    anyEvent.closetItemId ??
    anyEvent.closetItemID ??
    anyEvent.itemId ??
    anyEvent.input?.closetItemId ??
    anyEvent.input?.closetItemID ??
    anyEvent.input?.itemId;

  if (direct) return String(direct);

  // 3) Body JSON (API Gateway style)
  if (anyEvent.body) {
    try {
      const parsed = JSON.parse(anyEvent.body);
      const fromBody =
        parsed.closetItemId ??
        parsed.closetItemID ??
        parsed.itemId ??
        parsed.input?.closetItemId ??
        parsed.input?.closetItemID ??
        parsed.input?.itemId;

      if (fromBody) return String(fromBody);
    } catch {
      // ignore parse errors
    }
  }

  return undefined;
}

// Main resolver – returns [ShopProduct!]! directly
export const handler = async (event: Event): Promise<ShopProduct[]> => {
  const closetItemId = getClosetItemIdFromEvent(event);

  if (!closetItemId) {
    // AppSync will surface this as a GraphQL error
    throw new Error("Missing closetItemId");
  }

  // 1) find productIds for this closet item
  const mapResp = await ddbDoc.send(
    new QueryCommand({
      TableName: CLOSET_MAP_TABLE,
      KeyConditionExpression: "closetItemId = :cid",
      ExpressionAttributeValues: {
        ":cid": closetItemId,
      },
    }),
  );

  const mappings = (mapResp.Items ?? []) as ClosetItemProductMap[];
  const productIds = mappings.map((m) => m.productId);

  if (productIds.length === 0) {
    // matches GraphQL return type [ShopProduct!]!
    return [];
  }

  // 2) load products
  const productBatch = await ddbDoc.send(
    new BatchGetCommand({
      RequestItems: {
        [PRODUCT_TABLE]: {
          Keys: productIds.map((id) => ({ productId: id })),
        },
      },
    }),
  );

  const products = (productBatch.Responses?.[PRODUCT_TABLE] ??
    []) as any[];

  // 3) load affiliate links for each product
  const affiliateBatch = await ddbDoc.send(
    new BatchGetCommand({
      RequestItems: {
        [AFFILIATE_TABLE]: {
          Keys: productIds.map((id) => ({ productId: id })), // adjust if PK changes
        },
      },
    }),
  );

  const allLinks = (affiliateBatch.Responses?.[AFFILIATE_TABLE] ??
    []) as any[];

  // Group links by productId
  const linksByProductId: Record<string, ShopAffiliateLink[]> = {};
  for (const link of allLinks) {
    const pid = link.productId;
    if (!pid) continue;

    if (!linksByProductId[pid]) {
      linksByProductId[pid] = [];
    }

    linksByProductId[pid].push({
      affiliateLinkId: link.affiliateLinkId,
      retailerName: link.retailerName,
      url: link.url,
      commissionRate: link.commissionRate,
    });
  }

  // 4) build ShopProduct[] result
  const result: ShopProduct[] = products.map((p) => ({
    productId: p.productId,
    name: p.name,
    brand: p.brand,
    imageUrl: p.imageUrl,
    category: p.category,
    price: p.price,
    color: p.color,
    sizeOptions: p.sizeOptions,
    affiliateLinks: linksByProductId[p.productId] ?? [],
  }));

  return result;
};
