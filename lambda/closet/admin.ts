// lambda/closet/admin.ts
//
// AppSync "admin" Lambda for closet moderation:
//   - Query.adminListPending   (returns PENDING / APPROVED / PUBLISHED items)
//   - Query.closetFeed         (public fan feed: APPROVED / PUBLISHED)
//   - Mutation.adminApproveItem
//   - Mutation.adminRejectItem
//   - Mutation.adminSetClosetAudience

import {
  DynamoDBClient,
  UpdateItemCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

type ClosetStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED";
type ClosetAudience = "PUBLIC" | "BESTIE" | "EXCLUSIVE";

type ClosetItem = {
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
};

type AppSyncEvent = {
  info: { fieldName: string; parentTypeName: string };
  arguments: any;
};

// ---------- helpers ----------

function mapClosetItem(raw: any): ClosetItem {
  const it = unmarshall(raw) as any;
  return {
    id: String(it.id),
    userId: String(it.userId ?? it.ownerSub ?? ""),
    ownerSub: String(it.ownerSub ?? it.userId ?? ""),
    status: (it.status ?? "PENDING") as ClosetStatus,
    createdAt: String(it.createdAt),
    updatedAt: String(it.updatedAt ?? it.createdAt),
    mediaKey: it.mediaKey ?? null,
    title: it.title ?? null,
    reason: it.reason ?? null,
    audience: (it.audience ?? "PUBLIC") as ClosetAudience,
  };
}

/**
 * Locate an item by id.
 *
 * We keep this simple and just Scan by "id" so we don't have to guess
 * your exact pk/sk pattern.
 */
async function findRawItemById(id: string) {
  const resp = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "#id = :id",
      ExpressionAttributeNames: {
        "#id": "id",
      },
      ExpressionAttributeValues: {
        ":id": { S: id },
      },
      Limit: 1,
    }),
  );

  if (!resp.Items || resp.Items.length === 0) return null;
  return resp.Items[0];
}

/** Extract pk/sk from a table record (DataStack uses pk/sk). */
function pkOf(raw: any) {
  if (raw.pk?.S && raw.sk?.S) {
    return { pk: raw.pk.S as string, sk: raw.sk.S as string };
  }
  throw new Error("Could not infer pk/sk for closet item");
}

// ---------- shared query helpers ----------

/**
 * Internal helper to query the closet GSI with an arbitrary filter on status.
 */
async function queryClosetByStatus(
  statusFilter: ("PENDING" | "APPROVED" | "PUBLISHED")[],
): Promise<ClosetItem[]> {
  const resp = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": "gsi1pk",
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":pk": { S: "CLOSET" },
        ":pending": { S: "PENDING" },
        ":approved": { S: "APPROVED" },
        ":published": { S: "PUBLISHED" },
      },
      FilterExpression:
        statusFilter.length === 3
          ? "#status = :pending OR #status = :approved OR #status = :published"
          : statusFilter.length === 2
          ? "#status = :approved OR #status = :published"
          : "#status = :approved",
      ScanIndexForward: false, // newest first
    }),
  );

  return (resp.Items || []).map(mapClosetItem);
}

// ---------- resolvers ----------

/**
 * Return all closet items that the admin might care about:
 * PENDING, APPROVED, or PUBLISHED items that live on the gsi1 index
 * under gsi1pk = "CLOSET" (same pattern as the fan feed).
 */
async function adminListPending(): Promise<ClosetItem[]> {
  return queryClosetByStatus(["PENDING", "APPROVED", "PUBLISHED"]);
}

/**
 * Public fan-facing closet feed:
 * only APPROVED / PUBLISHED items, ordered newest-first.
 */
async function publicClosetFeed(): Promise<ClosetItem[]> {
  try {
    return await queryClosetByStatus(["APPROVED", "PUBLISHED"]);
  } catch (err) {
    console.error("[ClosetAdminFn] publicClosetFeed error", err);
    // Return empty list on error so the UI shows "no items" instead of exploding.
    return [];
  }
}

async function adminApproveItem(args: { id: string }): Promise<ClosetItem> {
  const base = await findRawItemById(args.id);
  if (!base) {
    throw new Error(`Closet item not found for id=${args.id}`);
  }

  const { pk, sk } = pkOf(base);
  const now = new Date().toISOString();

  const resp = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: { S: pk }, sk: { S: sk } },
      UpdateExpression:
        "SET #status = :approved, #updatedAt = :now REMOVE #reason",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
        "#reason": "reason",
      },
      ExpressionAttributeValues: {
        ":approved": { S: "APPROVED" },
        ":now": { S: now },
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!resp.Attributes) {
    throw new Error("adminApproveItem: update returned no attributes");
  }
  return mapClosetItem(resp.Attributes);
}

async function adminRejectItem(args: {
  id: string;
  reason?: string | null;
}): Promise<ClosetItem> {
  const base = await findRawItemById(args.id);
  if (!base) {
    throw new Error(`Closet item not found for id=${args.id}`);
  }

  const { pk, sk } = pkOf(base);
  const now = new Date().toISOString();
  const hasReason = !!args.reason && args.reason.trim().length > 0;

  const resp = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: { S: pk }, sk: { S: sk } },
      UpdateExpression: hasReason
        ? "SET #status = :rejected, #updatedAt = :now, #reason = :reason"
        : "SET #status = :rejected, #updatedAt = :now REMOVE #reason",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
        "#reason": "reason",
      },
      ExpressionAttributeValues: {
        ":rejected": { S: "REJECTED" },
        ":now": { S: now },
        ...(hasReason ? { ":reason": { S: args.reason! } } : {}),
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!resp.Attributes) {
    throw new Error("adminRejectItem: update returned no attributes");
  }
  return mapClosetItem(resp.Attributes);
}

/**
 * Set visibility for a closet item (PUBLIC / BESTIE / EXCLUSIVE).
 */
async function adminSetClosetAudience(
  args: { id: string; audience: ClosetAudience },
): Promise<ClosetItem> {
  const base = await findRawItemById(args.id);
  if (!base) {
    throw new Error(`Closet item not found for id=${args.id}`);
  }

  const { pk, sk } = pkOf(base);
  const now = new Date().toISOString();

  const resp = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: { S: pk }, sk: { S: sk } },
      UpdateExpression: "SET #audience = :aud, #updatedAt = :now",
      ExpressionAttributeNames: {
        "#audience": "audience",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":aud": { S: args.audience },
        ":now": { S: now },
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!resp.Attributes) {
    throw new Error("adminSetClosetAudience: update returned no attributes");
  }
  return mapClosetItem(resp.Attributes);
}

// ---------- handler ----------

export const handler = async (event: AppSyncEvent) => {
  const { fieldName, parentTypeName } = event.info;

  if (parentTypeName === "Query") {
    if (fieldName === "adminListPending") {
      return adminListPending();
    }
    if (fieldName === "closetFeed") {
      // Fan-facing closet feed
      return publicClosetFeed();
    }
  }

  if (parentTypeName === "Mutation") {
    if (fieldName === "adminApproveItem") {
      return adminApproveItem(event.arguments);
    }
    if (fieldName === "adminRejectItem") {
      return adminRejectItem(event.arguments);
    }
    if (fieldName === "adminSetClosetAudience") {
      return adminSetClosetAudience(event.arguments);
    }
  }

  throw new Error(
    `Unknown field ${parentTypeName}.${fieldName} in ClosetAdminFn`,
  );
};
