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
  StartExecutionCommand,
} from "@aws-sdk/client-sfn";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

const {
  TABLE_NAME = "",
  ADMIN_GROUP_NAME: ADMIN_GROUP_NAME_RAW = "admin",
  CREATOR_GROUP_NAME: CREATOR_GROUP_NAME_RAW = "creator",
} = process.env;

// ✅ explicit fan SM ARN (fallback to legacy APPROVAL_SM_ARN)
const FAN_APPROVAL_SM_ARN =
  process.env.FAN_APPROVAL_SM_ARN || process.env.APPROVAL_SM_ARN || "";

if (!TABLE_NAME) throw new Error("Missing env: TABLE_NAME");

const ADMIN_GROUP_NAME = ADMIN_GROUP_NAME_RAW.toLowerCase();
const CREATOR_GROUP_NAME = CREATOR_GROUP_NAME_RAW.toLowerCase();

const nowIso = () => new Date().toISOString();
const S = (v: string): AttributeValue => ({ S: v });

type AppSyncEvent = {
  info: { fieldName: string };
  arguments: any;
  identity?: any;
};

// ✅ MUST match GraphQL schema exactly
type ClosetStatusApi = "PENDING" | "APPROVED" | "PUBLISHED" | "REJECTED";

// ✅ DB may contain legacy values that are NOT in the schema
type ClosetStatusDb = ClosetStatusApi | "DRAFT" | "ARCHIVED" | string;

const VALID_CLOSET_STATUSES = new Set<ClosetStatusApi>([
  "PENDING",
  "APPROVED",
  "PUBLISHED",
  "REJECTED",
]);

function normalizeClosetStatus(raw: unknown): ClosetStatusApi {
  const v = String(raw ?? "").trim().toUpperCase();

  if (VALID_CLOSET_STATUSES.has(v as ClosetStatusApi)) {
    return v as ClosetStatusApi;
  }

  // Legacy mappings (never leak to GraphQL)
  if (v === "DRAFT") return "PENDING";
  if (v === "ARCHIVED") return "REJECTED";

  console.warn("[Closet] Invalid status from DDB; defaulting to PENDING:", raw);
  return "PENDING";
}

type ClosetItem = {
  id: string;
  userId: string;
  ownerSub: string;
  status: ClosetStatusApi;
  createdAt: string;
  updatedAt: string;
  mediaKey: string;
  rawMediaKey?: string;
  title: string;
  reason?: string;
  season?: string | null;
  vibes?: string | null;
  audience?: string | null;

  // categorization
  category?: string | null;
  subcategory?: string | null;

  // pinned highlight flag
  pinned?: boolean;

  favoriteCount?: number;
  viewerHasFaved?: boolean;
};

type AdminCreateClosetItemInput = {
  ownerId?: string | null;

  title: string;
  rawMediaKey?: string | null;
  mediaKey?: string | null;

  season?: string | null;
  vibes?: string | null;

  category?: string | null;
  subcategory?: string | null;

  description?: string | null;
  story?: string | null;
  audience?: string | null;
};

type AdminUpdateClosetItemInput = {
  id?: string | null;

  title?: string | null;
  category?: string | null;
  subcategory?: string | null;
  audience?: string | null;

  pinned?: boolean | null;
  season?: string | null;
  vibes?: string | null;
};

type AdminClosetItemsPage = {
  items: ClosetItem[];
  nextToken?: string | null;
};

