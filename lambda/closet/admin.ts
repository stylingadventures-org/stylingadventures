import {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  SFNClient,
  SendTaskFailureCommand,
  SendTaskSuccessCommand,
} from "@aws-sdk/client-sfn";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

const { TABLE_NAME = "" } = process.env;
if (!TABLE_NAME) throw new Error("Missing env: TABLE_NAME");

const nowIso = () => new Date().toISOString();
const S = (v: string) => ({ S: v });

type AppSyncEvent = {
  info: { fieldName: string };
  arguments: any;
  identity?: any;
};

type ClosetStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "PUBLISHED";

type ClosetItem = {
  id: string;
  userId: string;
  ownerSub: string;
  status: ClosetStatus;
  createdAt: string;
  updatedAt: string;
  mediaKey: string;
  rawMediaKey?: string;
  title: string;
  reason?: string;
  season?: string | null;
  vibes?: string | null;
};

type AdminCreateClosetItemInput = {
  title: string;
  rawMediaKey: string;
  season?: string | null;
  vibes?: string | null;
};

function getIdentity(event: AppSyncEvent) {
  const claims = (event.identity as any)?.claims || {};
  const sub = (event.identity as any)?.sub || claims.sub;
  const groupsRaw = claims["cognito:groups"];
  const groups = Array.isArray(groupsRaw)
    ? groupsRaw
    : String(groupsRaw || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

  const isAdmin = groups.includes("ADMIN") || groups.includes("COLLAB");

  if (!sub) throw new Error("Unauthorized");

  return { sub, isAdmin };
}

function mapItem(raw: any): ClosetItem {
  return {
    id: raw.id.S!,
    userId: raw.ownerSub.S!,
    ownerSub: raw.ownerSub.S!,
    status: raw.status.S! as ClosetStatus,
    createdAt: raw.createdAt.S!,
    updatedAt: raw.updatedAt.S!,
    mediaKey: raw.mediaKey?.S ?? "",
    rawMediaKey: raw.rawMediaKey?.S ?? "",
    title: raw.title?.S ?? "",
    reason: raw.reason?.S ?? "",
    season: raw.season?.S ?? null,
    vibes: raw.vibes?.S ?? null,
  };
}

function randomId() {
  if ((globalThis as any).crypto?.randomUUID) {
    return (globalThis as any).crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* ============== Queries ============== */

export const adminListPending = async (
  event: AppSyncEvent,
): Promise<ClosetItem[]> => {
  const { isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi2", // STATUS index
      KeyConditionExpression: "gsi2pk = :p",
      ExpressionAttributeValues: { ":p": S("STATUS#PENDING") },
      ScanIndexForward: true,
      ProjectionExpression:
        "id, ownerSub, #s, createdAt, updatedAt, mediaKey, rawMediaKey, title, reason, season, vibes",
      ExpressionAttributeNames: { "#s": "status" },
    }),
  );

  return (out.Items || []).map((it) =>
    mapItem({
      ...it,
      status: it["status"],
    }),
  );
};

export const closetFeed = async (
  event: AppSyncEvent,
): Promise<ClosetItem[]> => {
  getIdentity(event); // ensures authed

  const { sort = "NEWEST" } = event.arguments || {};

  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi2",
      KeyConditionExpression: "gsi2pk = :p",
      ExpressionAttributeValues: { ":p": S("STATUS#PUBLISHED") },
      ScanIndexForward: sort === "NEWEST",
      ProjectionExpression:
        "id, ownerSub, #s, createdAt, updatedAt, mediaKey, rawMediaKey, title",
      ExpressionAttributeNames: { "#s": "status" },
    }),
  );

  const items = (out.Items || []).map((it) =>
    mapItem({
      ...it,
      status: it["status"],
    }),
  );

  // You can change this once you store loveCount
  if (sort === "MOST_LOVED") {
    return items;
  }

  return items;
};

export const topClosetLooks = async (
  event: AppSyncEvent,
): Promise<ClosetItem[]> => {
  return closetFeed({ ...event, arguments: { sort: "NEWEST" } });
};

