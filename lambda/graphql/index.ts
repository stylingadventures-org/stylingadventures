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
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";

const ddbMarshal = (value: any) =>
  marshall(value, { removeUndefinedValues: true });

const TABLE_NAME = process.env.TABLE_NAME!;
const APPROVAL_SM_ARN = process.env.APPROVAL_SM_ARN!;
const BG_CHANGE_SM_ARN = process.env.BG_CHANGE_SM_ARN!;
const STORY_PUBLISH_SM_ARN = process.env.STORY_PUBLISH_SM_ARN!;
const STATUS_GSI = process.env.STATUS_GSI ?? "gsi1"; // status index name

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});
const eb = new EventBridgeClient({});

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

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

type UserTier = "FREE" | "BESTIE" | "CREATOR" | "COLLAB" | "ADMIN" | "PRIME";

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

  // Categorization fields
  category?: string | null;
  subcategory?: string | null;

  // Story-style metadata (Bestie / fan-facing)
  storyTitle?: string;
  storySeason?: string;
  storyVibes?: string[];

  // Bestie / profile highlight
  pinned?: boolean;

  // Bestie: pending background change
  pendingBackgroundKey?: string | null;

  // Community feed flag (Lala’s Closet front page)
  inCommunityFeed?: boolean;

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

type ClosetFeedSort = "NEWEST" | "MOST_LOVED";

type ClosetFeedArgs = {
  limit?: number | null;
  sort?: ClosetFeedSort | null;
};

type ClosetConnection = {
  items: ClosetItem[];
  nextToken: string | null;
};

interface Story {
  id: string;
  userId: string;
  ownerSub: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  status: "DRAFT" | "PENDING_PUBLISH" | "PUBLISHED" | "ARCHIVED";
  closetItemIds?: string[];
  scheduledAt?: string | null;
}

// ────────────────────────────────────────────────────────────
// Small helpers
// ────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function pkForUser(userId: string) {
  return `USER#${userId}`;
}

function skForClosetItem(id: string) {
  return `CLOSET#${id}`;
}

function skForStory(id: string) {
  return `STORY#${id}`;
}

// Root partition for item-level aggregates (likes, comments, favorites, etc.)
function pkForClosetRoot(closetItemId: string) {
  return `CLOSET#${closetItemId}`;
}

function gsi1ForStatus(status: ClosetStatus) {
  return `CLOSET#STATUS#${status}`;
}

function extractIdFromSk(sk: unknown): string | undefined {
  if (typeof sk !== "string") return undefined;
  if (sk.startsWith("CLOSET#")) {
    const maybeId = sk.slice("CLOSET#".length);
    return maybeId || undefined;
  }
  return sk;
}

/**
 * Fire a BestieEngagement event to EventBridge.
 * Engagement Lambda consumes these.
 */
async function putEngagementEvent(detail: any) {
  try {
    await eb.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "stylingadventures.besties",
            DetailType: "BestieEngagement",
            Detail: JSON.stringify(detail),
          },
        ],
      }),
    );
  } catch (err) {
    console.error("Failed to put engagement event", err);
  }
}

/**
 * Map a raw DynamoDB item into our ClosetItem shape.
 * Defensive so we never return null for non-nullable GraphQL fields.
 */
