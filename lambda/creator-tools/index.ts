import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  SFNClient,
  StartSyncExecutionCommand,
} from "@aws-sdk/client-sfn";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const sfnClient = new SFNClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const CREATOR_MEDIA_BUCKET = process.env.CREATOR_MEDIA_BUCKET!;
const PK = process.env.PK_NAME || "pk";
const SK = process.env.SK_NAME || "sk";
const STATUS_GSI = process.env.STATUS_GSI || "gsi1";
const SOCIAL_PULSE_SFN_ARN = process.env.SOCIAL_PULSE_SFN_ARN || "";

function now() {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────
// Monetization HQ – earnings by platform (mocked, windowed)
// ─────────────────────────────────────────────

type CreatorRevenueWindow = "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS";

async function creatorRevenueByPlatformResolver(event: any) {
  const window: CreatorRevenueWindow =
    event.arguments?.window || "LAST_30_DAYS";

  const days =
    window === "LAST_7_DAYS"
      ? 7
      : window === "LAST_90_DAYS"
      ? 90
      : 30;

  // Simple sample fake data; you can swap this for real pipelines later.
  const currency = "USD";

  const platforms = [
    {
      platform: "tiktok",
      label: "TikTok / Reels",
      currency,
      amount: 420.5,
      lastPayoutAt: new Date().toISOString(),
    },
    {
      platform: "youtube",
      label: "YouTube",
      currency,
      amount: 310.2,
      lastPayoutAt: new Date(
        Date.now() - 3 * 86400000,
      ).toISOString(),
    },
    {
      platform: "instagram",
      label: "Instagram",
      currency,
      amount: 165.0,
      lastPayoutAt: null,
    },
  ];

  const platformTotal = platforms.reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  // Generate a simple upward trend timeseries
  const today = new Date();
  const timeseries = Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));

    const base = platformTotal / days;
    const variance =
      (i / (days - 1 || 1)) * 0.4 + 0.8; // ~0.8x to 1.2x

    return {
      date: d.toISOString().slice(0, 10), // YYYY-MM-DD
      totalRevenue: Math.round(base * variance * 100) / 100,
    };
  });

  const totalRevenue = timeseries.reduce(
    (sum, p) => sum + p.totalRevenue,
    0,
  );

  return {
    currency,
    totalRevenue,
    platforms,
    timeseries,
  };
}

// ─────────────────────────────────────────────
// Director Suite – shoot plans (Dynamo persistence)
// ─────────────────────────────────────────────

