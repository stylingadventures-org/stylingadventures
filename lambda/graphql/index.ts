import {
  BatchGetItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";

const TABLE_NAME = process.env.TABLE_NAME!;
const APPROVAL_SM_ARN = process.env.APPROVAL_SM_ARN!;
const STATUS_GSI = process.env.STATUS_GSI ?? "gsi1";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

type ClosetStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | "ARCHIVED";

type ClosetAudience =
  | "PRIVATE"
  | "FOLLOWERS"
  | "PUBLIC"
  | "BESTIE"
  | "EXCLUSIVE"
  | "ADMIN_ONLY"
  | "HIDDEN";

interface ClosetItem {
  id: string;
  userId: string;
  ownerSub: string;
  status: ClosetStatus;
  createdAt: string;
  updatedAt: string;

  // S3 keys
  mediaKey?: string;
  rawMediaKey?: string;

  title?: string;
  reason?: string;
  audience?: ClosetAudience;

  // New categorization fields
  category?: string | null;
  subcategory?: string | null;

  // Story-style metadata (Bestie / fan-facing)
  storyTitle?: string;
  storySeason?: string;
  storyVibes?: string[];

  // Bestie / profile highlight
  pinned?: boolean;

  // Aggregates
  favoriteCount?: number;
  likeCount?: number;
  commentCount?: number;
  wishlistCount?: number;

  // Per-viewer flags (set by resolvers)
  viewerHasFaved?: boolean;
  viewerHasLiked?: boolean;
  viewerHasWishlisted?: boolean;
}

interface ClosetItemComment {
  id: string;
  closetItemId: string;
  authorSub: string;
  text: string;
  createdAt: string;
}

interface ClosetItemLike {
  closetItemId: string;
  likerSub: string;
  createdAt: string;
}

function nowIso() {
  return new Date().toISOString();
}

function pkForUser(userId: string) {
  return `USER#${userId}`;
}

function skForClosetItem(id: string) {
  return `CLOSET#${id}`;
}

// Root partition for item-level aggregates (likes, comments, etc.)
function pkForClosetRoot(closetItemId: string) {
  return `CLOSET#${closetItemId}`;
}

function gsi1ForStatus(status: ClosetStatus) {
  return `CLOSET#STATUS#${status}`;
}

/**
 * Map a raw DynamoDB item into our ClosetItem shape.
 */
function mapClosetItem(raw: Record<string, any>): ClosetItem {
  const item = unmarshall(raw) as any;

  // IMPORTANT: fallbacks between userId and ownerSub so we always have an owner
  const userId: string =
    item.userId ??
    item.ownerSub ??
    (typeof item.pk === "string" && item.pk.startsWith("USER#")
      ? item.pk.slice("USER#".length)
      : "");

  const ownerSub: string =
    item.ownerSub ??
    item.userId ??
    (typeof item.pk === "string" && item.pk.startsWith("USER#")
      ? item.pk.slice("USER#".length)
      : "");

  const closetItem: ClosetItem = {
    id: item.id,
    userId,
    ownerSub,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    mediaKey: item.mediaKey,
    rawMediaKey: item.rawMediaKey,
    title: item.title,
    reason: item.reason,
    audience: item.audience,
    category: item.category,
    subcategory: item.subcategory,
    storyTitle: item.storyTitle,
    storySeason: item.storySeason,
    storyVibes: item.storyVibes,
    pinned: item.pinned,
    favoriteCount: item.favoriteCount,
    likeCount: item.likeCount,
    commentCount: item.commentCount,
    wishlistCount: item.wishlistCount,
    viewerHasFaved: item.viewerHasFaved,
    viewerHasLiked: item.viewerHasLiked,
    viewerHasWishlisted: item.viewerHasWishlisted,
  };

  return closetItem;
}

/**
 * Ensure the caller is authenticated and return sub/userId.
 */
function requireUserSub(identity: any): string {
  if (!identity?.sub) {
    throw new Error("Not authenticated");
  }
  return identity.sub as string;
}

// helper: check if identity is admin/collab
function isAdminIdentity(identity: any): boolean {
  const claims = identity?.claims || {};
  const raw = claims["cognito:groups"];
  const groups = Array.isArray(raw)
    ? raw
    : String(raw || "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

  return groups.includes("ADMIN") || groups.includes("COLLAB");
}

/**
 * 1) myCloset – return all items owned by the current user.
 */
async function handleMyCloset(identity: any): Promise<ClosetItem[]> {
  const sub = requireUserSub(identity);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: marshall({
        ":pk": pkForUser(sub),
        ":sk": "CLOSET#",
      }),
    }),
  );

  return (res.Items ?? []).map(mapClosetItem);
}