function mapClosetItem(raw: Record<string, any>): ClosetItem {
  const item = unmarshall(raw) as any;

  const id: string =
    item.id ?? extractIdFromSk(item.sk) ?? randomUUID(); // last-ditch fallback (keeps GraphQL ID non-null)

  // Fallbacks between userId and ownerSub so we always have an owner
  const inferredUserFromPk =
    typeof item.pk === "string" && item.pk.startsWith("USER#")
      ? item.pk.slice("USER#".length)
      : undefined;

  const userId: string =
    item.userId ?? item.ownerSub ?? inferredUserFromPk ?? "UNKNOWN";

  const ownerSub: string =
    item.ownerSub ?? item.userId ?? inferredUserFromPk ?? "UNKNOWN";

  const createdAt: string =
    item.createdAt ?? item.updatedAt ?? new Date(0).toISOString();
  const updatedAt: string = item.updatedAt ?? createdAt;

  const status: ClosetStatus = item.status ?? "DRAFT";

  const closetItem: ClosetItem = {
    id,
    userId,
    ownerSub,
    status,
    createdAt,
    updatedAt,
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
    pendingBackgroundKey: item.pendingBackgroundKey,
    inCommunityFeed: item.inCommunityFeed,
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

function getUserTier(identity: any): UserTier {
  const claims = identity?.claims || {};

  // Prefer explicit tier claim if present.
  the
  const tierClaim =
    (claims["custom:tier"] as string | undefined) ||
    (claims["tier"] as string | undefined);

  let tier: UserTier = "FREE";
  if (
    tierClaim &&
    ["FREE", "BESTIE", "CREATOR", "COLLAB", "ADMIN", "PRIME"].includes(
      tierClaim,
    )
  ) {
    tier = tierClaim as UserTier;
  }

  // Fallback: infer from cognito groups if present.
  const rawGroups = claims["cognito:groups"];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : String(rawGroups || "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

  if (groups.includes("ADMIN")) return "ADMIN";
  if (groups.includes("COLLAB")) return "COLLAB";
  if (groups.includes("PRIME")) return "PRIME";
  if (groups.includes("CREATOR")) return "CREATOR";
  if (groups.includes("BESTIE")) return "BESTIE";

  return tier;
}

function requireBestieTier(identity: any): UserTier {
  const tier = getUserTier(identity);
  const allowed: UserTier[] = ["BESTIE", "CREATOR", "COLLAB", "ADMIN", "PRIME"];
  if (!allowed.includes(tier)) {
    throw new Error("Bestie tier required");
  }
  return tier;
}

// ────────────────────────────────────────────────────────────
// 1) myCloset – return all items owned by the current user.
//    Now returns a ClosetConnection.
// ────────────────────────────────────────────────────────────

async function handleMyCloset(identity: any): Promise<ClosetConnection> {
  const sub = requireUserSub(identity);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForUser(sub),
        ":sk": "CLOSET#",
      }),
    }),
  );

  const items = (res.Items ?? [])
    .map(mapClosetItem)
    .filter((ci) => ci.id && ci.id !== "undefined");

  return {
    items,
    nextToken: null,
  };
}

// Bestie closet paginated connection – for now, just wraps myCloset
// Explicitly returns ClosetConnection.
async function handleBestieClosetItems(
  args: { limit?: number | null; nextToken?: string | null },
  identity: any,
): Promise<ClosetConnection> {
  // reuse existing logic for user's closet
  const myClosetConnection = await handleMyCloset(identity);
  const allItems = myClosetConnection.items;

  const limit =
    args.limit && args.limit > 0
      ? Math.min(args.limit, allItems.length)
      : allItems.length;

  const items = allItems.slice(0, limit);

  // No real pagination yet, so always null
  return {
    items,
    nextToken: null,
  };
}

// ────────────────────────────────────────────────────────────
// 2) createClosetItem – create a new item in DRAFT.
// ────────────────────────────────────────────────────────────