async function getDirectorShootPlan(sub: string, id: string) {
  if (!sub) throw new Error("Not authenticated");
  if (!id) throw new Error("id is required");

  const pk = `CREATOR#${sub}`;
  const sk = `DIRECTOR_SHOOT#${id}`;

  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: pk, [SK]: sk },
    }),
  );

  if (!res.Item) return null;

  const item = res.Item as any;

  return {
    id: item.id,
    creatorId: sub,
    shootName: item.shootName,
    primaryPlatform: item.primaryPlatform,
    objective: item.objective,
    scenes: item.scenes || [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

interface DirectorSceneInput {
  id: string;
  title: string;
  shotType?: string | null;
  location?: string | null;
  mood?: string | null;
  beats?: string | null;
}

interface SaveDirectorShootPlanInput {
  id?: string | null;
  shootName: string;
  primaryPlatform: string;
  objective: string;
  scenes: DirectorSceneInput[];
}

async function saveDirectorShootPlan(
  sub: string,
  input: SaveDirectorShootPlanInput,
) {
  if (!sub) throw new Error("Not authenticated");
  if (!input) throw new Error("input is required");

  const id = input.id || "default";
  const nowIso = now();

  const pk = `CREATOR#${sub}`;
  const sk = `DIRECTOR_SHOOT#${id}`;

  const item = {
    [PK]: pk,
    [SK]: sk,
    id,
    creatorId: sub,
    shootName: input.shootName,
    primaryPlatform: input.primaryPlatform,
    objective: input.objective,
    scenes: input.scenes || [],
    createdAt: nowIso,
    updatedAt: nowIso,
    type: "DIRECTOR_SHOOT_PLAN",
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  return {
    id,
    creatorId: sub,
    shootName: item.shootName,
    primaryPlatform: item.primaryPlatform,
    objective: item.objective,
    scenes: item.scenes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// ─────────────────────────────────────────────
// Mapping helpers
// ─────────────────────────────────────────────

function mapCabinet(item: any) {
  if (!item) return null;
  return {
    id: item.id,
    ownerSub: item.ownerSub,
    name: item.name,
    description: item.description ?? null,
    defaultCategory: item.defaultCategory ?? null,
    tags: item.tags ?? [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    assetCount: item.assetCount ?? 0,
  };
}

function mapFolder(item: any) {
  if (!item) return null;
  return {
    id: item.id,
    cabinetId: item.cabinetId,
    name: item.name,
    specialKind: item.specialKind ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapAsset(item: any) {
  if (!item) return null;
  return {
    id: item.id,
    cabinetId: item.cabinetId,
    folderId: item.folderId ?? null,
    ownerSub: item.ownerSub,
    // ensure non-null for GraphQL
    kind: item.kind ?? "OTHER",
    category: item.category ?? null,
    title: item.title ?? null,
    notes: item.notes ?? null,
    tags: item.tags ?? [],
    s3Key: item.s3Key,
    contentType: item.contentType ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,

    // moderation defaults
    moderationStatus: item.moderationStatus ?? "ACTIVE",
    moderationReason: item.moderationReason ?? null,
    moderatedBy: item.moderatedBy ?? null,
    moderatedAt: item.moderatedAt ?? null,
  };
}

function mapCreatorPrBoard(item: any) {
  if (!item) return null;
  return {
    id: item.id,
    creatorId: item.creatorId,
    title: item.title,
    description: item.description ?? null,
    goalCompassSnapshot: item.goalCompassSnapshot ?? null,
    timeHorizonFrom: item.timeHorizonFrom ?? null,
    timeHorizonTo: item.timeHorizonTo ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapCreatorPrItem(item: any) {
  if (!item) return null;
  return {
    id: item.id,
    boardId: item.boardId,
    creatorId: item.creatorId,

    title: item.title,
    platform: item.platform,
    status: item.status ?? "IDEA",

    notes: item.notes ?? null,

    pulseId: item.pulseId ?? null,
    contentIdeaId: item.contentIdeaId ?? null,

    emotionalToneLabels: item.emotionalToneLabels ?? [],
    audienceResponseLabel: item.audienceResponseLabel ?? null,
    brandAlignmentScore:
      typeof item.brandAlignmentScore === "number"
        ? item.brandAlignmentScore
        : null,
    prRiskLevel: item.prRiskLevel ?? null,
    lastEmotionalReviewAt: item.lastEmotionalReviewAt ?? null,

    directorShootPlanId: item.directorShootPlanId ?? null,
    directorAssetIds: item.directorAssetIds ?? [],
    scheduleSlotId: item.scheduleSlotId ?? null,

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapCreatorSocialPulseItem(item: any, sub: string) {
  if (!item) return null;

  const skVal = item[SK] as string | undefined;
  let id = item.id as string | undefined;

  if (!id && typeof skVal === "string" && skVal.startsWith("PULSE#")) {
    id = skVal.slice("PULSE#".length);
  }

  return {
    id: id!,
    creatorId: item.creatorId ?? sub,
    niche: item.niche ?? null,
    platforms: Array.isArray(item.platforms) ? item.platforms : [],
    trendBriefs: Array.isArray(item.trendBriefs) ? item.trendBriefs : [],
    contentIdeas: Array.isArray(item.contentIdeas) ? item.contentIdeas : [],
    createdAt: item.createdAt ?? item.updatedAt ?? now(),
  };
}

// ─────────────────────────────────────────────
// CABINETS
// ─────────────────────────────────────────────

async function listCabinets(sub: string) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: STATUS_GSI,
      KeyConditionExpression:
        "#gpk = :gpk AND begins_with(#gsk, :prefix)",
      ExpressionAttributeNames: {
        "#gpk": "gsi1pk",
        "#gsk": "gsi1sk",
      },
      ExpressionAttributeValues: {
        ":gpk": `CREATOR#${sub}`,
        ":prefix": "CAB#",
      },
    }),
  );

  let items = res.Items ?? [];

  // If this creator has no cabinets yet, auto-create a starter one.
  if (items.length === 0) {
    const starter = await createDefaultCabinetForCreator(sub);
    items = [starter];
  }

  return items.map(mapCabinet);
}

async function getCabinet(sub: string, id: string) {
  if (!id) throw new Error("id is required");

  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${id}`,
        [SK]: "META",
      },
    }),
  );

  if (!res.Item || res.Item.ownerSub !== sub) {
    // hide existence of other peoples’ cabinets
    return null;
  }

  return mapCabinet(res.Item);
}

async function createDefaultCabinetForCreator(sub: string) {
  const nowIso = now();
  const id = uuid();

  const item = {
    [PK]: `CAB#${id}`,
    [SK]: "META",
    type: "CABINET",
    id,
    ownerSub: sub,
    name: "From my closet",
    description:
      "Imported looks and outfit references from your Bestie closet",
    defaultCategory: "OUTFIT_REFS",
    tags: ["closet-import"],
    assetCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
    gsi1pk: `CREATOR#${sub}`,
    gsi1sk: `CAB#${nowIso}#${id}`,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: "attribute_not_exists(#pk)",
      ExpressionAttributeNames: {
        "#pk": PK,
      },
    }),
  );

  return item;
}

async function createCabinet(sub: string, input: any) {
  if (!input?.name) {
    throw new Error("name is required");
  }

  const id = uuid();
  const nowIso = now();

  const item = {
    [PK]: `CAB#${id}`,
    [SK]: "META",
    type: "CABINET",
    id,
    ownerSub: sub,
    name: input.name,
    description: input.description ?? null,
    defaultCategory: input.defaultCategory ?? null,
    tags: input.tags ?? [],
    assetCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
    // GSI to list cabinets per creator
    gsi1pk: `CREATOR#${sub}`,
    gsi1sk: `CAB#${nowIso}#${id}`,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: "attribute_not_exists(#pk)",
      ExpressionAttributeNames: {
        "#pk": PK,
      },
    }),
  );

  return mapCabinet(item);
}

async function updateCabinet(sub: string, input: any) {
  const id = input?.id;
  if (!id) throw new Error("id is required");
  if (!input) throw new Error("input is required");

  const nowIso = now();

  const names: Record<string, string> = {
    "#updatedAt": "updatedAt",
    "#ownerSub": "ownerSub",
  };
  const values: Record<string, any> = {
    ":updatedAt": nowIso,
    ":ownerSub": sub,
  };
  const sets: string[] = ["#updatedAt = :updatedAt"];

  if (Object.prototype.hasOwnProperty.call(input, "name")) {
    names["#name"] = "name";
    values[":name"] = input.name;
    sets.push("#name = :name");
  }
  if (Object.prototype.hasOwnProperty.call(input, "description")) {
    names["#description"] = "description";
    values[":description"] = input.description ?? null;
    sets.push("#description = :description");
  }
  if (Object.prototype.hasOwnProperty.call(input, "defaultCategory")) {
    names["#defaultCategory"] = "defaultCategory";
    values[":defaultCategory"] = input.defaultCategory ?? null;
    sets.push("#defaultCategory = :defaultCategory");
  }
  if (Object.prototype.hasOwnProperty.call(input, "tags")) {
    names["#tags"] = "tags";
    values[":tags"] = input.tags ?? [];
    sets.push("#tags = :tags");
  }

  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${id}`,
        [SK]: "META",
      },
      UpdateExpression: "SET " + sets.join(", "),
      ConditionExpression: "#ownerSub = :ownerSub",
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }),
  );

  return mapCabinet(res.Attributes);
}

async function deleteCabinet(sub: string, id: string) {
  if (!id) throw new Error("id is required");

  const pkValue = `CAB#${id}`;

  // First fetch all rows for this cabinet to confirm ownership & cascade delete.
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": PK,
      },
      ExpressionAttributeValues: {
        ":pk": pkValue,
      },
    }),
  );

  const items = res.Items ?? [];
  const meta = items.find((it) => it.type === "CABINET");

  if (!meta || meta.ownerSub !== sub) {
    // Not your cabinet → pretend it doesn't exist
    return false;
  }

  // Best-effort cascade delete
  await Promise.all(
    items.map((item) =>
      ddb.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            [PK]: item[PK],
            [SK]: item[SK],
          },
        }),
      ),
    ),
  );

  return true;
}

// ─────────────────────────────────────────────
// FOLDERS
// ─────────────────────────────────────────────

async function listFolders(sub: string, cabinetId: string) {
  if (!cabinetId) throw new Error("cabinetId is required");

  // optional: check cabinet ownership
  const cabinet = await getCabinet(sub, cabinetId);
  if (!cabinet) {
    // hide if not owner
    return [];
  }

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression:
        "#pk = :pk AND begins_with(#sk, :prefix)",
      ExpressionAttributeNames: {
        "#pk": PK,
        "#sk": SK,
      },
      ExpressionAttributeValues: {
        ":pk": `CAB#${cabinetId}`,
        ":prefix": "FOLDER#",
      },
    }),
  );

  const items = res.Items ?? [];
  return items.map(mapFolder);
}

async function createFolder(sub: string, input: any) {
  const { cabinetId, name } = input || {};
  if (!cabinetId) throw new Error("cabinetId is required");
  if (!name) throw new Error("name is required");

  const cabinet = await getCabinet(sub, cabinetId);
  if (!cabinet) {
    throw new Error("Cabinet not found");
  }

  const id = uuid();
  const nowIso = now();

  const item = {
    [PK]: `CAB#${cabinetId}`,
    [SK]: `FOLDER#${id}`,
    type: "FOLDER",
    id,
    cabinetId,
    ownerSub: sub,
    name,
    specialKind: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression:
        "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
      ExpressionAttributeNames: {
        "#pk": PK,
        "#sk": SK,
      },
    }),
  );

  return mapFolder(item);
}