/* ============== Mutations ============== */

export const adminCreateClosetItem = async (
  event: AppSyncEvent,
): Promise<ClosetItem> => {
  const { sub, isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const input = (event.arguments?.input || {}) as AdminCreateClosetItemInput;

  if (!input.title?.trim()) throw new Error("title is required");
  if (!input.rawMediaKey) throw new Error("rawMediaKey is required");

  const id = randomId();
  const now = nowIso();

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: S(`ITEM#${id}`),
        sk: S("META"),
        id: S(id),
        ownerSub: S(sub),
        gsi2pk: S("STATUS#PENDING"),
        gsi2sk: S(now),
        status: S("PENDING"),
        createdAt: S(now),
        updatedAt: S(now),
        title: S(input.title.trim()),
        rawMediaKey: S(input.rawMediaKey),
        ...(input.season ? { season: S(input.season) } : {}),
        ...(input.vibes ? { vibes: S(input.vibes) } : {}),
      },
    }),
  );

  // Return the created item
  return {
    id,
    userId: sub,
    ownerSub: sub,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
    title: input.title.trim(),
    mediaKey: "",
    rawMediaKey: input.rawMediaKey,
    reason: "",
    season: input.season ?? null,
    vibes: input.vibes ?? null,
  };
};

export const adminApproveItem = async (
  event: AppSyncEvent,
): Promise<ClosetItem> => {
  const { isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const id = event.arguments?.id as string;
  if (!id) throw new Error("id required");

  const now = nowIso();

  const out = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression:
        "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk REMOVE reason, approvalToken",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": S("APPROVED"),
        ":u": S(now),
        ":g2pk": S("STATUS#APPROVED"),
        ":g2sk": S(now),
      },
      ReturnValues: "ALL_OLD",
    }),
  );

  const prev = out.Attributes!;
  const token = prev.approvalToken?.S;

  if (token) {
    try {
      await sfn.send(
        new SendTaskSuccessCommand({
          taskToken: token,
          output: JSON.stringify({ approved: true }),
        }),
      );
    } catch {
      // ignore
    }
  }

  return mapItem({
    ...prev,
    status: S("APPROVED"),
  });
};

export const adminRejectItem = async (
  event: AppSyncEvent,
): Promise<ClosetItem> => {
  const { isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const id = event.arguments?.id as string;
  const reason = (event.arguments?.reason as string) || "";
  if (!id) throw new Error("id required");

  const now = nowIso();

  const out = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression:
        "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk, reason = :r REMOVE approvalToken",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": S("REJECTED"),
        ":u": S(now),
        ":g2pk": S("STATUS#REJECTED"),
        ":g2sk": S(now),
        ":r": S(reason),
      },
      ReturnValues: "ALL_OLD",
    }),
  );

  const prev = out.Attributes!;
  const token = prev.approvalToken?.S;

  if (token) {
    try {
      await sfn.send(
        new SendTaskFailureCommand({
          taskToken: token,
          error: "Rejected",
          cause: reason || "Rejected by admin",
        }),
      );
    } catch {
      // ignore
    }
  }

  return mapItem({
    ...prev,
    status: S("REJECTED"),
    reason: S(reason),
  });
};

export const adminSetClosetAudience = async (): Promise<string> => {
  // stub until you design audiences
  return "NOT_IMPLEMENTED";
};

/* ============== Dispatcher ============== */

export const handler = async (event: AppSyncEvent) => {
  const field = event.info.fieldName;

  if (field === "adminListPending") return adminListPending(event);
  if (field === "adminCreateClosetItem") return adminCreateClosetItem(event);
  if (field === "adminApproveItem") return adminApproveItem(event);
  if (field === "adminRejectItem") return adminRejectItem(event);
  if (field === "adminSetClosetAudience") return adminSetClosetAudience();
  if (field === "closetFeed") return closetFeed(event);
  if (field === "topClosetLooks") return topClosetLooks(event);

  throw new Error(`No resolver implemented for field ${field}`);
};