async function handleCreateClosetItem(
  args: {
    input: {
      title?: string;
      description?: string | null; // kept for schema compatibility
      story?: string | null; // legacy field
      audience?: ClosetAudience;
      mediaKey?: string;
      rawMediaKey?: string;
      category?: string | null;
      subcategory?: string | null;
    };
  },
  identity: any,
): Promise<ClosetItem> {
  const sub = requireUserSub(identity);
  const id = randomUUID();
  const now = nowIso();

  const input = args.input;

  const item: ClosetItem = {
    id,
    userId: sub,
    ownerSub: sub,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    mediaKey: input.mediaKey ?? undefined,
    rawMediaKey: input.rawMediaKey ?? undefined,
    title: input.title ?? undefined,
    category: input.category ?? null,
    subcategory: input.subcategory ?? null,
    audience: input.audience ?? "PRIVATE",
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
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

// ────────────────────────────────────────────────────────────
// 3) updateClosetMediaKey – update mediaKey on an item owned by the user.
// ────────────────────────────────────────────────────────────

async function handleUpdateClosetMediaKey(
  args: { closetItemId: string; mediaKey: string },
  identity: any,
): Promise<ClosetItem> {
  const sub = requireUserSub(identity);
  const now = nowIso();

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(sub),
        sk: skForClosetItem(args.closetItemId),
      }),
      UpdateExpression:
        "SET mediaKey = :mediaKey, updatedAt = :updatedAt, gsi1pk = :gsi1pk, gsi1sk = :gsi1sk",
      ExpressionAttributeValues: ddbMarshal({
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

// ────────────────────────────────────────────────────────────
// 4) requestClosetApproval – mark DRAFT→PENDING and kick off Step Functions.
// ────────────────────────────────────────────────────────────

async function handleRequestClosetApproval(
  args: { closetItemId: string },
  identity: any,
): Promise<ClosetItem> {
  const sub = requireUserSub(identity);
  const now = nowIso();

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(sub),
        sk: skForClosetItem(args.closetItemId),
      }),
      ConditionExpression: "status = :draft",
      UpdateExpression:
        "SET status = :pending, updatedAt = :updatedAt, gsi1pk = :gsi1pk, gsi1sk = :gsi1sk",
      ExpressionAttributeValues: ddbMarshal({
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

  return item;
}

// ────────────────────────────────────────────────────────────
// 5) updateClosetItemStory – Bestie-side metadata (legacy/simple version).
// ────────────────────────────────────────────────────────────

async function handleUpdateClosetItemStory(
  args: { closetItemId: string; story: string },
  identity: any,
): Promise<ClosetItem> {
  const sub = requireUserSub(identity);
  const { closetItemId, story } = args;

  const now = nowIso();

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(sub),
        sk: skForClosetItem(closetItemId),
      }),
      UpdateExpression:
        "SET storyTitle = :storyTitle, updatedAt = :updatedAt",
      ExpressionAttributeValues: ddbMarshal({
        ":storyTitle": story,
        ":updatedAt": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Item not found");
  }

  return mapClosetItem(res.Attributes);
}

// ────────────────────────────────────────────────────────────
// Helper: load closet item by id (scan by sk).
// ────────────────────────────────────────────────────────────

async function loadClosetItemById(
  closetItemId: string,
): Promise<{ base: ClosetItem; ownerId: string }> {
  const scanRes = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "sk = :sk",
      ExpressionAttributeValues: ddbMarshal({
        ":sk": skForClosetItem(closetItemId),
      }),
    }),
  );

  const raw = (scanRes.Items ?? [])[0];
  if (!raw) {
    throw new Error("Closet item not found");
  }

  const base = mapClosetItem(raw);
  const ownerId = base.userId;
  if (!ownerId) {
    throw new Error("Closet item missing owner");
  }

  return { base, ownerId };
}

// ────────────────────────────────────────────────────────────
// 6) likeClosetItem – public like/heart interaction (legacy).
// ────────────────────────────────────────────────────────────

async function handleLikeClosetItem(
  args: { closetItemId: string },
  identity: any,
): Promise<ClosetItem> {
  const viewerSub = requireUserSub(identity);
  const { closetItemId } = args;
  const now = nowIso();

  const { ownerId } = await loadClosetItemById(closetItemId);

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
        Item: ddbMarshal(likeItem),
        // de-dupe per viewer
        ConditionExpression: "attribute_not_exists(sk)",
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
      Key: ddbMarshal({
        pk: pkForUser(ownerId),
        sk: skForClosetItem(closetItemId),
      }),
      UpdateExpression:
        "SET likeCount = if_not_exists(likeCount, :zero) + :one, updatedAt = :now",
      ExpressionAttributeValues: ddbMarshal({
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

  // Engagement: increment like analytics
  await putEngagementEvent({
    action: "LIKED",
    closetItemId,
    ownerSub: ownerId,
    actorSub: viewerSub,
    delta: 1,
  });

  return item;
}

// ────────────────────────────────────────────────────────────
// 7) commentOnClosetItem – COMMENT child + bump commentCount
// ────────────────────────────────────────────────────────────

async function handleCommentOnClosetItem(
  args: { closetItemId: string; text: string },
  identity: any,
): Promise<ClosetItemComment> {
  const authorSub = requireUserSub(identity);
  const { closetItemId, text } = args;
  const now = nowIso();
  const commentId = randomUUID();

  const { ownerId } = await loadClosetItemById(closetItemId);

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

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal(commentItem),
    }),
  );

  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(ownerId),
        sk: skForClosetItem(closetItemId),
      }),
      UpdateExpression:
        "SET commentCount = if_not_exists(commentCount, :zero) + :one, updatedAt = :now",
      ExpressionAttributeValues: ddbMarshal({
        ":zero": 0,
        ":one": 1,
        ":now": now,
      }),
    }),
  );

  const comment: ClosetItemComment = {
    id: commentId,
    closetItemId,
    authorSub,
    text,
    createdAt: now,
  };

  // Engagement: comment analytics
  await putEngagementEvent({
    action: "COMMENTED",
    closetItemId,
    ownerSub: ownerId,
    actorSub: authorSub,
    commentId,
    commentText: text,
  });

  return comment;
}