/**
 * 2) createClosetItem – create a new item in DRAFT.
 *    We now accept rawMediaKey = FULL S3 key (including "closet/" prefix)
 *    and optional category/subcategory.
 */
async function handleCreateClosetItem(
  args: {
    title?: string;
    mediaKey?: string;
    rawMediaKey?: string;
    category?: string | null;
    subcategory?: string | null;
  },
  identity: any,
): Promise<ClosetItem> {
  const sub = requireUserSub(identity);
  const id = randomUUID();
  const now = nowIso();

  const item: ClosetItem = {
    id,
    userId: sub,
    ownerSub: sub,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    mediaKey: args.mediaKey,
    rawMediaKey: args.rawMediaKey,
    title: args.title,
    category: args.category ?? null,
    subcategory: args.subcategory ?? null,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        pk: pkForUser(sub),
        sk: skForClosetItem(id),

        // status GSI
        gsi1pk: gsi1ForStatus(item.status),
        gsi1sk: now,

        // rawMediaKey GSI uses "rawMediaKey" as its partition key
        // (index name is RAW_MEDIA_GSI_NAME = "rawMediaKeyIndex" on the table)
        rawMediaKey: item.rawMediaKey,

        ...item,
      }),
    }),
  );

  return item;
}

/**
 * 3) updateClosetMediaKey – update the media key on an item owned by the user.
 *    rawMediaKey stays the same; bg-worker updates mediaKey after cutout.
 */
async function handleUpdateClosetMediaKey(
  args: { id: string; mediaKey: string },
  identity: any,
): Promise<ClosetItem> {
  const sub = requireUserSub(identity);
  const now = nowIso();

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        pk: pkForUser(sub),
        sk: skForClosetItem(args.id),
      }),
      UpdateExpression:
        "SET mediaKey = :mediaKey, updatedAt = :updatedAt, gsi1pk = :gsi1pk, gsi1sk = :gsi1sk",
      ExpressionAttributeValues: marshall({
        ":mediaKey": args.mediaKey,
        ":updatedAt": now,
        ":gsi1pk": gsi1ForStatus("DRAFT"),
        ":gsi1sk": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Item not found");
  }

  return mapClosetItem(res.Attributes);
}

/**
 * 4) requestClosetApproval – mark DRAFT→PENDING and kick off Step Functions.
 */
async function handleRequestClosetApproval(
  args: { id: string },
  identity: any,
): Promise<string> {
  const sub = requireUserSub(identity);
  const now = nowIso();

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        pk: pkForUser(sub),
        sk: skForClosetItem(args.id),
      }),
      ConditionExpression: "status = :draft",
      UpdateExpression:
        "SET status = :pending, updatedAt = :updatedAt, gsi1pk = :gsi1pk, gsi1sk = :gsi1sk",
      ExpressionAttributeValues: marshall({
        ":draft": "DRAFT",
        ":pending": "PENDING",
        ":updatedAt": now,
        ":gsi1pk": gsi1ForStatus("PENDING"),
        ":gsi1sk": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Item not found or not in DRAFT status");
  }

  const item = mapClosetItem(res.Attributes);

  // Fire-and-forget Step Functions execution
  await sfn.send(
    new StartExecutionCommand({
      stateMachineArn: APPROVAL_SM_ARN,
      input: JSON.stringify({
        itemId: item.id,
        userId: item.userId,
        ownerSub: item.ownerSub,
      }),
    }),
  );

  return item.id;
}

