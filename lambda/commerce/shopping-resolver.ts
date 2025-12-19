/**
 * lambda/commerce/shopping-resolver.ts
 * 
 * Handles Shopping queries and mutations:
 * - Find exact item matches (brand/name search)
 * - Get shoppable items from scenes/videos
 * - Shopping cart management (add, remove items)
 * - Affiliate tracking and commission calculation
 * - Admin: Create shoppable items, add affiliate links
 */

import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import { AppSyncIdentityCognito } from "aws-lambda";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

type SAIdentity = (AppSyncIdentityCognito & { groups?: string[] | null }) | null | undefined;

// ────────────────────────────────────────────────────────────
// Auth helpers
// ────────────────────────────────────────────────────────────

function assertAuth(identity: SAIdentity): asserts identity {
  if (!identity?.sub) throw new Error("Not authenticated");
}

function isAdmin(identity: SAIdentity): boolean {
  const claims = (identity as any)?.claims || {};
  const raw = claims["cognito:groups"];
  const groups = Array.isArray(raw)
    ? raw
    : String(raw || "").split(",").map((g) => g.trim()).filter(Boolean);
  return groups.includes("ADMIN") || groups.includes("PRIME");
}

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface ShoppableItem {
  id: string;
  brand: string;
  name: string;
  category: string;
  sku: string;
  imageUrl: string;
  price: number;
  affiliateLinks: AffiliateLink[];
  likeCount: number;
}

interface AffiliateLink {
  id: string;
  retailer: string;
  url: string;
  commissionRate: number;
  isActive: boolean;
}

interface ExactMatchResult {
  item: ShoppableItem;
  confidence: number;
  matchType: string;
  source: string;
}

interface ShoppingCart {
  id: string;
  userId: string;
  items: ShoppableItem[];
  total: number;
  affiliateCredit: number;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function pkForUser(userId: string) {
  return `USER#${userId}`;
}

function skForCart(userId: string) {
  return `SHOPPING#CART`;
}

function pkForShoppableItem() {
  return "SHOPPING#ITEM";
}

function skForShoppableItem(itemId: string) {
  return `ITEM#${itemId}`;
}

const ddbMarshal = (value: any) =>
  marshall(value, { removeUndefinedValues: true });

// ────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────

async function handleFindExactItem(args: {
  brandName: string;
  itemName: string;
  category?: string;
}): Promise<ExactMatchResult[]> {
  // Scan all shoppable items and fuzzy match
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForShoppableItem(),
      }),
    }),
  );

  const items = (res.Items ?? []).map((raw) => unmarshall(raw) as ShoppableItem);

  const matches = items.filter((item) => {
    const brandMatch = item.brand.toLowerCase().includes(args.brandName.toLowerCase());
    const nameMatch = item.name.toLowerCase().includes(args.itemName.toLowerCase());
    const categoryMatch = !args.category || item.category === args.category;

    return brandMatch && nameMatch && categoryMatch;
  });

  return matches.map((item) => ({
    item,
    confidence: 0.85,
    matchType: "EXACT",
    source: "SHOPPING_DB",
  }));
}

async function handleSceneShoppableItems(args: {
  sceneId: string;
}): Promise<ShoppableItem[]> {
  // In production, would link scenes to shoppable items
  // For now returning empty array as placeholder
  return [];
}

async function handleVideoShoppableItems(args: {
  videoId: string;
}): Promise<ShoppableItem[]> {
  // In production, would link music videos to shoppable items
  // For now returning empty array as placeholder
  return [];
}

async function handleMyShoppingCart(identity: SAIdentity): Promise<ShoppingCart | null> {
  assertAuth(identity);
  const userId = identity!.sub as string;

  const res = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(userId),
        sk: skForCart(userId),
      }),
    }),
  );

  if (!res.Item) {
    // Return empty cart
    return {
      id: randomUUID(),
      userId,
      items: [],
      total: 0,
      affiliateCredit: 0,
    };
  }

  return unmarshall(res.Item) as ShoppingCart;
}

// ────────────────────────────────────────────────────────────
// Mutations
// ────────────────────────────────────────────────────────────