// ────────────────────────────────────────────────────────────
// 8) pinHighlight – owner (or admin) can pin/unpin a closet item.
// ────────────────────────────────────────────────────────────

async function handlePinHighlight(
  args: { closetItemId: string; pinned: boolean },
  identity: any,
): Promise<ClosetItem> {
  const callerSub = requireUserSub(identity);
  const admin = isAdminIdentity(identity);

  const closetItemId = args.closetItemId;
  const pinned = !!args.pinned;

  if (!closetItemId) {
    throw new Error("closetItemId is required");
  }

  const { base } = await loadClosetItemById(closetItemId);

  if (!admin && base.userId !== callerSub) {
    throw new Error("Not authorized to pin this closet item.");
  }

  const now = nowIso();

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(base.userId),
        sk: skForClosetItem(base.id),
      }),
      UpdateExpression: "SET pinned = :pinned, updatedAt = :now",
      ExpressionAttributeValues: ddbMarshal({
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

// ────────────────────────────────────────────────────────────
// 9) closetItemComments – query all COMMENT# children
// ────────────────────────────────────────────────────────────

async function handleClosetItemComments(args: {
  closetItemId: string;
}): Promise<ClosetItemComment[]> {
  const { closetItemId } = args;

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForClosetRoot(closetItemId),
        ":sk": "COMMENT#",
      }),
    }),
  );

  const items = (res.Items ?? []).map((raw) => unmarshall(raw) as any);

  return items.map((item) => ({
    id: (item.sk as string).replace("COMMENT#", ""),
    closetItemId: item.closetItemId,
    authorSub: item.authorSub,
    text: item.text,
    createdAt: item.createdAt,
  }));
}

// ────────────────────────────────────────────────────────────
// 10) adminClosetItemLikes – admin view of LIKE children
// ────────────────────────────────────────────────────────────

