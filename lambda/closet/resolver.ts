// lambda/closet/resolver.ts
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
const STATUS_GSI = process.env.STATUS_GSI ?? "gsi1";

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

  mediaKey?: string;
  rawMediaKey?: string;

  title?: string;
  reason?: string;
  audience?: ClosetAudience;

  category?: string | null;
  subcategory?: string | null;

  storyTitle?: string;
  storySeason?: string;
  storyVibes?: string[];

  // Extra admin metadata
  season?: string | null;
  vibes?: string | null;

  // Bestie closet
  colorTags?: string[];
  notes?: string | null;
  visibility?: ClosetAudience;

  pinned?: boolean;
  pendingBackgroundKey?: string | null;
  inCommunityFeed?: boolean;

  favoriteCount?: number;
  likeCount?: number;
  commentCount?: number;
  wishlistCount?: number;

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
// Helpers
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

function mapClosetItem(raw: Record<string, any>): ClosetItem {
  const item = unmarshall(raw) as any;

  const id: string =
    item.id ?? extractIdFromSk(item.sk) ?? randomUUID();

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

  const visibility: ClosetAudience | undefined =
    item.visibility ?? item.audience;

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
    season: item.season,
    vibes: item.vibes,
    colorTags: item.colorTags,
    notes: item.notes,
    visibility,
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

function requireUserSub(identity: any): string {
  if (!identity?.sub) {
    throw new Error("Not authenticated");
  }
  return identity.sub as string;
}

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

// Load a closet item by its ID, regardless of owner, by scanning for CLOSET# prefix
async function loadClosetItemById(
  id: string,
): Promise<{ base: ClosetItem; ownerId: string }> {
  // Simple but effective: scan for the item with this id whose sk starts with CLOSET#
  const res = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "#id = :id AND begins_with(#sk, :sk)",
      ExpressionAttributeNames: {
        "#id": "id",
        "#sk": "sk",
      },
      ExpressionAttributeValues: ddbMarshal({
        ":id": id,
        ":sk": "CLOSET#",
      }),
      Limit: 1,
    }),
  );

  const raw = res.Items?.[0];
  if (!raw) {
    throw new Error("Closet item not found");
  }

  const base = mapClosetItem(raw);
  const ownerId = base.ownerSub || base.userId;
  if (!ownerId) {
    throw new Error("Closet item owner could not be determined");
  }

  return { base, ownerId };
}

function getUserTier(identity: any): UserTier {
  const claims = identity?.claims || {};

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
// 1) myCloset & bestieClosetItems
// ────────────────────────────────────────────────────────────

async function handleMyCloset(identity: any): Promise<ClosetItem[]> {
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

  return (res.Items ?? [])
    .map(mapClosetItem)
    .filter((ci) => ci.id && ci.id !== "undefined");
}

// Paginated bestie connection – for now just wraps myCloset
async function handleBestieClosetItems(
  args: { limit?: number | null; nextToken?: string | null },
  identity: any,
): Promise<{ items: ClosetItem[]; nextToken: string | null }> {
  const allItems = await handleMyCloset(identity);

  const limit =
    args.limit && args.limit > 0
      ? Math.min(args.limit, allItems.length)
      : allItems.length;

  const items = allItems.slice(0, limit);

  return {
    items,
    nextToken: null,
  };
}

// ────────────────────────────────────────────────────────────
// 1b) NEW – Bestie CRUD mutations
// ────────────────────────────────────────────────────────────

async function handleBestieCreateClosetItem(
  args: {
    input: {
      title?: string | null;
      rawMediaKey: string;
      category: string;
      colorTags?: string[] | null;
      season?: string | null;
      notes?: string | null;
      visibility?: ClosetAudience | null;
    };
  },
  identity: any,
): Promise<ClosetItem> {
  requireBestieTier(identity);
  const sub = requireUserSub(identity);
  const id = randomUUID();
  const now = nowIso();

  const input = args.input;
  const visibility: ClosetAudience = input.visibility ?? "PRIVATE";

  const item: ClosetItem = {
    id,
    userId: sub,
    ownerSub: sub,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    rawMediaKey: input.rawMediaKey,
    title: input.title ?? undefined,
    category: input.category,
    audience: visibility,
    visibility,
    colorTags: input.colorTags ?? [],
    season: input.season ?? null,
    notes: input.notes ?? null,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbMarshal({
        pk: pkForUser(sub),
        sk: skForClosetItem(id),
        gsi1pk: gsi1ForStatus(item.status),
        gsi1sk: now,
        rawMediaKey: item.rawMediaKey,
        ...item,
      }),
    }),
  );

  return item;
}