/**
 * 5) updateClosetItemStory – Bestie-side metadata for fan-facing view.
 */
async function handleUpdateClosetItemStory(
  args: {
    input: {
      id: string;
      storyTitle?: string | null;
      storySeason?: string | null;
      storyVibes?: (string | null)[] | null;
    };
  },
  identity: any,
): Promise<ClosetItem> {
  const sub = requireUserSub(identity);
  const { id, storyTitle, storySeason, storyVibes } = args.input;

  const now = nowIso();

  const updateExpressions: string[] = ["updatedAt = :updatedAt"];
  const expressionValues: Record<string, any> = {
    ":updatedAt": now,
  };

  if (storyTitle !== undefined) {
    updateExpressions.push("storyTitle = :storyTitle");
    expressionValues[":storyTitle"] = storyTitle;
  }

  if (storySeason !== undefined) {
    updateExpressions.push("storySeason = :storySeason");
    expressionValues[":storySeason"] = storySeason;
  }

  if (storyVibes !== undefined) {
    updateExpressions.push("storyVibes = :storyVibes");
    expressionValues[":storyVibes"] = storyVibes?.filter(
      (v): v is string => !!v,
    );
  }

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        pk: pkForUser(sub),
        sk: skForClosetItem(id),
      }),
      UpdateExpression: "SET " + updateExpressions.join(", "),
      ExpressionAttributeValues: marshall(expressionValues),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Item not found");
  }

  return mapClosetItem(res.Attributes);
}

/**
 * 6) likeClosetItem – public like/heart interaction.
 *
 * - Child row: pk = CLOSET#<closetItemId>, sk = LIKE#<viewerSub>
 * - Parent row: pk = USER#<ownerId>, sk = CLOSET#<closetItemId>
 */
async function handleLikeClosetItem(
  args: { input: { ownerId: string; closetItemId: string } },
  identity: any,
): Promise<ClosetItem> {
  const viewerSub = requireUserSub(identity);
  const { ownerId, closetItemId } = args.input;
  const now = nowIso();

  // 1) Insert LIKE child row (idempotent using ConditionalCheckFailedException)
  const likeItem = {
    pk: pkForClosetRoot(closetItemId),
    sk: `LIKE#${viewerSub}`,
    entityType: "LIKE",
    itemOwnerSub: ownerId,
    likerSub: viewerSub,
    createdAt: now,
  };

  try {
    await ddb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall(likeItem),
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
  } catch (err: any) {
    // If the like already exists, ignore; otherwise bubble up
    if (err?.name !== "ConditionalCheckFailedException") {
      throw err;
    }
  }

  // 2) Increment likeCount on the closet item row
  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        pk: pkForUser(ownerId),
        sk: skForClosetItem(closetItemId),
      }),
      UpdateExpression:
        "SET likeCount = if_not_exists(likeCount, :zero) + :one, updatedAt = :now",
      ExpressionAttributeValues: marshall({
        ":zero": 0,
        ":one": 1,
        ":now": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Closet item not found");
  }

  const item = mapClosetItem(res.Attributes);
  item.viewerHasLiked = true;
  return item;
}

/**
 * 7) commentOnClosetItem – create a new COMMENT child and bump commentCount.
 */