async function renameFolder(sub: string, input: any) {
  const { id, cabinetId, name } = input || {};
  if (!id) throw new Error("id is required");
  if (!cabinetId) throw new Error("cabinetId is required");
  if (!name) throw new Error("name is required");

  const nowIso = now();

  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: `FOLDER#${id}`,
      },
      UpdateExpression: "SET #name = :name, #updatedAt = :updatedAt",
      ConditionExpression: "#ownerSub = :ownerSub",
      ExpressionAttributeNames: {
        "#name": "name",
        "#updatedAt": "updatedAt",
        "#ownerSub": "ownerSub",
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":updatedAt": nowIso,
        ":ownerSub": sub,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return mapFolder(res.Attributes);
}

async function deleteFolder(sub: string, id: string, cabinetId: string) {
  if (!id) throw new Error("id is required");
  if (!cabinetId) throw new Error("cabinetId is required");

  // Delete the folder row (with ownership check)
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: `FOLDER#${id}`,
      },
      ConditionExpression: "#ownerSub = :ownerSub",
      ExpressionAttributeNames: {
        "#ownerSub": "ownerSub",
      },
      ExpressionAttributeValues: {
        ":ownerSub": sub,
      },
    }),
  );

  // Best-effort cleanup: move any assets in this folder to "unsorted" (null folderId)
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression:
        "#pk = :pk AND begins_with(#sk, :prefix)",
      ExpressionAttributeNames: {
        "#pk": PK,
        "#sk": SK,
        "#folderId": "folderId",
      },
      ExpressionAttributeValues: {
        ":pk": `CAB#${cabinetId}`,
        ":prefix": "ASSET#",
        ":folderId": id,
      },
      FilterExpression: "#folderId = :folderId",
    }),
  );

  const assets = res.Items ?? [];
  await Promise.all(
    assets.map((asset) =>
      ddb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            [PK]: asset[PK],
            [SK]: asset[SK],
          },
          UpdateExpression: "SET #folderId = :null",
          ExpressionAttributeNames: {
            "#folderId": "folderId",
          },
          ExpressionAttributeValues: {
            ":null": null,
          },
        }),
      ),
    ),
  );

  return true;
}

// ─────────────────────────────────────────────
// ASSETS – creator-facing
// ─────────────────────────────────────────────

async function listAssets(sub: string, args: any) {
  const {
    cabinetId,
    folderId,
    category,
    tag,
    search,
    limit = 50,
    nextToken,
  } = args || {};

  if (!cabinetId) throw new Error("cabinetId is required");

  const cabinet = await getCabinet(sub, cabinetId);
  if (!cabinet) {
    // Hide if not owner
    return {
      items: [],
      nextToken: null,
    };
  }

  const queryInput: any = {
    TableName: TABLE_NAME,
    KeyConditionExpression:
      "#pk = :pk AND begins_with(#sk, :prefix)",
    ExpressionAttributeNames: {
      "#pk": PK,
      "#sk": SK,
    },
    ExpressionAttributeValues: {
      ":pk": `CAB#${cabinetId}`,
      ":prefix": "ASSET#",
    },
    Limit: limit,
  };

  if (nextToken) {
    queryInput.ExclusiveStartKey = {
      [PK]: `CAB#${cabinetId}`,
      [SK]: nextToken,
    };
  }

  const res = await ddb.send(new QueryCommand(queryInput));
  let items = (res.Items ?? []).filter((it) => it.type === "ASSET");

  // Hide moderated assets for the creator UI:
  items = items.filter((it) => {
    const status = String(it.moderationStatus ?? "ACTIVE").toUpperCase();
    return status === "ACTIVE";
  });

  // In-memory filters
  if (folderId !== undefined && folderId !== null) {
    items = items.filter((it) => it.folderId === folderId);
  }
  if (category) {
    items = items.filter((it) => it.category === category);
  }
  if (tag) {
    items = items.filter(
      (it) => Array.isArray(it.tags) && it.tags.includes(tag),
    );
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter((it) => {
      const title = (it.title ?? "").toLowerCase();
      const notes = (it.notes ?? "").toLowerCase();
      return title.includes(q) || notes.includes(q);
    });
  }

  const connectionNextToken =
    res.LastEvaluatedKey ? res.LastEvaluatedKey[SK] : null;

  return {
    items: items.map(mapAsset),
    nextToken: connectionNextToken,
  };
}

// Upload flow
async function createAssetUpload(sub: string, input: any) {
  const {
    cabinetId,
    folderId,
    category,
    title,
    notes,
    tags = [],
    fileName,
    filename, // tolerate old name
    contentType,
    kind,
  } = input || {};

  const finalFileName = fileName ?? filename;

  if (!cabinetId) throw new Error("cabinetId is required");
  if (!finalFileName) throw new Error("fileName is required");
  if (!contentType) throw new Error("contentType is required");

  // Ensure cabinet exists + belongs to user
  const cabinet = await getCabinet(sub, cabinetId);
  if (!cabinet) {
    throw new Error("Cabinet not found");
  }

  const assetId = uuid();
  const folderPart = folderId || "unsorted";
  const safeName = String(finalFileName).replace(/[^a-zA-Z0-9._-]/g, "_");

  const s3Key = [
    "creator-media",
    sub,
    cabinetId,
    folderPart,
    `${assetId}-${safeName}`,
  ].join("/");

  const nowIso = now();
  const assetKind = kind ?? "OTHER";

  const item = {
    [PK]: `CAB#${cabinetId}`,
    [SK]: `ASSET#${assetId}`,
    type: "ASSET",
    id: assetId,
    cabinetId,
    folderId: folderId ?? null,
    ownerSub: sub,
    kind: assetKind,
    category: category ?? null,
    title: title ?? null,
    notes: notes ?? null,
    tags,
    s3Key,
    contentType,
    createdAt: nowIso,
    updatedAt: nowIso,

    // moderation defaults
    moderationStatus: "ACTIVE" as const,
    moderationReason: null,
    moderatedBy: null,
    moderatedAt: null,

    // GSI for admin listing by user
    gsi1pk: `CREATOR#${sub}`,
    gsi1sk: `CAB_ASSET#${cabinetId}#${nowIso}#${assetId}`,
  };

  // 1) create ASSET row in Dynamo (pending upload)
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  // Best-effort: bump cabinet.assetCount
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: "META",
      },
      UpdateExpression:
        "SET #assetCount = if_not_exists(#assetCount, :zero) + :one, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#assetCount": "assetCount",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":zero": 0,
        ":one": 1,
        ":updatedAt": nowIso,
      },
    }),
  );

  // 2) make a presigned URL so the browser can PUT the file
  const putCmd = new PutObjectCommand({
    Bucket: CREATOR_MEDIA_BUCKET,
    Key: s3Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, putCmd, { expiresIn: 900 });

  return {
    uploadUrl,
    asset: mapAsset(item),
  };
}

