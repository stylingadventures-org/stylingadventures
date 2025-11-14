// lambda/ClosetResolverFn.ts
import {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const ddb = new DynamoDBClient({});

// Base app table and GSIs (match lib/stacks/database-stack.ts)
const TABLE_NAME = process.env.APP_TABLE!;
const GSI1_NAME = process.env.APP_GSI1_NAME || "gsi1"; // OWNER#index
const GSI2_NAME = process.env.APP_GSI2_NAME || "gsi2"; // STATUS#index

// ----------------- Types matching schema -----------------

type ClosetStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "PUBLISHED";
type ClosetAudience = "PUBLIC" | "BESTIE" | "EXCLUSIVE";

export type ClosetItem = {
  id: string;
  userId: string;
  ownerSub: string;
  status: ClosetStatus;
  createdAt: string;
  updatedAt: string;
  mediaKey?: string | null;
  title?: string | null;
  reason?: string | null;
  audience?: ClosetAudience | null;

  // Story metadata
  storyTitle?: string | null;
  storySeason?: string | null;
  storyVibes?: string[] | null;
};

type ClosetFeedArgs = {
  limit?: number | null;
  nextToken?: string | null;
};

type UpdateStoryArgs = {
  input: {
    id: string;
    storyTitle?: string | null;
    storySeason?: string | null;
    storyVibes?: string[] | null;
  };
};

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
        return await safeClosetFeed(event.arguments || {});

      default:
        break;
    }
  }

  if (typeName === "Mutation") {
    switch (fieldName) {
      case "updateClosetItemStory":
        return await safeUpdateClosetItemStory(event.arguments as UpdateStoryArgs);

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

async function safeClosetFeed(args: ClosetFeedArgs) {
  try {
    return await handleClosetFeed(args);
  } catch (err) {
    console.error("closetFeed resolver error", err);
    return {
      items: [] as ClosetItem[],
      nextToken: null as string | null,
    };
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
async function handleClosetFeed(args: ClosetFeedArgs) {
  const limit =
    args.limit && args.limit > 0 && args.limit <= 50 ? args.limit : 12;

  // We support APPROVED (and PUBLISHED if you later start using it).
  const statuses: ClosetStatus[] = ["APPROVED", "PUBLISHED"];
  const collected: ClosetItem[] = [];

  for (const status of statuses) {
    // For now we ignore args.nextToken and just take a slice of
    // the merged results. That's fine for v1 of the feed.
    const resp = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI2_NAME,
        KeyConditionExpression: "gsi2pk = :pk",
        ExpressionAttributeValues: {
          ":pk": { S: `STATUS#${status}` },
        },
        ScanIndexForward: false, // newest first
        Limit: limit * 2, // read a little extra before filtering
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
      (item.audience as any as ClosetAudience) || "PUBLIC";
    const audienceOk = audience === "PUBLIC";

    return statusOk && audienceOk;
  });

  // Sort newest first by updatedAt (falls back to createdAt)
  filtered.sort((a, b) => {
    const aTime = a.updatedAt || a.createdAt || "";
    const bTime = b.updatedAt || b.createdAt || "";
    if (aTime < bTime) return 1;
    if (aTime > bTime) return -1;
    return 0;
  });

  const items = filtered.slice(0, limit);

  return {
    items,
    nextToken: null as string | null, // simple v1: no pagination yet
  };
}

// Mutation.updateClosetItemStory: Bestie saves story metadata
async function handleUpdateClosetItemStory(args: UpdateStoryArgs): Promise<ClosetItem> {
  const { id, storyTitle, storySeason, storyVibes } = args.input || ({} as any);

  if (!id) {
    throw new Error("updateClosetItemStory: id is required");
  }

  // NOTE: we assume owners are editing their own items from the Bestie UI.
  // Admin tooling could be extended later to allow cross-user edits.
  const ownerSub = (globalThis as any).__lambda_event_sub || ""; // placeholder
  // In practice we get the sub from the invocation event, not global.
  // This resolver is called via AppSync, so we need the full event.
  // We'll throw and let the safe wrapper handle missing identity;
  throw new Error(
    "updateClosetItemStory should be invoked via safeUpdateClosetItemStory with event context"
  );
}