async function handleCommentOnClosetItem(
  args: { input: { ownerId: string; closetItemId: string; text: string } },
  identity: any,
): Promise<ClosetItemComment> {
  const authorSub = requireUserSub(identity);
  const { ownerId, closetItemId, text } = args.input;
  const now = nowIso();
  const commentId = randomUUID();

  const commentItem = {
    pk: pkForClosetRoot(closetItemId),
    sk: `COMMENT#${commentId}`,
    entityType: "COMMENT",
    closetItemId,
    itemOwnerSub: ownerId,
    authorSub,
    text,
    createdAt: now,
  };

  // 1) Put the comment item
  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(commentItem),
    }),
  );

  // 2) Increment commentCount on the closet item row
  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        pk: pkForUser(ownerId),
        sk: skForClosetItem(closetItemId),
      }),
      UpdateExpression:
        "SET commentCount = if_not_exists(commentCount, :zero) + :one, updatedAt = :now",
      ExpressionAttributeValues: marshall({
        ":zero": 0,
        ":one": 1,
        ":now": now,
      }),
    }),
  );

  // 3) Return GraphQL comment type
  const comment: ClosetItemComment = {
    id: commentId,
    closetItemId,
    authorSub,
    text,
    createdAt: now,
  };

  return comment;
}

/**
 * 8) pinHighlight – owner (or admin) can pin/unpin a closet item.
 *
 * GraphQL calls this as:
 *   pinHighlight(closetItemId: ID!, pinned: Boolean!)
 */
async function handlePinHighlight(
  args: {
    input?: { closetItemId?: string; pinned?: boolean };
    closetItemId?: string;
    pinned?: boolean;
  },
  identity: any,
): Promise<ClosetItem> {
  const callerSub = requireUserSub(identity);
  const admin = isAdminIdentity(identity);

  // Support both shapes: with or without `input`
  const src = (args.input as any) || (args as any);
  const closetItemId = src.closetItemId as string | undefined;
  const pinned = !!src.pinned;

  if (!closetItemId) {
    throw new Error("closetItemId is required");
  }

  // 1) Find the closet item row by sk = CLOSET#<id>
  const scanRes = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "sk = :sk",
      ExpressionAttributeValues: marshall({
        ":sk": skForClosetItem(closetItemId),
      }),
    }),
  );

  const raw = (scanRes.Items ?? [])[0];
  if (!raw) {
    throw new Error("Closet item not found");
  }

  const base = mapClosetItem(raw);

  // 2) Auth: non-admins can only pin their own looks
  if (!admin && base.userId !== callerSub) {
    throw new Error("Not authorized to pin this closet item.");
  }

  const now = nowIso();

  // 3) Update pinned flag on the actual item row
  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        pk: pkForUser(base.userId),
        sk: skForClosetItem(base.id),
      }),
      UpdateExpression: "SET pinned = :pinned, updatedAt = :now",
      ExpressionAttributeValues: marshall({
        ":pinned": pinned,
        ":now": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Closet item not found after update");
  }

  return mapClosetItem(res.Attributes);
}

/**
 * 9) closetItemComments – query all COMMENT# children for a closet item.
 */
async function handleClosetItemComments(args: {
  closetItemId: string;
}): Promise<ClosetItemComment[]> {
  const { closetItemId } = args;

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: marshall({
        ":pk": pkForClosetRoot(closetItemId),
        ":sk": "COMMENT#",
      }),
    }),
  );

  const items = (res.Items ?? []).map((raw) => unmarshall(raw) as any);

  return items.map((item) => ({
    id: item.sk.replace("COMMENT#", ""),
    closetItemId: item.closetItemId,
    authorSub: item.authorSub,
    text: item.text,
    createdAt: item.createdAt,
  }));
}

/**
 * 10) adminClosetItemLikes – admin view of all LIKE children under pk=CLOSET#id
 */
async function handleAdminClosetItemLikes(args: {
  closetItemId: string;
}): Promise<ClosetItemLike[]> {
  const { closetItemId } = args;

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: marshall({
        ":pk": pkForClosetRoot(closetItemId),
        ":sk": "LIKE#",
      }),
    }),
  );

  const items = (res.Items ?? []).map((raw) => unmarshall(raw) as any);

  return items.map((item) => ({
    closetItemId,
    likerSub: item.likerSub,
    createdAt: item.createdAt,
  }));
}

