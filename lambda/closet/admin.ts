import {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
  PutItemCommand,
  ScanCommand,
  AttributeValue,
  GetItemCommand,
  DeleteItemCommand,
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
  audience?: string | null;
  favoriteCount?: number;
  viewerHasFaved?: boolean;
};

type AdminCreateClosetItemInput = {
  title: string;
  rawMediaKey: string;
  season?: string | null;
  vibes?: string | null;
};

type AdminClosetItemsPage = {
  items: ClosetItem[];
  nextToken?: string | null;
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

function mapItem(raw: any, extra?: Partial<ClosetItem>): ClosetItem {
  const favoriteCountAttr = (raw.favoriteCount as any)?.N;
  const favoriteCount =
    typeof favoriteCountAttr === "string" ? Number(favoriteCountAttr) : 0;

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
    audience: raw.audience?.S ?? null,
    favoriteCount,
    viewerHasFaved: false,
    ...extra,
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

// simple base64 wrapper for LastEvaluatedKey
function encodeToken(key?: Record<string, AttributeValue>): string | null {
  if (!key) return null;
  return Buffer.from(JSON.stringify(key), "utf8").toString("base64");
}
function decodeToken(
  token?: string | null,
): Record<string, AttributeValue> | undefined {
  if (!token) return undefined;
  try {
    return JSON.parse(Buffer.from(String(token), "base64").toString("utf8"));
  } catch {
    return undefined;
  }
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
        "id, ownerSub, #s, createdAt, updatedAt, mediaKey, rawMediaKey, title, reason, season, vibes, audience, favoriteCount",
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

export const adminListClosetItems = async (
  event: AppSyncEvent,
): Promise<AdminClosetItemsPage> => {
  const { isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const { status, limit = 50, nextToken } = event.arguments || {};
  const exclusiveKey = decodeToken(nextToken);

  // If a specific status is provided, use gsi2 (STATUS index).
  if (status) {
    const out = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "gsi2",
        KeyConditionExpression: "gsi2pk = :p",
        ExpressionAttributeValues: { ":p": S(`STATUS#${status}`) },
        ScanIndexForward: false, // newest first
        ProjectionExpression:
          "id, ownerSub, #s, createdAt, updatedAt, mediaKey, rawMediaKey, title, reason, season, vibes, audience, favoriteCount",
        ExpressionAttributeNames: { "#s": "status" },
        Limit: limit,
        ExclusiveStartKey: exclusiveKey,
      }),
    );

    const items = (out.Items || []).map((it) =>
      mapItem({
        ...it,
        status: it["status"],
      }),
    );

    return {
      items,
      nextToken: encodeToken(out.LastEvaluatedKey),
    };
  }

  // Otherwise, do a (small) scan of ITEM# records.
  const out = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(pk, :p)",
      ExpressionAttributeValues: { ":p": S("ITEM#") },
      ProjectionExpression:
        "id, ownerSub, #s, createdAt, updatedAt, mediaKey, rawMediaKey, title, reason, season, vibes, audience, favoriteCount",
      ExpressionAttributeNames: { "#s": "status" },
      Limit: limit,
      ExclusiveStartKey: exclusiveKey,
    }),
  );

  const items = (out.Items || []).map((it) =>
    mapItem({
      ...it,
      status: it["status"],
    }),
  );

  // newest first
  items.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime(),
  );

  return {
    items,
    nextToken: encodeToken(out.LastEvaluatedKey),
  };
};