function parseGroups(identity: any): string[] {
  const claims = identity?.claims || {};
  const raw =
    claims["cognito:groups"] ||
    claims["custom:groups"] ||
    identity?.groups ||
    [];
  if (Array.isArray(raw)) {
    return raw.map((g) => String(g));
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function getIdentity(event: AppSyncEvent) {
  const identity = event.identity as any;
  const claims = identity?.claims || {};
  const sub = identity?.sub || claims.sub;

  if (!sub) throw new Error("Unauthorized");

  const groups = parseGroups(identity);
  const groupsLc = groups.map((g) => g.toLowerCase());

  const isAdmin = groupsLc.includes(ADMIN_GROUP_NAME);
  const isCreator = groupsLc.includes(CREATOR_GROUP_NAME);

  return { sub, isAdmin, isCreator, groups };
}

/**
 * Defensive mapper from raw Dynamo item -> ClosetItem.
 * - Never assumes attributes exist; falls back to empty strings.
 * - Ensures createdAt / updatedAt are non-empty ISO strings.
 * - Normalizes status so it ALWAYS matches GraphQL enum.
 */
function mapItem(raw: any, extra?: Partial<ClosetItem>): ClosetItem {
  const idAttr = raw.id?.S ?? "";
  const ownerSubAttr = raw.ownerSub?.S ?? "";

  const statusRaw: ClosetStatusDb =
    (raw.status?.S as ClosetStatusDb | undefined) ?? "PENDING";
  const statusAttr = normalizeClosetStatus(statusRaw);

  const createdAtAttr = raw.createdAt?.S || nowIso();
  const updatedAtAttr = raw.updatedAt?.S || createdAtAttr;

  const favoriteCountAttr = (raw.favoriteCount as any)?.N;
  const favoriteCount =
    typeof favoriteCountAttr === "string" ? Number(favoriteCountAttr) : 0;

  const pinnedAttr = raw.pinned as any;
  const pinned =
    typeof pinnedAttr?.BOOL === "boolean" ? pinnedAttr.BOOL : undefined;

  return {
    id: idAttr,
    userId: ownerSubAttr,
    ownerSub: ownerSubAttr,
    status: statusAttr,
    createdAt: createdAtAttr,
    updatedAt: updatedAtAttr,
    mediaKey: raw.mediaKey?.S ?? "",
    rawMediaKey: raw.rawMediaKey?.S ?? "",
    title: raw.title?.S ?? "",
    reason: raw.reason?.S ?? "",
    season: raw.season?.S ?? null,
    vibes: raw.vibes?.S ?? null,
    audience: raw.audience?.S ?? null,

    category: raw.category?.S ?? null,
    subcategory: raw.subcategory?.S ?? null,

    pinned,

    favoriteCount,
    viewerHasFaved: false,
    ...extra,
  };
}

function randomId() {
  if ((globalThis as any).crypto?.randomUUID) {
    return (globalThis as any).crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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

function toLimit(raw: any, fallback: number) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), 200);
}

/* ============== Queries ============== */

export const adminListPending = async (
  event: AppSyncEvent,
): Promise<AdminClosetItemsPage> => {
  const { isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const args = event.arguments || {};
  const limit = toLimit(args.limit, 100);
  const exclusiveKey = decodeToken(args.nextToken);

  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi2", // STATUS index
      KeyConditionExpression: "gsi2pk = :p",
      ExpressionAttributeValues: { ":p": S("STATUS#PENDING") },
      ScanIndexForward: true,
      ProjectionExpression:
        "id, ownerSub, #s, createdAt, updatedAt, mediaKey, rawMediaKey, title, reason, season, vibes, audience, favoriteCount, category, subcategory, pinned",
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

  // ✅ NEVER return null/undefined for a Connection type
  return {
    items: items ?? [],
    nextToken: encodeToken(out.LastEvaluatedKey) ?? null,
  };
};

export const adminListClosetItems = async (
  event: AppSyncEvent,
): Promise<AdminClosetItemsPage> => {
  const { isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const args = event.arguments || {};
  const limit = toLimit(args.limit, 50);
  const exclusiveKey = decodeToken(args.nextToken);

  const status = args.status as string | undefined;

  if (status) {
    const normalized = normalizeClosetStatus(status);

    const out = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "gsi2",
        KeyConditionExpression: "gsi2pk = :p",
        ExpressionAttributeValues: { ":p": S(`STATUS#${normalized}`) },
        ScanIndexForward: false, // newest first
        ProjectionExpression:
          "id, ownerSub, #s, createdAt, updatedAt, mediaKey, rawMediaKey, title, reason, season, vibes, audience, favoriteCount, category, subcategory, pinned",
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
      items: items ?? [],
      nextToken: encodeToken(out.LastEvaluatedKey) ?? null,
    };
  }

  const out = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(pk, :p)",
      ExpressionAttributeValues: { ":p": S("ITEM#") },
      ProjectionExpression:
        "id, ownerSub, #s, createdAt, updatedAt, mediaKey, rawMediaKey, title, reason, season, vibes, audience, favoriteCount, category, subcategory, pinned",
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

  items.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime(),
  );

  return {
    items: items ?? [],
    nextToken: encodeToken(out.LastEvaluatedKey) ?? null,
  };
};

export const adminListBestieClosetItems = async (
  event: AppSyncEvent,
): Promise<AdminClosetItemsPage> => {
  const page = await adminListClosetItems(event);

  const bestieAudiences = new Set<string>(["BESTIE", "EXCLUSIVE"]);

  const filtered = (page.items || []).filter((it) => {
    const aud = (it.audience || "").toUpperCase();
    return bestieAudiences.has(aud);
  });

  return {
    items: filtered ?? [],
    nextToken: page.nextToken ?? null,
  };
};

export const closetFeed = async (
  event: AppSyncEvent,
): Promise<AdminClosetItemsPage> => {
  const { sub } = getIdentity(event);
  const sortArg = (event.arguments?.sort as string | undefined) ?? "NEWEST";
  const sort: "NEWEST" | "MOST_LOVED" =
    sortArg === "MOST_LOVED" ? "MOST_LOVED" : "NEWEST";

  const favOut = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": S(`FAV#${sub}`),
        ":sk": S("CLOSET#"),
      },
    }),
  );

  const favIds = new Set(
    (favOut.Items || []).map((f) => {
      const sk = f.sk?.S ?? "";
      if (sk.startsWith("CLOSET#")) {
        return sk.substring("CLOSET#".length);
      }
      return f.closetId?.S ?? "";
    }),
  );

  const out = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(pk, :p)",
      ExpressionAttributeValues: { ":p": S("ITEM#") },
      ProjectionExpression:
        "id, ownerSub, #s, createdAt, updatedAt, mediaKey, rawMediaKey, title, audience, favoriteCount, category, subcategory, season, vibes, pinned",
      ExpressionAttributeNames: { "#s": "status" },
    }),
  );

  const collected: ClosetItem[] = [];

  for (const it of out.Items || []) {
    // Normalize BEFORE filtering so legacy values don't break logic.
    const status = normalizeClosetStatus(it.status?.S);

    if (status !== "APPROVED" && status !== "PUBLISHED") continue;

    const createdAtVal = it.createdAt?.S || "";
    if (!createdAtVal.trim()) continue;

    const mapped = mapItem(
      {
        ...it,
        status: it["status"],
        createdAt: { S: createdAtVal },
        updatedAt: it.updatedAt ?? { S: createdAtVal },
      },
      {
        viewerHasFaved: favIds.has(it.id?.S ?? ""),
      },
    );

    collected.push(mapped);
  }

  collected.sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();

    if (sort === "MOST_LOVED") {
      const af = a.favoriteCount ?? 0;
      const bf = b.favoriteCount ?? 0;
      if (bf !== af) return bf - af;
      return bTime - aTime;
    }

    return bTime - aTime;
  });

  return {
    items: collected ?? [],
    nextToken: null,
  };
};