async function updateAsset(sub: string, input: any) {
  const { id, cabinetId } = input || {};
  if (!id) throw new Error("id is required");
  if (!cabinetId) throw new Error("cabinetId is required");

  const nowIso = now();

  const names: Record<string, string> = {
    "#updatedAt": "updatedAt",
    "#ownerSub": "ownerSub",
  };
  const values: Record<string, any> = {
    ":updatedAt": nowIso,
    ":ownerSub": sub,
  };
  const sets: string[] = ["#updatedAt = :updatedAt"];

  if (Object.prototype.hasOwnProperty.call(input, "folderId")) {
    names["#folderId"] = "folderId";
    values[":folderId"] = input.folderId ?? null;
    sets.push("#folderId = :folderId");
  }
  if (Object.prototype.hasOwnProperty.call(input, "category")) {
    names["#category"] = "category";
    values[":category"] = input.category ?? null;
    sets.push("#category = :category");
  }
  if (Object.prototype.hasOwnProperty.call(input, "title")) {
    names["#title"] = "title";
    values[":title"] = input.title ?? null;
    sets.push("#title = :title");
  }
  if (Object.prototype.hasOwnProperty.call(input, "notes")) {
    names["#notes"] = "notes";
    values[":notes"] = input.notes ?? null;
    sets.push("#notes = :notes");
  }
  if (Object.prototype.hasOwnProperty.call(input, "tags")) {
    names["#tags"] = "tags";
    values[":tags"] = input.tags ?? [];
    sets.push("#tags = :tags");
  }
  if (Object.prototype.hasOwnProperty.call(input, "kind")) {
    names["#kind"] = "kind";
    values[":kind"] = input.kind ?? "OTHER";
    sets.push("#kind = :kind");
  }
  if (Object.prototype.hasOwnProperty.call(input, "contentType")) {
    names["#contentType"] = "contentType";
    values[":contentType"] = input.contentType ?? null;
    sets.push("#contentType = :contentType");
  }

  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: `ASSET#${id}`,
      },
      UpdateExpression: "SET " + sets.join(", "),
      ConditionExpression: "#ownerSub = :ownerSub",
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }),
  );

  return mapAsset(res.Attributes);
}

async function deleteAsset(sub: string, id: string, cabinetId: string) {
  if (!id) throw new Error("id is required");
  if (!cabinetId) throw new Error("cabinetId is required");

  const nowIso = now();

  // 1) Delete the asset row with ownership check
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: `ASSET#${id}`,
      },
      ConditionExpression: "#ownerSub = :ownerSub",
      ExpressionAttributeNames: {
        "#ownerSub": "ownerSub",
      },
      ExpressionAttributeValues: {
        ":ownerSub": sub,
      },
    }),
  );

  // 2) Best-effort: decrement assetCount
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: "META",
      },
      UpdateExpression:
        "SET #assetCount = if_not_exists(#assetCount, :zero) - :one, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#assetCount": "assetCount",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":zero": 0,
        ":one": 1,
        ":updatedAt": nowIso,
      },
    }),
  );

  return true;
}

async function moveAsset(sub: string, input: any) {
  const { id, cabinetId, destinationFolderId } = input || {};
  if (!id) throw new Error("id is required");
  if (!cabinetId) throw new Error("cabinetId is required");

  const nowIso = now();

  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: `ASSET#${id}`,
      },
      UpdateExpression:
        "SET #folderId = :folderId, #updatedAt = :updatedAt",
      ConditionExpression: "#ownerSub = :ownerSub",
      ExpressionAttributeNames: {
        "#folderId": "folderId",
        "#updatedAt": "updatedAt",
        "#ownerSub": "ownerSub",
      },
      ExpressionAttributeValues: {
        ":folderId": destinationFolderId ?? null,
        ":updatedAt": nowIso,
        ":ownerSub": sub,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return mapAsset(res.Attributes);
}

// ─────────────────────────────────────────────
// ASSETS – admin listing / moderation
// ─────────────────────────────────────────────

async function adminListCreatorAssetsByUser(args: any) {
  const {
    ownerSub,
    cabinetId,
    folderId,
    moderationStatus,
    includeSoftDeleted = true,
    limit = 50,
  } = args || {};

  if (!ownerSub) throw new Error("ownerSub is required");

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: STATUS_GSI,
      KeyConditionExpression:
        "#gpk = :gpk AND begins_with(#gsk, :prefix)",
      ExpressionAttributeNames: {
        "#gpk": "gsi1pk",
        "#gsk": "gsi1sk",
      },
      ExpressionAttributeValues: {
        ":gpk": `CREATOR#${ownerSub}`,
        ":prefix": "CAB_ASSET#",
      },
      Limit: limit,
    }),
  );

  let items = (res.Items ?? []).filter((it) => it.type === "ASSET");

  if (cabinetId) {
    items = items.filter((it) => it.cabinetId === cabinetId);
  }
  if (folderId !== undefined && folderId !== null) {
    items = items.filter((it) => it.folderId === folderId);
  }

  if (moderationStatus) {
    const wanted = String(moderationStatus).toUpperCase();
    items = items.filter(
      (it) =>
        String(it.moderationStatus ?? "ACTIVE").toUpperCase() === wanted,
    );
  }

  if (!includeSoftDeleted) {
    items = items.filter(
      (it) =>
        String(it.moderationStatus ?? "ACTIVE").toUpperCase() !==
        "SOFT_DELETED",
    );
  }

  return {
    items: items.map(mapAsset),
    nextToken: null, // simple for now; can add JSON-encoded LastEvaluatedKey later
  };
}

async function adminGetCreatorAsset(args: any) {
  const { cabinetId, id } = args || {};
  if (!cabinetId) throw new Error("cabinetId is required");
  if (!id) throw new Error("id is required");

  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: `ASSET#${id}`,
      },
    }),
  );

  if (!res.Item || res.Item.type !== "ASSET") {
    return null;
  }

  return mapAsset(res.Item);
}

async function adminModerateCreatorAsset(adminSub: string, input: any) {
  const { cabinetId, id, moderationStatus, moderationReason, tags } =
    input || {};
  if (!cabinetId) throw new Error("cabinetId is required");
  if (!id) throw new Error("id is required");
  if (!moderationStatus) throw new Error("moderationStatus is required");

  const nowIso = now();

  const names: Record<string, string> = {
    "#moderationStatus": "moderationStatus",
    "#updatedAt": "updatedAt",
    "#moderatedAt": "moderatedAt",
    "#moderatedBy": "moderatedBy",
  };
  const values: Record<string, any> = {
    ":moderationStatus": moderationStatus,
    ":updatedAt": nowIso,
    ":moderatedAt": nowIso,
    ":moderatedBy": adminSub,
  };
  const sets: string[] = [
    "#moderationStatus = :moderationStatus",
    "#updatedAt = :updatedAt",
    "#moderatedAt = :moderatedAt",
    "#moderatedBy = :moderatedBy",
  ];

  if (Object.prototype.hasOwnProperty.call(input, "moderationReason")) {
    names["#moderationReason"] = "moderationReason";
    values[":moderationReason"] = moderationReason ?? null;
    sets.push("#moderationReason = :moderationReason");
  }

  if (Array.isArray(tags)) {
    names["#tags"] = "tags";
    values[":tags"] = tags;
    sets.push("#tags = :tags");
  }

  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: `ASSET#${id}`,
      },
      UpdateExpression: "SET " + sets.join(", "),
      ReturnValues: "ALL_NEW",
    }),
  );

  return mapAsset(res.Attributes);
}

