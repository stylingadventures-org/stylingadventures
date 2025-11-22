// lambda/ClosetResolverFn.ts
import {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const TABLE_NAME =
  process.env.APP_TABLE || process.env.TABLE_NAME || undefined;
const GSI1_NAME =
  process.env.APP_GSI1_NAME || process.env.GSI1_NAME || "gsi1"; // OWNER#index
const GSI2_NAME =
  process.env.APP_GSI2_NAME || process.env.STATUS_GSI || "gsi2"; // STATUS#index

if (!TABLE_NAME) {
  // Fail fast at cold start if mis-configured
  throw new Error("ClosetResolverFn: TABLE_NAME/APP_TABLE env var is required");
}

// ----------------- Types matching schema -----------------

type ClosetStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED";

type ClosetAudience = "PUBLIC" | "BESTIE" | "EXCLUSIVE";

export type ClosetItem = {
  id: string;
  userId: string;
  ownerSub: string;
  status: ClosetStatus;
  createdAt: string;
  updatedAt: string;
  mediaKey?: string | null;
  rawMediaKey?: string | null;
  title?: string | null;
  reason?: string | null;
  audience?: ClosetAudience | null;

  // Story metadata
  storyTitle?: string | null;
  storySeason?: string | null;
  storyVibes?: string[] | null;

  // Engagement
  favoriteCount?: number | null;
  // We don't persist this yet, but we can return it to callers.
  viewerHasFaved?: boolean | null;
};

type ClosetFeedSort = "NEWEST" | "MOST_LOVED";

type ClosetFeedArgs = {
  limit?: number | null;
  sort?: ClosetFeedSort | null;
};

type UpdateStoryArgs = {
  input: {
    id: string;
    storyTitle?: string | null;
    storySeason?: string | null;
    storyVibes?: string[] | null;
  };
};

const ddb = new DynamoDBClient({});

// ----------------- Entry point -----------------

export const handler = async (event: any) => {
  const typeName: string = event?.info?.parentTypeName || "Query";
  const fieldName: string = event?.info?.fieldName;

  if (typeName === "Query") {
    switch (fieldName) {
      case "myCloset":
        return await safeMyCloset(event);

      case "adminListPending":
        return await safeAdminListPending();

      case "closetFeed":
        return await safeClosetFeed(event);

      default:
        break;
    }
  }

  if (typeName === "Mutation") {
    switch (fieldName) {
      case "updateClosetItemStory":
        return await safeUpdateClosetItemStory(
          event.arguments as UpdateStoryArgs
        );

      case "toggleFavoriteClosetItem":
        return await safeToggleFavoriteClosetItem(event); // <-- new case

      default:
        break;
    }
  }

  throw new Error(`ClosetResolver: Unknown field ${typeName}.${fieldName}`);
};

// ----------------- Safety wrappers -----------------

async function safeMyCloset(event: any): Promise<ClosetItem[]> {
  try {
    return await handleMyCloset(event);
  } catch (err) {
    console.error("myCloset resolver error", err);
    return [];
  }
}

async function safeAdminListPending(): Promise<ClosetItem[]> {
  try {
    return await handleAdminListPending();
  } catch (err) {
    console.error("adminListPending resolver error", err);
    return [];
  }
}

async function safeClosetFeed(event: any): Promise<ClosetItem[]> {
  try {
    return await handleClosetFeed(event);
  } catch (err) {
    console.error("closetFeed resolver error", err);
    return [];
  }
}

async function safeUpdateClosetItemStory(args: UpdateStoryArgs) {
  try {
    return await handleUpdateClosetItemStory(args);
  } catch (err) {
    console.error("updateClosetItemStory resolver error", err);
    throw err;
  }
}

// NEW: stubbed safety wrapper for toggleFavoriteClosetItem
async function safeToggleFavoriteClosetItem(
  event: any
): Promise<ClosetItem> {
  try {
    return await handleToggleFavoriteClosetItem(event);
  } catch (err) {
    console.error("toggleFavoriteClosetItem resolver error", err);
    throw err; // must throw, because return type is ClosetItem!
  }
}

// ----------------- Helpers -----------------

function getSubFromEvent(event: any): string {
  // AppSync Lambda resolver identity shapes can vary slightly
  const identity = event?.identity ?? {};
  return (
    identity.sub ||
    identity.username ||
    identity?.claims?.sub ||
    identity?.resolverContext?.userSub ||
    ""
  );
}

function getGroupsFromEvent(event: any): string[] {
  const claims = event?.identity?.claims;
  const fromClaims =
    claims?.["cognito:groups"] ||
    claims?.["custom:groups"] ||
    claims?.groups ||
    [];
  if (Array.isArray(fromClaims)) return fromClaims;
  if (typeof fromClaims === "string") return fromClaims.split(",");
  return [];
}

function isAdmin(event: any): boolean {
  const groups = getGroupsFromEvent(event);
  return groups.includes("ADMIN") || groups.includes("COLLAB");
}

// ----------------- Handlers -----------------

// Query.myCloset: items for the signed-in owner
async function handleMyCloset(event: any): Promise<ClosetItem[]> {
  const sub = getSubFromEvent(event);
  if (!sub) {
    console.warn("myCloset called without a user sub");
    return [];
  }

  const ownerPk = `OWNER#${sub}`;

  const resp = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: ownerPk },
      },
      ScanIndexForward: false, // newest first
      Limit: 50,
    })
  );

  const items = (resp.Items || []).map(
    (it) => unmarshall(it) as ClosetItem
  );

  return items;
}