export const topClosetLooks = async (
  event: AppSyncEvent,
): Promise<ClosetItem[]> => {
  const conn = await closetFeed({
    ...event,
    arguments: { ...(event.arguments || {}), sort: "NEWEST" },
  });
  return conn.items ?? [];
};

/* ============== Mutations ============== */

export const adminCreateClosetItem = async (
  event: AppSyncEvent,
): Promise<ClosetItem> => {
  const { sub, isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const input = (event.arguments?.input || {}) as AdminCreateClosetItemInput;

  if (!input.title?.trim()) throw new Error("title is required");

  const rawKey = input.rawMediaKey || input.mediaKey;
  if (!rawKey) throw new Error("rawMediaKey is required");

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
        rawMediaKey: S(rawKey),
        favoriteCount: { N: "0" },

        ...(input.season ? { season: S(input.season) } : {}),
        ...(input.vibes ? { vibes: S(input.vibes) } : {}),
        ...(input.category ? { category: S(input.category) } : {}),
        ...(input.subcategory ? { subcategory: S(input.subcategory) } : {}),
        ...(input.audience ? { audience: S(input.audience) } : {}),
        ...(input.description ? { description: S(input.description) } : {}),
        ...(input.story ? { story: S(input.story) } : {}),
      },
    }),
  );

  // ✅ Start FAN approval workflow (WAIT_FOR_TASK_TOKEN)
  if (FAN_APPROVAL_SM_ARN) {
    try {
      await sfn.send(
        new StartExecutionCommand({
          stateMachineArn: FAN_APPROVAL_SM_ARN,
          input: JSON.stringify({
            item: {
              id,
              ownerSub: sub,
              userId: sub, // ✅ fixed typo (was "userrelubed")
              s3Key: rawKey,
            },
          }),
        }),
      );
    } catch (err) {
      console.error("Failed to start FAN approval Step Function", err);
    }
  } else {
    console.warn(
      "FAN_APPROVAL_SM_ARN is not set; adminCreateClosetItem will not trigger the fan approval workflow.",
    );
  }

  return {
    id,
    userId: sub,
    ownerSub: sub,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
    title: input.title.trim(),
    mediaKey: "",
    rawMediaKey: rawKey,
    reason: "",
    season: input.season ?? null,
    vibes: input.vibes ?? null,
    audience: input.audience ?? null,
    category: input.category ?? null,
    subcategory: input.subcategory ?? null,
    favoriteCount: 0,
    viewerHasFaved: false,
  };
};