async function handleAdminClosetItemLikes(args: {
  closetItemId: string;
}): Promise<ClosetItemLike[]> {
  const { closetItemId } = args;

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: ddbMarshal({
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

// ────────────────────────────────────────────────────────────
// 11) adminClosetItemComments – alias for closetItemComments
// ────────────────────────────────────────────────────────────

async function handleAdminClosetItemComments(args: {
  closetItemId: string;
}): Promise<ClosetItemComment[]> {
  return handleClosetItemComments(args);
}

// ────────────────────────────────────────────────────────────
// 12) toggleWishlistItem – viewer's wishlist for a closet item.
// ────────────────────────────────────────────────────────────

async function handleToggleWishlistItem(
  args: { closetItemId: string; on?: boolean | null },
  identity: any,
): Promise<ClosetItem> {
  const viewerSub = requireUserSub(identity);
  const { closetItemId, on } = args;
  const now = nowIso();

  const { ownerId } = await loadClosetItemById(closetItemId);

  const wishlistPk = pkForUser(viewerSub);
  const wishlistSk = `WISHLIST#${closetItemId}`;

  // Turning OFF
  if (on === false) {
    await ddb.send(
      new DeleteItemCommand({
        TableName: TABLE_NAME,
        Key: ddbMarshal({
          pk: wishlistPk,
          sk: wishlistSk,
        }),
      }),
    );

    let updated: ClosetItem | undefined;

    try {
      const res = await ddb.send(
        new UpdateItemCommand({
          TableName: TABLE_NAME,
          Key: ddbMarshal({
            pk: pkForUser(ownerId),
            sk: skForClosetItem(closetItemId),
          }),
          UpdateExpression:
            "SET wishlistCount = if_not_exists(wishlistCount, :zero) - :one, updatedAt = :now",
          ConditionExpression: "wishlistCount >= :one",
          ExpressionAttributeValues: ddbMarshal({
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
      const fallbackRes = await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: ddbMarshal({
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

    updated.viewerHasWishlisted = false;

    // Engagement: wishlist off
    await putEngagementEvent({
      action: "WISHLIST_TOGGLED",
      closetItemId,
      ownerSub: ownerId,
      actorSub: viewerSub,
      delta: -1,
    });

    return updated;
  }

  // Turning ON (or default toggle-on)
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
        Item: ddbMarshal(wishlistItem),
        // de-dupe per viewer+item
        ConditionExpression: "attribute_not_exists(sk)",
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
      Key: ddbMarshal({
        pk: pkForUser(ownerId),
        sk: skForClosetItem(closetItemId),
      }),
      UpdateExpression:
        "SET wishlistCount = if_not_exists(wishlistCount, :zero) + :one, updatedAt = :now",
      ExpressionAttributeValues: ddbMarshal({
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

  // Engagement: wishlist on
  await putEngagementEvent({
    action: "WISHLIST_TOGGLED",
    closetItemId,
    ownerSub: ownerId,
    actorSub: viewerSub,
    delta: 1,
  });

  return item;
}

// ────────────────────────────────────────────────────────────
// 13) myWishlist – viewer's wishlist expanded to ClosetItem
//     Now returns a ClosetConnection.
// ────────────────────────────────────────────────────────────

async function handleMyWishlist(identity: any): Promise<ClosetConnection> {
  const viewerSub = requireUserSub(identity);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForUser(viewerSub),
        ":sk": "WISHLIST#",
      }),
    }),
  );

  const entries = (res.Items ?? []).map((raw) => unmarshall(raw) as any);

  if (!entries.length) {
    return {
      items: [],
      nextToken: null,
    };
  }

  const keys = entries.map((e) => ({
    pk: pkForUser(e.ownerSub),
    sk: skForClosetItem(e.closetItemId),
  }));

  const batchRes = await ddb.send(
    new BatchGetItemCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: keys.map((k) => ddbMarshal(k)),
        },
      },
    }),
  );

  const itemsRaw = batchRes.Responses?.[TABLE_NAME] ?? [];
  const closetItems = itemsRaw.map(mapClosetItem);

  for (const ci of closetItems) {
    ci.viewerHasWishlisted = true;
  }

  return {
    items: closetItems,
    nextToken: null,
  };
}

// ────────────────────────────────────────────────────────────
// 14) pinnedClosetItems – child resolver for GameProfile.pinnedClosetItems
// ────────────────────────────────────────────────────────────

async function handlePinnedClosetItems(event: any): Promise<ClosetItem[]> {
  const source = event.source || {};
  const identity = event.identity || {};

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
      ExpressionAttributeValues: ddbMarshal({
        ":pk": pkForUser(userId),
        ":sk": "CLOSET#",
        ":true": true,
        ":published": "PUBLISHED",
      }),
    }),
  );

  return (res.Items ?? []).map(mapClosetItem);
}

// ────────────────────────────────────────────────────────────
// 15) closetFeed – public community feed for Lala’s Closet
//     (Already returning ClosetConnection.)
// ────────────────────────────────────────────────────────────

async function handleClosetFeed(event: any): Promise<ClosetConnection> {
  const args: ClosetFeedArgs = event?.arguments || {};
  const sort: ClosetFeedSort = args.sort || "NEWEST";

  const limit =
    args.limit && args.limit > 0 && args.limit <= 50 ? args.limit : 24;

  const statuses: ClosetStatus[] = ["APPROVED", "PUBLISHED"];
  const collected: ClosetItem[] = [];

  for (const status of statuses) {
    const resp = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: STATUS_GSI,
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: ddbMarshal({
          ":pk": gsi1ForStatus(status),
        }),
        ScanIndexForward: false, // newest first
        Limit: limit * 2,
      }),
    );

    const chunk = (resp.Items ?? []).map(mapClosetItem);
    collected.push(...chunk);
  }

  // Only show fan-facing looks (PUBLIC audience).
  const filtered = collected.filter((item) => {
    const statusOk =
      item.status === "APPROVED" || item.status === "PUBLISHED";

    const audience =
      (item.audience as ClosetAudience | undefined) ?? "PUBLIC";
    const audienceOk = audience === "PUBLIC";

    return statusOk && audienceOk;
  });

  // De-dupe by id in case an item appears twice
  const byId = new Map<string, ClosetItem>();
  for (const it of filtered) {
    if (!byId.has(it.id)) {
      byId.set(it.id, it);
    }
  }

  const unique = Array.from(byId.values());

  unique.sort((a, b) => {
    const aCreated = a.createdAt || "";
    const bCreated = b.createdAt || "";

    if (sort === "MOST_LOVED") {
      const af = a.favoriteCount ?? 0;
      const bf = b.favoriteCount ?? 0;
      if (bf !== af) return bf - af;
      return bCreated.localeCompare(aCreated);
    }

    // NEWEST
    return bCreated.localeCompare(aCreated);
  });

  const pageItems = unique.slice(0, limit);

  // For now we don't paginate beyond this, so nextToken is always null.
  return {
    items: pageItems,
    nextToken: null,
  };
}