async function adminRejectCreatorAsset(adminSub: string, input: any) {
  if (!input) throw new Error("input is required");
  const { cabinetId, id, moderationReason, tags } = input;

  return adminModerateCreatorAsset(adminSub, {
    cabinetId,
    id,
    moderationStatus: "REJECTED",
    moderationReason,
    tags,
  });
}

async function adminSoftDeleteCreatorAsset(adminSub: string, input: any) {
  const { cabinetId, id, reason } = input || {};
  if (!cabinetId) throw new Error("cabinetId is required");
  if (!id) throw new Error("id is required");

  const nowIso = now();

  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: `ASSET#${id}`,
      },
      UpdateExpression:
        "SET #moderationStatus = :status, #moderationReason = :reason, #moderatedBy = :moderatedBy, #moderatedAt = :moderatedAt, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#moderationStatus": "moderationStatus",
        "#moderationReason": "moderationReason",
        "#moderatedBy": "moderatedBy",
        "#moderatedAt": "moderatedAt",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":status": "SOFT_DELETED",
        ":reason": reason ?? null,
        ":moderatedBy": adminSub,
        ":moderatedAt": nowIso,
        ":updatedAt": nowIso,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return mapAsset(res.Attributes);
}

async function adminRestoreCreatorAsset(adminSub: string, input: any) {
  const { cabinetId, id } = input || {};
  if (!cabinetId) throw new Error("cabinetId is required");
  if (!id) throw new Error("id is required");

  const nowIso = now();

  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: `ASSET#${id}`,
      },
      UpdateExpression:
        "SET #moderationStatus = :status, #moderationReason = :reason, #moderatedBy = :moderatedBy, #moderatedAt = :moderatedAt, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#moderationStatus": "moderationStatus",
        "#moderationReason": "moderationReason",
        "#moderatedBy": "moderatedBy",
        "#moderatedAt": "moderatedAt",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":status": "ACTIVE",
        ":reason": null,
        ":moderatedBy": adminSub,
        ":moderatedAt": nowIso,
        ":updatedAt": nowIso,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return mapAsset(res.Attributes);
}

// ─────────────────────────────────────────────
// Creator PR & Content Studio – boards & items
// ─────────────────────────────────────────────

async function listCreatorPrBoards(sub: string) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: STATUS_GSI,
      KeyConditionExpression:
        "#gpk = :gpk AND begins_with(#gsk, :prefix)",
      ExpressionAttributeNames: {
        "#gpk": "gsi1pk",
        "#gsk": "gsi1sk",
      },
      ExpressionAttributeValues: {
        ":gpk": `CREATOR#${sub}`,
        ":prefix": "CPB#",
      },
    }),
  );

  const items = (res.Items ?? []).filter(
    (it) => it.type === "CREATOR_PR_BOARD",
  );

  return items.map(mapCreatorPrBoard);
}

async function listCreatorPrItemsByBoard(
  sub: string,
  boardId: string,
) {
  if (!boardId) throw new Error("boardId is required");

  // Enforce ownership
  await requireCreatorPrBoard(sub, boardId);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression:
        "#pk = :pk AND begins_with(#sk, :prefix)",
      ExpressionAttributeNames: {
        "#pk": PK,
        "#sk": SK,
      },
      ExpressionAttributeValues: {
        ":pk": `CPB#${boardId}`,
        ":prefix": "ITEM#",
      },
    }),
  );

  const items = (res.Items ?? []).filter(
    (it) => it.type === "CREATOR_PR_ITEM",
  );

  return items.map(mapCreatorPrItem);
}

async function createCreatorPrBoard(sub: string, input: any) {
  if (!input) throw new Error("input is required");
  if (!input.title) throw new Error("title is required");

  const nowIso = now();
  const boardId = uuid();

  // Snapshot the current goal compass (or defaults) at the moment of creation
  const compass = await getCreatorGoalCompass(sub);

  const goalCompassSnapshot = compass
    ? {
        primaryGoal: compass.primaryGoal ?? null,
        timeHorizon: compass.timeHorizon ?? null,
        weeklyCapacity: compass.weeklyCapacity ?? null,
        focusAreas: compass.focusAreas ?? null,
        riskTolerance: compass.riskTolerance ?? null,
        contentMixTarget: compass.contentMixTarget ?? null,
      }
    : null;

  const item = {
    [PK]: `CPB#${boardId}`,
    [SK]: "META",
    type: "CREATOR_PR_BOARD",

    id: boardId,
    creatorId: sub,
    ownerSub: sub,
    title: input.title,
    description: input.description ?? null,
    goalCompassSnapshot,
    timeHorizonFrom: input.timeHorizonFrom ?? null,
    timeHorizonTo: input.timeHorizonTo ?? null,

    createdAt: nowIso,
    updatedAt: nowIso,

    // GSI1: list boards per creator
    gsi1pk: `CREATOR#${sub}`,
    gsi1sk: `CPB#${nowIso}#${boardId}`,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: "attribute_not_exists(#pk)",
      ExpressionAttributeNames: {
        "#pk": PK,
      },
    }),
  );

  return mapCreatorPrBoard(item);
}

async function requireCreatorPrBoard(sub: string, boardId: string) {
  if (!boardId) throw new Error("boardId is required");

  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CPB#${boardId}`,
        [SK]: "META",
      },
    }),
  );

  const item = res.Item;
  if (!item || item.ownerSub !== sub) {
    // Don't leak existence if not owned
    throw new Error("CreatorPrBoard not found");
  }

  return item;
}

// ─────────────────────────────────────────────
// Creator Social Pulse – pulses + content ideas
// ─────────────────────────────────────────────

async function requireCreatorSocialPulse(
  sub: string,
  pulseId: string,
) {
  if (!pulseId) throw new Error("pulseId is required");

  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CREATOR#${sub}`,
        [SK]: `PULSE#${pulseId}`,
      },
    }),
  );

  if (!res.Item) {
    throw new Error("CreatorSocialPulse not found");
  }

  return res.Item;
}

function findContentIdea(
  pulseItem: any,
  contentIdeaId: string,
): any {
  const ideas = Array.isArray(pulseItem.contentIdeas)
    ? pulseItem.contentIdeas
    : [];

  const idea =
    ideas.find((i: any) => i.id === contentIdeaId) ??
    ideas.find((i: any) => i.ideaId === contentIdeaId);

  if (!idea) {
    throw new Error("Content idea not found in pulse");
  }

  return idea;
}

async function listCreatorSocialPulses(
  sub: string,
  args: { limit?: number; nextToken?: string } | null,
) {
  const { limit = 20, nextToken } = args || {};

  const queryInput: any = {
    TableName: TABLE_NAME,
    KeyConditionExpression:
      "#pk = :pk AND begins_with(#sk, :prefix)",
    ExpressionAttributeNames: {
      "#pk": PK,
      "#sk": SK,
    },
    ExpressionAttributeValues: {
      ":pk": `CREATOR#${sub}`,
      ":prefix": "PULSE#",
    },
    Limit: limit,
  };

  if (nextToken) {
    queryInput.ExclusiveStartKey = {
      [PK]: `CREATOR#${sub}`,
      [SK]: nextToken,
    };
  }

  const res = await ddb.send(new QueryCommand(queryInput));
  const items = res.Items ?? [];

  return items.map((it) => mapCreatorSocialPulseItem(it, sub));
}