// Query.adminListPending: moderation queue
async function handleAdminListPending(): Promise<ClosetItem[]> {
  const resp = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI2_NAME,
      KeyConditionExpression: "gsi2pk = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: "STATUS#PENDING" },
      },
      ScanIndexForward: true, // oldest first for review
      Limit: 50,
    })
  );

  const items = (resp.Items || []).map(
    (it) => unmarshall(it) as ClosetItem
  );

  return items;
}

// Query.closetFeed: public community feed (Lala's Closet)
async function handleClosetFeed(event: any): Promise<ClosetItem[]> {
  const args: ClosetFeedArgs = event?.arguments || {};
  const sort: ClosetFeedSort = args.sort || "NEWEST";

  const limit =
    args.limit && args.limit > 0 && args.limit <= 50 ? args.limit : 24;

  // We support APPROVED (and PUBLISHED if you later start using it).
  const statuses: ClosetStatus[] = ["APPROVED", "PUBLISHED"];
  const collected: ClosetItem[] = [];

  for (const status of statuses) {
    // For now we ignore pagination; just grab a slice from each status.
    const resp = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI2_NAME,
        KeyConditionExpression: "gsi2pk = :pk",
        ExpressionAttributeValues: {
          ":pk": { S: `STATUS#${status}` },
        },
        ScanIndexForward: false, // newest first
        Limit: limit * 2, // read a little extra before filtering/merging
      })
    );

    const chunk = (resp.Items || []).map(
      (it) => unmarshall(it) as ClosetItem
    );
    collected.push(...chunk);
  }

  // Enforce privacy: PUBLIC-only for the community feed
  const filtered = collected.filter((item) => {
    const statusOk =
      item.status === "APPROVED" || item.status === "PUBLISHED";

    const audience: ClosetAudience =
      (item.audience as ClosetAudience | null) || "PUBLIC";
    const audienceOk = audience === "PUBLIC";

    return statusOk && audienceOk;
  });

  // De-dupe by id in case an item appears under multiple statuses.
  const byId = new Map<string, ClosetItem>();
  for (const it of filtered) {
    if (!byId.has(it.id)) {
      byId.set(it.id, it);
    }
  }

  const unique = Array.from(byId.values());

  // Sort
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

  return unique.slice(0, limit);
}

// Mutation.updateClosetItemStory: Bestie saves story metadata
async function handleUpdateClosetItemStory(
  args: UpdateStoryArgs
): Promise<ClosetItem> {
  const { id, storyTitle, storySeason, storyVibes } = args.input || ({} as any);

  if (!id) {
    throw new Error("updateClosetItemStory: id is required");
  }

  // This mutation isn't fully implemented in this Lambda yet.
  // Keeping explicit error so we notice if the schema starts calling it here.
  throw new Error(
    "updateClosetItemStory is not implemented in ClosetResolverFn"
  );
}

// NEW: Mutation.toggleFavoriteClosetItem stub – returns a ClosetItem-shaped object
async function handleToggleFavoriteClosetItem(
  event: any
): Promise<ClosetItem> {
  const { id, favoriteOn } = event.arguments || {};
  if (!id) {
    throw new Error("toggleFavoriteClosetItem: id is required");
  }

  // TODO: real DynamoDB update logic here.
  // For now, you *must* return a ClosetItem-shaped object, not null.
  // Example super-simple placeholder:
  return {
    id,
    userId: "TEMP",
    ownerSub: "TEMP",
    status: "APPROVED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: "Temp favorite",
    favoriteCount: favoriteOn ? 1 : 0,
    viewerHasFaved: !!favoriteOn,
  };
}