export const closetFeed = async (
  event: AppSyncEvent,
): Promise<ClosetItem[]> => {
  const { sub } = getIdentity(event); // ensure authed, capture viewer
  const { sort = "NEWEST" } = event.arguments || {};

  const [itemsOut, favOut] = await Promise.all([
    ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "gsi2",
        KeyConditionExpression: "gsi2pk = :p",
        ExpressionAttributeValues: { ":p": S("STATUS#PUBLISHED") },
        ScanIndexForward: sort === "NEWEST",
        ProjectionExpression:
          "id, ownerSub, #s, createdAt, updatedAt, mediaKey, rawMediaKey, title, audience, favoriteCount",
        ExpressionAttributeNames: { "#s": "status" },
      }),
    ),
    ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
        ExpressionAttributeValues: {
          ":pk": S(`FAV#${sub}`),
          ":sk": S("CLOSET#"),
        },
      }),
    ),
  ]);

  const favIds = new Set(
    (favOut.Items || []).map((f) => {
      const sk = f.sk?.S ?? "";
      if (sk.startsWith("CLOSET#")) {
        return sk.substring("CLOSET#".length);
      }
      return f.closetId?.S ?? "";
    }),
  );

  let items = (itemsOut.Items || []).map((it) =>
    mapItem(
      {
        ...it,
        status: it["status"],
      },
      {
        viewerHasFaved: favIds.has(it.id.S as string),
      },
    ),
  );

  if (sort === "MOST_LOVED") {
    items.sort((a, b) => {
      const af = a.favoriteCount ?? 0;
      const bf = b.favoriteCount ?? 0;
      if (bf !== af) return bf - af;
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });
  }

  return items;
};

export const topClosetLooks = async (
  event: AppSyncEvent,
): Promise<ClosetItem[]> => {
  // just reuse closetFeed, but always NEWEST
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
        favoriteCount: { N: "0" },
        ...(input.season ? { season: S(input.season) } : {}),
        ...(input.vibes ? { vibes: S(input.vibes) } : {}),
      },
    }),
  );

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
    audience: null,
    favoriteCount: 0,
    viewerHasFaved: false,
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
  // still a stub
  return "NOT_IMPLEMENTED";
};

export const toggleFavoriteClosetItem = async (
  event: AppSyncEvent,
): Promise<ClosetItem> => {
  const { sub } = getIdentity(event);

  const id = event.arguments?.id as string;
  const onArg = event.arguments?.on as boolean | null | undefined;
  if (!id) throw new Error("id required");

  // load base closet item
  const getOut = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
    }),
  );
  const base = getOut.Item;
  if (!base) throw new Error("Closet item not found");

  const favKey = { pk: S(`FAV#${sub}`), sk: S(`CLOSET#${id}`) };

  const favOut = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: favKey,
    }),
  );

  const currentlyOn = !!favOut.Item;
  const targetOn = typeof onArg === "boolean" ? onArg : !currentlyOn;

  const now = nowIso();
  let delta = 0;

  if (targetOn && !currentlyOn) {
    delta = 1;
    await ddb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          ...favKey,
          userSub: S(sub),
          closetId: S(id),
          createdAt: S(now),
        },
      }),
    );
  } else if (!targetOn && currentlyOn) {
    delta = -1;
    await ddb.send(
      new DeleteItemCommand({
        TableName: TABLE_NAME,
        Key: favKey,
      }),
    );
  }

  if (delta !== 0) {
    await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { pk: S(`ITEM#${id}`), sk: S("META") },
        UpdateExpression:
          "SET favoriteCount = if_not_exists(favoriteCount, :zero) + :delta, updatedAt = :u",
        ExpressionAttributeValues: {
          ":zero": { N: "0" },
          ":delta": { N: String(delta) },
          ":u": S(now),
        },
      }),
    );
  }

  const currentCountAttr = base.favoriteCount?.N;
  const currentCount =
    typeof currentCountAttr === "string" ? Number(currentCountAttr) : 0;
  const nextCount = Math.max(0, currentCount + delta);

  return mapItem(base, {
    favoriteCount: nextCount,
    viewerHasFaved: targetOn,
  });
};

/* ============== Dispatcher ============== */

export const handler = async (event: AppSyncEvent) => {
  const field = event.info.fieldName;

  if (field === "adminListPending") return adminListPending(event);
  if (field === "adminListClosetItems") return adminListClosetItems(event);
  if (field === "adminCreateClosetItem") return adminCreateClosetItem(event);
  if (field === "adminApproveItem") return adminApproveItem(event);
  if (field === "adminRejectItem") return adminRejectItem(event);
  if (field === "adminSetClosetAudience") return adminSetClosetAudience();
  if (field === "closetFeed") return closetFeed(event);
  if (field === "topClosetLooks") return topClosetLooks(event);
  if (field === "toggleFavoriteClosetItem")
    return toggleFavoriteClosetItem(event);

  throw new Error(`No resolver implemented for field ${field}`);
};