async function generateSocialPulse(
  sub: string,
  input: any | null,
) {
  if (!sub) throw new Error("Not authenticated");

  // If we don't have an SFN ARN configured yet, fall back to the simple
  // in-Lambda implementation so dev environments don't break.
  if (!SOCIAL_PULSE_SFN_ARN) {
    console.warn(
      "[SocialPulse] SOCIAL_PULSE_SFN_ARN not set – using local fallback",
    );

    const nowIso = now();
    const pulseId = uuid();

    const pk = `CREATOR#${sub}`;
    const sk = `PULSE#${pulseId}`;

    const nicheOverride = input?.nicheOverride ?? null;
    const platformsInput: string[] | undefined = input?.platforms;

    const defaultPlatforms: string[] =
      platformsInput && platformsInput.length
        ? platformsInput
        : ["TIKTOK", "INSTAGRAM", "YOUTUBE_SHORTS"];

    const item = {
      [PK]: pk,
      [SK]: sk,
      type: "CREATOR_SOCIAL_PULSE",

      id: pulseId,
      creatorId: sub,
      niche: nicheOverride,
      platforms: defaultPlatforms,

      trendBriefs: [] as any[],
      contentIdeas: [] as any[],

      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression:
          "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
        ExpressionAttributeNames: {
          "#pk": PK,
          "#sk": SK,
        },
      }),
    );

    return mapCreatorSocialPulseItem(item, sub);
  }

  // --- Normal path: call the Express state machine synchronously ---

  const payload = {
    creatorId: sub,
    nicheOverride: input?.nicheOverride ?? null,
    platforms: input?.platforms ?? null,
  };

  const resp = await sfnClient.send(
    new StartSyncExecutionCommand({
      stateMachineArn: SOCIAL_PULSE_SFN_ARN,
      input: JSON.stringify(payload),
    }),
  );

  if (!resp.output) {
    throw new Error("Social Pulse state machine returned no output");
  }

  // We design the persist step to return a final CreatorSocialPulse-ish object.
  const output = JSON.parse(resp.output);

  // If persist step returns the raw Dynamo item, map it. If it already looks
  // like a GraphQL shape, just pass it through.
  if (output && output.pk && output.sk) {
    return mapCreatorSocialPulseItem(output, sub);
  }

  return {
    id: output.id,
    creatorId: output.creatorId ?? sub,
    niche: output.niche ?? null,
    platforms: output.platforms ?? [],
    trendBriefs: output.trendBriefs ?? [],
    contentIdeas: output.contentIdeas ?? [],
    createdAt: output.createdAt ?? now(),
  } as any;
}

async function addContentIdeaToBoard(
  sub: string,
  input: any,
) {
  if (!input) throw new Error("input is required");

  const { boardId, pulseId, contentIdeaId } = input;

  if (!boardId) throw new Error("boardId is required");
  if (!pulseId) throw new Error("pulseId is required");
  if (!contentIdeaId) {
    throw new Error("contentIdeaId is required");
  }

  // 1) Enforce that the board belongs to this creator
  await requireCreatorPrBoard(sub, boardId);

  // 2) Load the Social Pulse and locate the idea
  const pulse = await requireCreatorSocialPulse(sub, pulseId);
  const idea = findContentIdea(pulse, contentIdeaId);

  const nowIso = now();
  const itemId = uuid();

  // Decide initial platform / status / notes based on idea + overrides
  const platform: string =
    input.platform ?? idea.recommendedPlatform ?? "TIKTOK";

  const status: string = input.status ?? "IDEA";

  const notes: string | null = input.notes ?? idea.hook ?? null;

  const item = {
    [PK]: `CPB#${boardId}`,
    [SK]: `ITEM#${nowIso}#${itemId}`,
    type: "CREATOR_PR_ITEM",

    id: itemId,
    boardId,
    creatorId: sub,
    ownerSub: sub,

    title: idea.title,
    platform,
    status,

    notes,

    pulseId,
    contentIdeaId,

    // Snapshot bare idea so changes to future pulses don't retroactively
    // mutate this planned content.
    ideaSnapshot: {
      title: idea.title,
      hook: idea.hook ?? null,
      outline: idea.outline ?? null,
      recommendedPlatform: idea.recommendedPlatform ?? null,
      recommendedLengthSec: idea.recommendedLengthSec ?? null,
    },

    // Emotional PR Engine fields start empty; will be filled by analysis job.
    emotionalToneLabels: [],
    audienceResponseLabel: null,
    brandAlignmentScore: null,
    prRiskLevel: null,
    lastEmotionalReviewAt: null,

    directorShootPlanId: null,
    directorAssetIds: [],
    scheduleSlotId: null,

    createdAt: nowIso,
    updatedAt: nowIso,

    // GSI for listing PR items by creator
    gsi1pk: `CREATOR#${sub}`,
    gsi1sk: `CPI#${boardId}#${nowIso}#${itemId}`,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: "attribute_not_exists(#pk)",
      ExpressionAttributeNames: {
        "#pk": PK,
      },
    }),
  );

  return mapCreatorPrItem(item);
}

// ─────────────────────────────────────────────
// CREATOR GOAL COMPASS
// ─────────────────────────────────────────────

function defaultGoalCompass() {
  return {
    primaryGoal: "GROWTH", // "GROWTH" | "BALANCE" | "BUSINESS_FIRST"
    timeHorizon: "90_DAYS", // "30_DAYS" | "90_DAYS" | "YEAR"
    weeklyCapacity: 5,
    focusAreas: ["PERSONALITY", "NURTURE"],
    riskTolerance: "MEDIUM",
    notes: null,
    updatedAt: null,

    contentMixTarget: {
      personality: 30,
      nurture: 30,
      authority: 20,
      conversion: 20,
    },
    contentMixActual: null,
    weeklyPathStatus: null,
    lastWeeklyCheckAt: null,
  };
}

async function getCreatorGoalCompass(sub: string) {
  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CREATOR#${sub}`,
        [SK]: "GOAL_COMPASS",
      },
    }),
  );

  if (!res.Item) {
    // no record yet -> return defaults (client can still save)
    return defaultGoalCompass();
  }

  const it = res.Item as any;

  return {
    primaryGoal: it.primaryGoal ?? "GROWTH",
    timeHorizon: it.timeHorizon ?? "90_DAYS",
    weeklyCapacity:
      typeof it.weeklyCapacity === "number" ? it.weeklyCapacity : 5,
    focusAreas:
      Array.isArray(it.focusAreas) && it.focusAreas.length
        ? it.focusAreas
        : ["PERSONALITY", "NURTURE"],
    riskTolerance: it.riskTolerance ?? "MEDIUM",
    notes: it.notes ?? null,
    updatedAt: it.updatedAt ?? null,

    contentMixTarget: it.contentMixTarget ?? null,
    contentMixActual: it.contentMixActual ?? null,
    weeklyPathStatus: it.weeklyPathStatus ?? null,
    lastWeeklyCheckAt: it.lastWeeklyCheckAt ?? null,
  };
}