async function handleBestieUpdateClosetItem(
  args: {
    id: string;
    input: {
      title?: string | null;
      category?: string | null;
      colorTags?: string[] | null;
      season?: string | null;
      notes?: string | null;
      visibility?: ClosetAudience | null;
    };
  },
  identity: any,
): Promise<ClosetItem> {
  requireBestieTier(identity);
  const callerSub = requireUserSub(identity);
  const { id, input } = args;

  const { base, ownerId } = await loadClosetItemById(id);
  const admin = isAdminIdentity(identity);

  if (!admin && ownerId !== callerSub) {
    throw new Error("Not authorized to edit this closet item");
  }

  const now = nowIso();

  const setParts: string[] = ["updatedAt = :updatedAt"];
  const names: Record<string, string> = {};
  const values: any = { ":updatedAt": now };

  function setField(field: string, value: any, attrName?: string) {
    const name = attrName || field;
    setParts.push(`#${name} = :${name}`);
    names[`#${name}`] = field;
    values[`:${name}`] = value;
  }

  if ("title" in input) setField("title", input.title ?? null);
  if ("category" in input) setField("category", input.category ?? null);
  if ("colorTags" in input) setField("colorTags", input.colorTags ?? []);
  if ("season" in input) setField("season", input.season ?? null);
  if ("notes" in input) setField("notes", input.notes ?? null);
  if ("visibility" in input) {
    const vis = input.visibility ?? "PRIVATE";
    setField("audience", vis, "audience");
    setField("visibility", vis, "visibility");
  }

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(ownerId),
        sk: skForClosetItem(id),
      }),
      UpdateExpression: "SET " + setParts.join(", "),
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: ddbMarshal(values),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Closet item not found after update");
  }

  return mapClosetItem(res.Attributes);
}

async function handleBestieDeleteClosetItem(
  args: { id: string },
  identity: any,
): Promise<ClosetItem> {
  requireBestieTier(identity);
  const callerSub = requireUserSub(identity);
  const { id } = args;

  const { base, ownerId } = await loadClosetItemById(id);
  const admin = isAdminIdentity(identity);

  if (!admin && ownerId !== callerSub) {
    throw new Error("Not authorized to delete this closet item");
  }

  await ddb.send(
    new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: ddbMarshal({
        pk: pkForUser(ownerId),
        sk: skForClosetItem(id),
      }),
    }),
  );

  // TODO: optionally delete likes/comments/etc under pkForClosetRoot(id)

  return base;
}

// ────────────────────────────────────────────────────────────
// ... (rest of your existing handlers stay the same)
// ────────────────────────────────────────────────────────────

// keep all your existing handlers: createClosetItem, updateClosetMediaKey,
// requestClosetApproval, updateClosetItemStory, likeClosetItem,
// commentOnClosetItem, pinHighlight, closetItemComments,
// adminClosetItemLikes, adminClosetItemComments, toggleWishlistItem,
// handleMyWishlist, handlePinnedClosetItems, handleClosetFeed,
// handleToggleFavoriteClosetItem, handleRequestClosetBackgroundChange,
// handleCreateStory, handlePublishStory, handleAddClosetItemToCommunityFeed,
// handleRemoveClosetItemFromCommunityFeed, handleShareClosetItemToPinterest
// (use the file you pasted and just insert the new bits above)

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

      // NEW Bestie CRUD
      case "bestieCreateClosetItem":
        return await handleBestieCreateClosetItem(
          event.arguments,
          event.identity,
        );
      case "bestieUpdateClosetItem":
        return await handleBestieUpdateClosetItem(
          event.arguments,
          event.identity,
        );
      case "bestieDeleteClosetItem":
        return await handleBestieDeleteClosetItem(
          event.arguments,
          event.identity,
        );

      // ...all your existing cases stay as they were:
      // myWishlist, createClosetItem, updateClosetMediaKey, etc.
      // (keep the rest of your switch exactly as in your last pasted version)

      default:
        throw new Error(`Unsupported field: ${fieldName}`);
    }
  } catch (err) {
    console.error("Error in ClosetResolverFn", err);
    throw err;
  }
};