export const adminApproveItem = async (
  event: AppSyncEvent,
): Promise<ClosetItem> => {
  const { isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const id = event.arguments?.closetItemId as string;
  if (!id) throw new Error("closetItemId required");

  const now = nowIso();

  const out = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression:
        "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk REMOVE reason, approvalToken, taskToken",
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
  const token = prev.taskToken?.S ?? prev.approvalToken?.S;

  if (token) {
    try {
      await sfn.send(
        new SendTaskSuccessCommand({
          taskToken: token,
          output: JSON.stringify({ decision: "APPROVE" }),
        }),
      );
    } catch (err) {
      console.warn("SendTaskSuccess failed (token may be stale)", err);
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

  const id = event.arguments?.closetItemId as string;
  const reason = (event.arguments?.reason as string) || "";
  if (!id) throw new Error("closetItemId required");

  const now = nowIso();

  const out = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression:
        "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk, reason = :r REMOVE approvalToken, taskToken",
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
  const token = prev.taskToken?.S ?? prev.approvalToken?.S;

  if (token) {
    try {
      await sfn.send(
        new SendTaskFailureCommand({
          taskToken: token,
          error: "Rejected",
          cause: reason || "Rejected by admin",
        }),
      );
    } catch (err) {
      console.warn("SendTaskFailure failed (token may be stale)", err);
    }
  }

  return mapItem({
    ...prev,
    status: S("REJECTED"),
    reason: S(reason),
  });
};

export const adminPublishClosetItem = async (
  event: AppSyncEvent,
): Promise<ClosetItem> => {
  const { isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const id = event.arguments?.closetItemId as string;
  if (!id) throw new Error("closetItemId required");

  const now = nowIso();

  const out = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression:
        "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": S("PUBLISHED"),
        ":u": S(now),
        ":g2pk": S("STATUS#PUBLISHED"),
        ":g2sk": S(now),
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!out.Attributes) {
    throw new Error("Closet item not found");
  }

  return mapItem(out.Attributes);
};

export const adminUpdateClosetItem = async (
  event: AppSyncEvent,
): Promise<ClosetItem> => {
  const { isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const args = event.arguments || {};
  const rawInput = (args.input || {}) as AdminUpdateClosetItemInput;

  const id =
    (args.closetItemId as string | undefined) ??
    (rawInput.id as string | undefined) ??
    (args.id as string | undefined);

  if (!id) throw new Error("closetItemId or input.id required");

  const existing = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
    }),
  );
  if (!existing.Item) {
    throw new Error("Closet item not found");
  }

  const input: AdminUpdateClosetItemInput = { ...rawInput };
  (
    ["title", "category", "subcategory", "audience", "pinned", "season", "vibes"] as const
  ).forEach((field) => {
    if ((args as any)[field] !== undefined && (input as any)[field] === undefined) {
      (input as any)[field] = (args as any)[field];
    }
  });

  const now = nowIso();

  const updateExpr: string[] = ["#updatedAt = :u"];
  const exprNames: Record<string, string> = {
    "#updatedAt": "updatedAt",
  };
  const exprValues: Record<string, AttributeValue> = {
    ":u": S(now),
  };

  if (input.title !== undefined) {
    updateExpr.push("#title = :title");
    exprNames["#title"] = "title";
    exprValues[":title"] = input.title === null ? { NULL: true } : S(input.title);
  }

  if (input.category !== undefined) {
    updateExpr.push("#category = :category");
    exprNames["#category"] = "category";
    exprValues[":category"] =
      input.category === null ? { NULL: true } : S(input.category);
  }

  if (input.subcategory !== undefined) {
    updateExpr.push("#subcategory = :subcategory");
    exprNames["#subcategory"] = "subcategory";
    exprValues[":subcategory"] =
      input.subcategory === null ? { NULL: true } : S(input.subcategory);
  }

  if (input.audience !== undefined) {
    updateExpr.push("audience = :audience");
    exprValues[":audience"] =
      input.audience === null ? { NULL: true } : S(input.audience);
  }

  if (input.season !== undefined) {
    updateExpr.push("season = :season");
    exprValues[":season"] =
      input.season === null ? { NULL: true } : S(input.season);
  }

  if (input.vibes !== undefined) {
    updateExpr.push("vibes = :vibes");
    exprValues[":vibes"] = input.vibes === null ? { NULL: true } : S(input.vibes);
  }

  if (input.pinned !== undefined) {
    updateExpr.push("pinned = :pinned");
    exprValues[":pinned"] =
      input.pinned === null ? { NULL: true } : { BOOL: Boolean(input.pinned) };
  }

  if (updateExpr.length === 1) {
    throw new Error("No fields provided to update");
  }

  const out = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression: `SET ${updateExpr.join(", ")}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!out.Attributes) {
    throw new Error("Closet item not found");
  }

  return mapItem(out.Attributes);
};

export const adminSetClosetAudience = async (
  event: AppSyncEvent,
): Promise<ClosetItem> => {
  const { isAdmin } = getIdentity(event);
  if (!isAdmin) throw new Error("Forbidden");

  const id = event.arguments?.closetItemId as string;
  const audience = event.arguments?.audience as string;

  if (!id) throw new Error("closetItemId required");
  if (!audience) throw new Error("audience required");

  const now = nowIso();

  const out = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression: "SET audience = :aud, updatedAt = :u",
      ExpressionAttributeValues: {
        ":aud": S(audience),
        ":u": S(now),
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!out.Attributes) {
    throw new Error("Closet item not found");
  }

  return mapItem(out.Attributes);
};

export const toggleFavoriteClosetItem = async (
  event: AppSyncEvent,
): Promise<ClosetItem> => {
  const { sub } = getIdentity(event);

  const id = event.arguments?.id as string;
  const favoriteOnArg = event.arguments?.favoriteOn as boolean | null | undefined;
  const legacyOnArg = event.arguments?.on as boolean | null | undefined;

  const onArg = typeof favoriteOnArg === "boolean" ? favoriteOnArg : legacyOnArg;

  if (!id) throw new Error("id required");

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

  const currentCountAttr = (base as any).favoriteCount?.N;
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
  if (field === "adminListBestieClosetItems")
    return adminListBestieClosetItems(event);
  if (field === "adminCreateClosetItem") return adminCreateClosetItem(event);
  if (field === "adminApproveItem") return adminApproveItem(event);
  if (field === "adminRejectItem") return adminRejectItem(event);
  if (field === "adminPublishClosetItem") return adminPublishClosetItem(event);
  if (field === "adminSetClosetAudience") return adminSetClosetAudience(event);
  if (field === "adminUpdateClosetItem") return adminUpdateClosetItem(event);
  if (field === "closetFeed") return closetFeed(event);
  if (field === "topClosetLooks") return topClosetLooks(event);

  if (field === "toggleFavoriteClosetItem" || field === "likeClosetItem") {
    return toggleFavoriteClosetItem(event);
  }

  throw new Error(`No resolver implemented for field ${field}`);
};