async function updateCreatorGoalCompass(sub: string, input: any) {
  if (!input) throw new Error("input is required");

  const nowIso = now();

  // We treat this as an upsert that overwrites the current compass.
  const item: any = {
    [PK]: `CREATOR#${sub}`,
    [SK]: "GOAL_COMPASS",
    type: "CREATOR_GOAL_COMPASS",

    primaryGoal: input.primaryGoal ?? "GROWTH",
    timeHorizon: input.timeHorizon ?? "90_DAYS",
    weeklyCapacity:
      typeof input.weeklyCapacity === "number"
        ? input.weeklyCapacity
        : 5,
    focusAreas:
      Array.isArray(input.focusAreas) && input.focusAreas.length
        ? input.focusAreas
        : ["PERSONALITY", "NURTURE"],
    riskTolerance: input.riskTolerance ?? "MEDIUM",
    notes: input.notes ?? null,
    updatedAt: nowIso,

    contentMixTarget:
      input.contentMixTarget ?? {
        personality: 30,
        nurture: 30,
        authority: 20,
        conversion: 20,
      },
    // contentMixActual, weeklyPathStatus, lastWeeklyCheckAt
    // will normally be written by analytics pipelines, not the UI.
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  return {
    primaryGoal: item.primaryGoal,
    timeHorizon: item.timeHorizon,
    weeklyCapacity: item.weeklyCapacity,
    focusAreas: item.focusAreas,
    riskTolerance: item.riskTolerance,
    notes: item.notes,
    updatedAt: item.updatedAt,

    contentMixTarget: item.contentMixTarget,
    contentMixActual: item.contentMixActual ?? null,
    weeklyPathStatus: item.weeklyPathStatus ?? null,
    lastWeeklyCheckAt: item.lastWeeklyCheckAt ?? null,
  };
}

// ─────────────────────────────────────────────
// Director Suite – Emotion Preview
// ─────────────────────────────────────────────

type ContentMixShape = {
  personality: number;
  nurture: number;
  authority: number;
  conversion: number;
};

async function runCreatorEmotionPreview(event: any): Promise<any> {
  const sub =
    event.identity?.sub ||
    event.identity?.claims?.sub ||
    event.arguments?.creatorId;

  if (!sub) {
    throw new Error("Missing creator identity");
  }

  const creatorId = sub;
  const pkValue = `CREATOR#${creatorId}`;
  const skValue = "GOAL_COMPASS";

  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: pkValue,
        [SK]: skValue,
      },
    }),
  );

  const item = res.Item as any | undefined;

  // Default target if they don't have a compass yet
  const defaultTarget: ContentMixShape = {
    personality: 30,
    nurture: 30,
    authority: 20,
    conversion: 20,
  };

  const target: ContentMixShape = item?.contentMixTarget ?? defaultTarget;
  const actual: ContentMixShape = item?.contentMixActual ?? target;

  const weeklyPathStatus: string = item?.weeklyPathStatus ?? "ON_PATH";
  const lastWeeklyCheckAt: string | undefined =
    item?.lastWeeklyCheckAt ?? item?.updatedAt;

  return {
    target,
    actual,
    weeklyPathStatus,
    lastWeeklyCheckAt: lastWeeklyCheckAt || null,
  };
}

// ─────────────────────────────────────────────
// CREATOR SOCIAL OS – WEEKLY SCHEDULE
// ─────────────────────────────────────────────

function mapScheduleSlot(item: any) {
  if (!item) return null;
  return {
    id: item.id,
    creatorSub: item.creatorSub,
    weekOf: item.weekOf,
    day: item.day,
    timeOfDay: item.timeOfDay,
    platformHint: item.platformHint ?? null,
    focusHint: item.focusHint ?? null,
    status: item.status ?? "PLANNED",
    notes: item.notes ?? null,
    directorShootId: item.directorShootId ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function creatorScheduleWeek(sub: string, weekOf: string) {
  if (!weekOf) throw new Error("weekOf is required");

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression:
        "#pk = :pk AND begins_with(#sk, :skPrefix)",
      ExpressionAttributeNames: {
        "#pk": PK,
        "#sk": SK,
      },
      ExpressionAttributeValues: {
        ":pk": `CREATOR#${sub}`,
        ":skPrefix": `SCHEDULE#${weekOf}#`,
      },
    }),
  );

  const items =
    (res.Items || []).filter(
      (it) => it.type === "CREATOR_SCHEDULE_SLOT",
    ) ?? [];

  return {
    weekOf,
    slots: items.map(mapScheduleSlot),
  };
}

async function upsertCreatorScheduleSlot(sub: string, input: any) {
  if (!input) throw new Error("input is required");
  const { weekOf, day, timeOfDay } = input;
  if (!weekOf) throw new Error("weekOf is required");
  if (!day) throw new Error("day is required");
  if (!timeOfDay) throw new Error("timeOfDay is required");

  const id = input.id || uuid();
  const nowIso = now();

  const item = {
    [PK]: `CREATOR#${sub}`,
    [SK]: `SCHEDULE#${weekOf}#${id}`,
    type: "CREATOR_SCHEDULE_SLOT",
    id,
    creatorSub: sub,
    weekOf,
    day,
    timeOfDay,
    platformHint: input.platformHint ?? null,
    focusHint: input.focusHint ?? null,
    status: input.status ?? "PLANNED",
    notes: input.notes ?? null,
    directorShootId: input.directorShootId ?? null,
    createdAt: input.createdAt || nowIso,
    updatedAt: nowIso,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  return mapScheduleSlot(item);
}

async function deleteCreatorScheduleSlot(
  sub: string,
  id: string,
  weekOf: string,
) {
  if (!id) throw new Error("id is required");
  if (!weekOf) throw new Error("weekOf is required");

  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CREATOR#${sub}`,
        [SK]: `SCHEDULE#${weekOf}#${id}`,
      },
    }),
  );

  return true;
}

// ─────────────────────────────────────────────
// IMPORT FROM CLOSET → CABINET
// ─────────────────────────────────────────────