/**
 * 11) adminClosetItemComments – alias for closetItemComments but admin-guarded.
 */
async function handleAdminClosetItemComments(args: {
  closetItemId: string;
}): Promise<ClosetItemComment[]> {
  return handleClosetItemComments(args);
}

/**
 * 12) toggleWishlistItem – viewer's wishlist for a closet item.
 *
 * - Wishlist row: pk = USER#<viewerSub>, sk = WISHLIST#<closetItemId>
 * - Parent row: pk = USER#<ownerId>,  sk = CLOSET#<closetItemId>
 */
async function handleToggleWishlistItem(
  args: {
    input: { ownerId: string; closetItemId: string; on?: boolean | null };
  },
  identity: any,
): Promise<ClosetItem> {
  const viewerSub = requireUserSub(identity);
  const { ownerId, closetItemId, on } = args.input;
  const now = nowIso();

  const wishlistPk = pkForUser(viewerSub);
  const wishlistSk = `WISHLIST#${closetItemId}`;

  // If on === false -> remove from wishlist (if exists) and decrement count.
  if (on === false) {
    // Delete wishlist entry (best-effort)
    await ddb.send(
      new DeleteItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({
          pk: wishlistPk,
          sk: wishlistSk,
        }),
      }),
    );

    // Decrement wishlistCount if >= 1
    let updated: ClosetItem | undefined;

    try {
      const res = await ddb.send(
        new UpdateItemCommand({
          TableName: TABLE_NAME,
          Key: marshall({
            pk: pkForUser(ownerId),
            sk: skForClosetItem(closetItemId),
          }),
          UpdateExpression:
            "SET wishlistCount = if_not_exists(wishlistCount, :zero) - :one, updatedAt = :now",
          ConditionExpression: "wishlistCount >= :one",
          ExpressionAttributeValues: marshall({
            ":zero": 0,
            ":one": 1,
            ":now": now,
          }),
          ReturnValues: "ALL_NEW",
        }),
      );
      if (res.Attributes) {
        updated = mapClosetItem(res.Attributes);
      }
    } catch (err: any) {
      if (err?.name !== "ConditionalCheckFailedException") {
        throw err;
      }
      // If we hit the condition, we just fetch the item without changing count
      const fallbackRes = await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: marshall({
            ":pk": pkForUser(ownerId),
            ":sk": skForClosetItem(closetItemId),
          }),
        }),
      );
      const itemRaw = (fallbackRes.Items ?? [])[0];
      if (itemRaw) {
        updated = mapClosetItem(itemRaw);
      }
    }

    if (!updated) {
      throw new Error("Closet item not found");
    }

    updated!.viewerHasWishlisted = false;
    return updated!;
  }

  // Default branch: add to wishlist (on === true or on === null)
  const wishlistItem = {
    pk: wishlistPk,
    sk: wishlistSk,
    entityType: "WISHLIST",
    closetItemId,
    ownerSub: ownerId,
    viewerSub,
    createdAt: now,
  };

  try {
    await ddb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall(wishlistItem),
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
  } catch (err: any) {
    if (err?.name !== "ConditionalCheckFailedException") {
      throw err;
    }
  }

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        pk: pkForUser(ownerId),
        sk: skForClosetItem(closetItemId),
      }),
      UpdateExpression:
        "SET wishlistCount = if_not_exists(wishlistCount, :zero) + :one, updatedAt = :now",
      ExpressionAttributeValues: marshall({
        ":zero": 0,
        ":one": 1,
        ":now": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Closet item not found");
  }

  const item = mapClosetItem(res.Attributes);
  item.viewerHasWishlisted = true;
  return item;
}

/**
 * 13) myWishlist – viewer's wishlist expanded to ClosetItem objects.
 */