// ────────────────────────────────────────────────────────────
// 16) toggleFavoriteClosetItem – hearts in fan closet feed
// ────────────────────────────────────────────────────────────

async function handleToggleFavoriteClosetItem(
  args: { id: string; favoriteOn?: boolean | null },
  identity: any,
): Promise<ClosetItem> {
  const viewerSub = requireUserSub(identity);
  const { id: closetItemId, favoriteOn } = args;
  const now = nowIso();

  const { ownerId } = await loadClosetItemById(closetItemId);

  const pkRoot = pkForClosetRoot(closetItemId);
  const skFavorite = `FAVORITE#${viewerSub}`;

  // Turning OFF
  if (favoriteOn === false) {
    await ddb.send(
      new DeleteItemCommand({
        TableName: TABLE_NAME,
        Key: ddbMarshal({
          pk: pkRoot,
          sk: skFavorite,
        }),
      }),
    );

    let updated: ClosetItem | undefined;

    try {
      const res = await ddb.send(
        new UpdateItemCommand({
          TableName: TABLE_NAME,
          Key: ddbMarshal({
            pk: pkForUser(ownerId),
            sk: skForClosetItem(closetItemId),
          }),
          UpdateExpression:
            "SET favoriteCount = if_not_exists(favoriteCount, :zero) - :one, updatedAt = :now",
          ConditionExpression: "favoriteCount >= :one",
          ExpressionAttributeValues: ddbMarshal({
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
      const fallbackRes = await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "pk = :pk AND sk = :sk",
          ExpressionAttributeValues: ddbMarshal({
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

    updated.viewerHasFaved = false;
    return updated;
  }

  // Turning ON (or default toggle-on)
  const favoriteItem = {
    pk: pkRoot,
    sk: skFavorite,
    entityType: "FAVORITE",
    closetItemId,
    ownerSub: ownerId,
    viewerSub,
    createdAt: now,
  };

  try {
    await ddb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: ddbMarshal(favoriteItem),
        // de-dupe per viewer
        ConditionExpression: "attribute_not_exists(sk)",
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
      Key: ddbMarshal({
        pk: pkForUser(ownerId),
        sk: skForClosetItem(closetItemId),
      }),
      UpdateExpression:
        "SET favoriteCount = if_not_exists(favoriteCount, :zero) + :one, updatedAt = :now",
      ExpressionAttributeValues: ddbMarshal({
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
  item.viewerHasFaved = true;
  return item;
}

// ────────────────────────────────────────────────────────────
// 17) requestClosetBackgroundChange – Besties-only, kicks BG SM
// ────────────────────────────────────────────────────────────

async function handleRequestClosetBackgroundChange(
  args: {
    closetItemId: string;
    requestedBackgroundKey?: string | null;
    mode?: string | null;
  },
  identity: any,
): Promise<ClosetItem> {
  requireBestieTier(identity);
  const callerSub = requireUserSub(identity);
  const { closetItemId, requestedBackgroundKey, mode } = args;
  const now = nowIso();

  const { base } = await loadClosetItemById(closetItemId);

  if (base.userId !== callerSub && !isAdminIdentity(identity)) {
    throw new Error("Not authorized to change background for this item");
  }

  // Persist pending background metadata on the closet item
  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(base.userId),
        sk: skForClosetItem(base.id),
      }),
      UpdateExpression:
        "SET pendingBackgroundKey = :bg, updatedAt = :now",
      ExpressionAttributeValues: ddbMarshal({
        ":bg": requestedBackgroundKey ?? null,
        ":now": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Closet item not found while setting background");
  }

  const updated = mapClosetItem(res.Attributes);

  await sfn.send(
    new StartExecutionCommand({
      stateMachineArn: BG_CHANGE_SM_ARN,
      input: JSON.stringify({
        closetItemId: updated.id,
        userId: updated.userId,
        ownerSub: updated.ownerSub,
        requestedBackgroundKey: requestedBackgroundKey ?? null,
        mode: mode ?? "REPLACE",
      }),
    }),
  );

  return updated;
}

// ────────────────────────────────────────────────────────────
// 18) createStory – Besties story creation (DRAFT)
// ────────────────────────────────────────────────────────────

async function handleCreateStory(
  args: {
    input: {
      title?: string | null;
      closetItemIds?: string[] | null;
      scheduledAt?: string | null;
    };
  },
  identity: any,
): Promise<Story> {
  requireBestieTier(identity);
  const sub = requireUserSub(identity);
  const now = nowIso();
  const storyId = randomUUID();

  const input = args.input || {};
  const story: Story = {
    id: storyId,
    userId: sub,
    ownerSub: sub,
    title: input.title ?? undefined,
    createdAt: now,
    updatedAt: now,
    status: "DRAFT",
    closetItemIds: input.closetItemIds ?? [],
    scheduledAt: input.scheduledAt ?? null,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForUser(sub),
        sk: skForStory(storyId),
        entityType: "STORY",
        ...story,
      }),
    }),
  );

  return story;
}

// ────────────────────────────────────────────────────────────
// 19) publishStory – Besties story publish (kicks Story SM)
// ────────────────────────────────────────────────────────────

async function handlePublishStory(
  args: {
    storyId: string;
    scheduledAt?: string | null;
  },
  identity: any,
): Promise<Story> {
  requireBestieTier(identity);
  const sub = requireUserSub(identity);
  const { storyId, scheduledAt } = args;
  const now = nowIso();

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(sub),
        sk: skForStory(storyId),
      }),
      UpdateExpression:
        "SET #status = :pending, updatedAt = :now, scheduledAt = :scheduledAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: ddbMarshal({
        ":pending": "PENDING_PUBLISH",
        ":now": now,
        ":scheduledAt": scheduledAt ?? null,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Story not found");
  }

  const story = unmarshall(res.Attributes) as Story;

  await sfn.send(
    new StartExecutionCommand({
      stateMachineArn: STORY_PUBLISH_SM_ARN,
      input: JSON.stringify({
        storyId: story.id,
        userId: story.userId,
        ownerSub: story.ownerSub,
        scheduledAt: story.scheduledAt ?? null,
      }),
    }),
  );

  return story;
}

// ────────────────────────────────────────────────────────────
// 20) addClosetItemToCommunityFeed – Besties-only
// ────────────────────────────────────────────────────────────

async function handleAddClosetItemToCommunityFeed(
  args: { closetItemId: string },
  identity: any,
): Promise<ClosetItem> {
  requireBestieTier(identity);
  const callerSub = requireUserSub(identity);
  const { closetItemId } = args;
  const now = nowIso();

  const { base } = await loadClosetItemById(closetItemId);

  if (base.userId !== callerSub && !isAdminIdentity(identity)) {
    throw new Error("Not authorized to feature this item");
  }

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(base.userId),
        sk: skForClosetItem(base.id),
      }),
      UpdateExpression:
        "SET inCommunityFeed = :true, updatedAt = :now",
      ExpressionAttributeValues: ddbMarshal({
        ":true": true,
        ":now": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Closet item not found");
  }

  const updated = mapClosetItem(res.Attributes);

  // Engagement: create COMMUNITY_FEED record via Engagement Lambda
  await putEngagementEvent({
    action: "COMMUNITY_FEATURED",
    closetItemId,
    ownerSub: base.userId,
    actorSub: callerSub,
  });

  return updated;
}

// ────────────────────────────────────────────────────────────
// 21) removeClosetItemFromCommunityFeed – Besties-only
// ────────────────────────────────────────────────────────────

async function handleRemoveClosetItemFromCommunityFeed(
  args: { closetItemId: string },
  identity: any,
): Promise<ClosetItem> {
  requireBestieTier(identity);
  const callerSub = requireUserSub(identity);
  const { closetItemId } = args;
  const now = nowIso();

  const { base } = await loadClosetItemById(closetItemId);

  if (base.userId !== callerSub && !isAdminIdentity(identity)) {
    throw new Error("Not authorized to unfeature this item");
  }

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(base.userId),
        sk: skForClosetItem(base.id),
      }),
      UpdateExpression:
        "SET inCommunityFeed = :false, updatedAt = :now",
      ExpressionAttributeValues: ddbMarshal({
        ":false": false,
        ":now": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Closet item not found");
  }

  return mapClosetItem(res.Attributes);
}

// ────────────────────────────────────────────────────────────
// 22) shareClosetItemToPinterest – fire-and-forget event record
// ────────────────────────────────────────────────────────────

async function handleShareClosetItemToPinterest(
  args: { closetItemId: string },
  identity: any,
): Promise<boolean> {
  requireBestieTier(identity);
  const sharerSub = requireUserSub(identity);
  const { closetItemId } = args;
  const now = nowIso();

  const { ownerId } = await loadClosetItemById(closetItemId);

  const shareItem = {
    pk: pkForClosetRoot(closetItemId),
    sk: `PINTEREST_SHARE#${randomUUID()}`,
    entityType: "PINTEREST_SHARE",
    closetItemId,
    itemOwnerSub: ownerId,
    sharerSub,
    createdAt: now,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal(shareItem),
    }),
  );

  // Engagement: let EngagementFn track Pinterest share analytics
  await putEngagementEvent({
    action: "PINTEREST_SHARE_REQUESTED",
    closetItemId,
    ownerSub: ownerId,
    actorSub: sharerSub,
  });

  // Downstream worker (EventBridge/Streams) can do the actual API call
  return true;
}