async function importClosetItemToCabinet(sub: string, input: any) {
  const {
    closetItemId,
    cabinetId,
    folderId,
    kind,
    title,
    notes,
    tags = [],
  } = input || {};

  if (!closetItemId) throw new Error("closetItemId is required");
  if (!cabinetId) throw new Error("cabinetId is required");

  // 1) Ensure target cabinet belongs to this user
  const cabinet = await getCabinet(sub, cabinetId);
  if (!cabinet) {
    throw new Error("Cabinet not found");
  }

  // 2) Look up the closet item.
  //
  // NOTE: This assumes closet items are keyed by:
  //   pk = `CLOSET#${sub}`
  //   sk = `ITEM#${closetItemId}`
  //
  // If your actual pattern is different, adjust PK/SK accordingly.
  const closetRes = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CLOSET#${sub}`,
        [SK]: `ITEM#${closetItemId}`,
      },
    }),
  );

  const closetItem = closetRes.Item;
  if (!closetItem || (closetItem as any).ownerSub !== sub) {
    throw new Error("Closet item not found");
  }

  const assetId = uuid();
  const nowIso = now();

  // Reuse the existing closet media key if possible.
  const s3Key =
    (closetItem as any).mediaKey ||
    (closetItem as any).rawMediaKey ||
    (() => {
      throw new Error("Closet item has no media key");
    })();

  const assetKind = kind ?? "PHOTO";
  const finalTitle = title ?? (closetItem as any).title ?? null;
  const finalNotes = notes ?? (closetItem as any).notes ?? null;
  const finalTags =
    tags.length ? tags : (closetItem as any).colorTags ?? [];

  const item = {
    [PK]: `CAB#${cabinetId}`,
    [SK]: `ASSET#${assetId}`,
    type: "ASSET",
    id: assetId,
    cabinetId,
    folderId: folderId ?? null,
    ownerSub: sub,
    kind: assetKind,
    category: "OUTFIT_REFS",
    title: finalTitle,
    notes: finalNotes,
    tags: finalTags,
    s3Key,
    contentType: (closetItem as any).contentType ?? "image/jpeg",
    createdAt: nowIso,
    updatedAt: nowIso,
    sourceClosetItemId: closetItemId,

    // moderation defaults
    moderationStatus: "ACTIVE" as const,
    moderationReason: null,
    moderatedBy: null,
    moderatedAt: null,

    // GSI for admin listing by user
    gsi1pk: `CREATOR#${sub}`,
    gsi1sk: `CAB_ASSET#${cabinetId}#${nowIso}#${assetId}`,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  // Best-effort bump cabinet assetCount
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: `CAB#${cabinetId}`,
        [SK]: "META",
      },
      UpdateExpression:
        "SET #assetCount = if_not_exists(#assetCount, :zero) + :one, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#assetCount": "assetCount",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":zero": 0,
        ":one": 1,
        ":updatedAt": nowIso,
      },
    }),
  );

  return mapAsset(item);
}

// ─────────────────────────────────────────────
// AI – stubbed (safe, no Bedrock needed)
// ─────────────────────────────────────────────

async function runCreatorAi(event: any) {
  const text: string = event.arguments?.text ?? "";
  const kind: string = event.arguments?.kind ?? "OTHER";

  const base = text || "your content";
  const suggestions: string[] = [];

  if (kind === "CAPTION") {
    suggestions.push(
      `Behind the scenes of ${base} ✨`,
      `Styling ${base} so you don't have to 💅`,
    );
  } else if (kind === "HASHTAGS") {
    suggestions.push(
      "#stylingadventures #creatorlife #behindthescenes",
      "#outfitinspo #contentcreator #filmingday",
    );
  } else {
    suggestions.push(`Planning ideas for ${base}`);
  }

  return { suggestions };
}

// ─────────────────────────────────────────────
// GraphQL handler – router
// ─────────────────────────────────────────────

export const handler = async (event: any) => {
  const field = event.info?.fieldName;
  const sub =
    event.identity?.sub ||
    event.identity?.claims?.sub ||
    "anonymous";
  const args = event.arguments || {};

  switch (field) {
    // CABINETS
    case "creatorCabinets":
      return listCabinets(sub);
    case "creatorCabinet":
      return getCabinet(sub, args.id);
    case "createCreatorCabinet":
      return createCabinet(sub, args.input);
    case "updateCreatorCabinet":
      return updateCabinet(sub, args.input);
    case "deleteCreatorCabinet":
      return deleteCabinet(sub, args.id);

    // FOLDERS
    case "creatorCabinetFolders":
      return listFolders(sub, args.cabinetId);

    // Back-compat alias
    case "creatorFolders":
      return listFolders(sub, args.cabinetId);

    case "createCreatorFolder":
      return createFolder(sub, args.input);
    case "renameCreatorFolder":
      return renameFolder(sub, args.input);
    case "deleteCreatorFolder":
      return deleteFolder(
        sub,
        args.id,
        args.cabinetId,
      );

    // ASSETS – creator-facing
    case "creatorCabinetAssets":
      return listAssets(sub, args);
    case "createCreatorAssetUpload":
      return createAssetUpload(sub, args.input);
    case "updateCreatorAsset":
      return updateAsset(sub, args.input);
    case "deleteCreatorAsset":
      return deleteAsset(sub, args.id, args.cabinetId);
    case "moveCreatorAsset":
      return moveAsset(sub, args.input);
    case "importClosetItemToCabinet":
      return importClosetItemToCabinet(sub, args.input);

    // ADMIN moderation / listing
    case "adminListCreatorAssetsByUser":
      return adminListCreatorAssetsByUser(args);
    case "adminGetCreatorAsset":
      return adminGetCreatorAsset(args);
    case "adminModerateCreatorAsset":
      return adminModerateCreatorAsset(sub, args.input);
    case "adminSoftDeleteCreatorAsset":
      return adminSoftDeleteCreatorAsset(sub, args.input);
    case "adminRestoreCreatorAsset":
      return adminRestoreCreatorAsset(sub, args.input);
    case "adminRejectCreatorAsset":
      return adminRejectCreatorAsset(sub, args.input);

    // Monetization HQ – earnings by platform (mocked)
    case "creatorRevenueByPlatform":
      return creatorRevenueByPlatformResolver(event);

    // Goal compass (creator alignment)
    case "creatorGoalCompass":
      return getCreatorGoalCompass(sub);
    case "updateCreatorGoalCompass":
      return updateCreatorGoalCompass(sub, args.input);

    // Emotion preview vs Goal Compass
    case "runCreatorEmotionPreview":
      return runCreatorEmotionPreview(event);

    // Creator Social OS – weekly schedule
    case "creatorScheduleWeek":
      return creatorScheduleWeek(sub, args.weekOf);
    case "upsertCreatorScheduleSlot":
      return upsertCreatorScheduleSlot(sub, args.input);
    case "deleteCreatorScheduleSlot":
      return deleteCreatorScheduleSlot(sub, args.id, args.weekOf);

    // PR & Content Studio (planner)
    case "creatorPrBoards":
      return listCreatorPrBoards(sub);
    case "creatorPrItemsByBoard":
      return listCreatorPrItemsByBoard(sub, args.boardId);
    case "createCreatorPrBoard":
      return createCreatorPrBoard(sub, args.input);
    case "addContentIdeaToBoard":
      return addContentIdeaToBoard(sub, args.input);

    // Director Suite – shoot plans
    case "getDirectorShootPlan":
      return getDirectorShootPlan(sub, args.id);
    case "saveDirectorShootPlan":
      return saveDirectorShootPlan(sub, args.input);

    // Social Pulse
    case "creatorSocialPulses":
      return listCreatorSocialPulses(sub, {
        limit: args.limit,
        nextToken: args.nextToken,
      });
    case "generateSocialPulse":
      return generateSocialPulse(sub, args.input);

    // AI
    case "creatorAiSuggest":
      return runCreatorAi(event);

    default:
      throw new Error(`Unknown field ${field}`);
  }
};