async function handleMyWishlist(identity: any): Promise<ClosetItem[]> {
  const viewerSub = requireUserSub(identity);

  // 1) Fetch wishlist entries under USER#<viewerSub>
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: marshall({
        ":pk": pkForUser(viewerSub),
        ":sk": "WISHLIST#",
      }),
    }),
  );

  const entries = (res.Items ?? []).map((raw) => unmarshall(raw) as any);

  if (!entries.length) {
    return [];
  }

  // 2) Batch-get the referenced closet items
  const keys = entries.map((e) => ({
    pk: pkForUser(e.ownerSub),
    sk: skForClosetItem(e.closetItemId),
  }));

  const batchRes = await ddb.send(
    new BatchGetItemCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: keys.map((k) => marshall(k)),
        },
      },
    }),
  );

  const itemsRaw = batchRes.Responses?.[TABLE_NAME] ?? [];
  const closetItems = itemsRaw.map(mapClosetItem);

  // 3) Mark viewerHasWishlisted = true for each
  for (const ci of closetItems) {
    ci.viewerHasWishlisted = true;
  }

  return closetItems;
}

/**
 * 14) pinnedClosetItems – field resolver for GameProfile.pinnedClosetItems.
 *
 * Called as a child resolver with `event.source` being the GameProfile object.
 */
async function handlePinnedClosetItems(event: any): Promise<ClosetItem[]> {
  const source = event.source || {};
  const identity = event.identity || {};

  // Prefer explicit userId from GameProfile, fall back to identity.sub
  const userId: string | undefined =
    (source.userId as string | undefined) ||
    (source.id as string | undefined) ||
    (identity.sub as string | undefined);

  if (!userId) {
    throw new Error("Cannot resolve pinnedClosetItems: missing userId");
  }

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      FilterExpression: "#pinned = :true AND #status = :published",
      ExpressionAttributeNames: {
        "#pinned": "pinned",
        "#status": "status",
      },
      ExpressionAttributeValues: marshall({
        ":pk": pkForUser(userId),
        ":sk": "CLOSET#",
        ":true": true,
        ":published": "PUBLISHED",
      }),
    }),
  );

  return (res.Items ?? []).map(mapClosetItem);
}

/**
 * AppSync Lambda resolver entrypoint.
 */
export const handler = async (event: any) => {
  console.log("ClosetResolverFn event", JSON.stringify(event));

  const fieldName = event.info?.fieldName;

  try {
    switch (fieldName) {
      case "myCloset":
        return await handleMyCloset(event.identity);

      case "myWishlist":
        return await handleMyWishlist(event.identity);

      case "createClosetItem":
        return await handleCreateClosetItem(event.arguments, event.identity);

      case "updateClosetMediaKey":
        return await handleUpdateClosetMediaKey(
          event.arguments,
          event.identity,
        );

      case "requestClosetApproval":
        return await handleRequestClosetApproval(
          event.arguments,
          event.identity,
        );

      case "updateClosetItemStory":
        return await handleUpdateClosetItemStory(
          event.arguments,
          event.identity,
        );

      case "likeClosetItem":
        return await handleLikeClosetItem(event.arguments, event.identity);

      case "commentOnClosetItem":
        return await handleCommentOnClosetItem(
          event.arguments,
          event.identity,
        );

      case "pinHighlight":
        return await handlePinHighlight(event.arguments, event.identity);

      case "closetItemComments":
        return await handleClosetItemComments(event.arguments);

      case "adminClosetItemLikes":
        return await handleAdminClosetItemLikes(event.arguments);

      case "adminClosetItemComments":
        return await handleAdminClosetItemComments(event.arguments);

      case "toggleWishlistItem":
        return await handleToggleWishlistItem(
          event.arguments,
          event.identity,
        );

      // child resolver on GameProfile
      case "pinnedClosetItems":
        return await handlePinnedClosetItems(event);

      default:
        throw new Error(`Unsupported field: ${fieldName}`);
    }
  } catch (err: any) {
    console.error("Error in ClosetResolverFn", err);
    throw err;
  }
};