// ────────────────────────────────────────────────────────────
// AppSync Lambda resolver entrypoint
// ────────────────────────────────────────────────────────────

export const handler = async (event: any) => {
  console.log("ClosetResolverFn event", JSON.stringify(event));

  const fieldName = event.info?.fieldName as string | undefined;

  try {
    switch (fieldName) {
      case "myCloset":
        return await handleMyCloset(event.identity);

      case "bestieClosetItems":
        return await handleBestieClosetItems(
          event.arguments || {},
          event.identity,
        );

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

      case "pinnedClosetItems":
        return await handlePinnedClosetItems(event);

      case "closetFeed":
        return await handleClosetFeed(event);

      case "toggleFavoriteClosetItem":
        return await handleToggleFavoriteClosetItem(
          event.arguments,
          event.identity,
        );

      // NEW Besties workflows
      case "requestClosetBackgroundChange":
        return await handleRequestClosetBackgroundChange(
          event.arguments,
          event.identity,
        );

      case "createStory":
        return await handleCreateStory(event.arguments, event.identity);

      case "publishStory":
        return await handlePublishStory(event.arguments, event.identity);

      case "addClosetItemToCommunityFeed":
        return await handleAddClosetItemToCommunityFeed(
          event.arguments,
          event.identity,
        );

      case "removeClosetItemFromCommunityFeed":
        return await handleRemoveClosetItemFromCommunityFeed(
          event.arguments,
          event.identity,
        );

      case "shareClosetItemToPinterest":
        return await handleShareClosetItemToPinterest(
          event.arguments,
          event.identity,
        );

      default:
        throw new Error(`Unsupported field: ${fieldName}`);
    }
  } catch (err) {
    console.error("Error in ClosetResolverFn", err);
    throw err;
  }
};