async function handleAddToCart(
  args: { itemId: string },
  identity: SAIdentity,
): Promise<ShoppingCart> {
  assertAuth(identity);
  const userId = identity!.sub as string;
  const now = nowIso();

  // Get item
  const itemRes = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForShoppableItem(),
        sk: skForShoppableItem(args.itemId),
      }),
    }),
  );

  if (!itemRes.Item) throw new Error("Item not found");
  const item = unmarshall(itemRes.Item) as ShoppableItem;

  // Get or create cart
  let cart: ShoppingCart = {
    id: randomUUID(),
    userId,
    items: [],
    total: 0,
    affiliateCredit: 0,
  };

  const cartRes = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(userId),
        sk: skForCart(userId),
      }),
    }),
  );

  if (cartRes.Item) {
    cart = unmarshall(cartRes.Item) as ShoppingCart;
  }

  // Add item to cart if not already there
  if (!cart.items.find((i) => i.id === item.id)) {
    cart.items.push(item);
    cart.total += item.price;

    // Calculate affiliate credit (assume 5% avg commission)
    const commission = item.affiliateLinks[0]?.commissionRate ?? 0.05;
    cart.affiliateCredit += item.price * commission;
  }

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForUser(userId),
        sk: skForCart(userId),
        entityType: "SHOPPING_CART",
        updatedAt: now,
        ...cart,
      }),
    }),
  );

  return cart;
}

async function handleRemoveFromCart(
  args: { itemId: string },
  identity: SAIdentity,
): Promise<ShoppingCart> {
  assertAuth(identity);
  const userId = identity!.sub as string;
  const now = nowIso();

  const cart = await handleMyShoppingCart(identity);
  if (!cart) throw new Error("Cart not found");

  const item = cart.items.find((i) => i.id === args.itemId);
  if (!item) throw new Error("Item not in cart");

  cart.items = cart.items.filter((i) => i.id !== args.itemId);
  cart.total -= item.price;

  const commission = item.affiliateLinks[0]?.commissionRate ?? 0.05;
  cart.affiliateCredit -= item.price * commission;

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForUser(userId),
        sk: skForCart(userId),
        entityType: "SHOPPING_CART",
        updatedAt: now,
        ...cart,
      }),
    }),
  );

  return cart;
}

// ────────────────────────────────────────────────────────────
// Admin Mutations
// ────────────────────────────────────────────────────────────

async function handleAdminCreateShoppableItem(
  args: {
    brand: string;
    name: string;
    category: string;
    sku: string;
    imageUrl: string;
    price: number;
  },
  identity: SAIdentity,
): Promise<ShoppableItem> {
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const itemId = randomUUID();
  const item: ShoppableItem = {
    id: itemId,
    brand: args.brand,
    name: args.name,
    category: args.category,
    sku: args.sku,
    imageUrl: args.imageUrl,
    price: args.price,
    affiliateLinks: [],
    likeCount: 0,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForShoppableItem(),
        sk: skForShoppableItem(itemId),
        entityType: "SHOPPABLE_ITEM",
        gsi1pk: `SHOPPING#CATEGORY#${args.category}`,
        gsi1sk: args.brand,
        ...item,
      }),
    }),
  );

  return item;
}

async function handleAdminAddAffiliateLink(
  args: {
    itemId: string;
    retailer: string;
    url: string;
    commissionRate: number;
  },
  identity: SAIdentity,
): Promise<AffiliateLink> {
  if (!isAdmin(identity)) throw new Error("ADMIN required");

  const link: AffiliateLink = {
    id: randomUUID(),
    retailer: args.retailer,
    url: args.url,
    commissionRate: args.commissionRate,
    isActive: true,
  };

  // In production, would update the item with new link
  return link;
}

// ────────────────────────────────────────────────────────────
// AppSync Lambda resolver entrypoint
// ────────────────────────────────────────────────────────────

export const handler = async (event: any) => {
  console.log("ShoppingResolverFn event", JSON.stringify(event));

  const fieldName = event.info?.fieldName as string | undefined;

  try {
    switch (fieldName) {
      case "findExactItem":
        return await handleFindExactItem(event.arguments);

      case "sceneShoppableItems":
        return await handleSceneShoppableItems(event.arguments);

      case "videoShoppableItems":
        return await handleVideoShoppableItems(event.arguments);

      case "myShoppingCart":
        return await handleMyShoppingCart(event.identity);

      case "addToCart":
        return await handleAddToCart(event.arguments, event.identity);

      case "removeFromCart":
        return await handleRemoveFromCart(event.arguments, event.identity);

      case "adminCreateShoppableItem":
        return await handleAdminCreateShoppableItem(event.arguments, event.identity);

      case "adminAddAffiliateLink":
        return await handleAdminAddAffiliateLink(event.arguments, event.identity);

      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (err: any) {
    console.error("ShoppingResolverFn error", err);
    throw err;
  }
};
