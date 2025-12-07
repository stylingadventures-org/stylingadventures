// lambda/creator/cabinets.ts
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  S3Client,
  PutObjectCommand, // for non-presigned (optional)
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// ---------- shared tier helper (same logic as creator/ai.ts) ---------

type UserTier = "FREE" | "BESTIE" | "CREATOR" | "COLLAB" | "ADMIN" | "PRIME";

function getUserTier(identity: any): UserTier {
  const claims = identity?.claims || {};
  const tierClaim =
    (claims["custom:tier"] as string | undefined) ||
    (claims["tier"] as string | undefined);

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

  if (
    tierClaim &&
    ["FREE", "BESTIE", "CREATOR", "COLLAB", "ADMIN", "PRIME"].includes(
      tierClaim,
    )
  ) {
    return tierClaim as UserTier;
  }
  return "FREE";
}

function requireCreator(identity: any): UserTier {
  const tier = getUserTier(identity);
  if (!["CREATOR", "COLLAB", "ADMIN", "PRIME"].includes(tier)) {
    throw new Error("Creator tier required");
  }
  return tier;
}

function requireSub(identity: any): string {
  if (!identity?.sub) throw new Error("Unauthenticated");
  return identity.sub as string;
}

// ---------- env / clients --------------------------------------------

const TABLE_NAME = process.env.TABLE_NAME!;
const CREATOR_MEDIA_BUCKET = process.env.CREATOR_MEDIA_BUCKET!;
const ddb = new DynamoDBClient({});
const s3 = new S3Client({});

const ddbM = (v: any) => marshall(v, { removeUndefinedValues: true });

function pkUser(sub: string) {
  return `USER#${sub}`;
}
function skCabinet(id: string) {
  return `CREATOR_CABINET#${id}`;
}
function pkCabinet(id: string) {
  return `CABINET#${id}`;
}
function skAsset(id: string) {
  return `ASSET#${id}`;
}

// ---------- mappers --------------------------------------------------

function mapCabinet(raw: any) {
  const item = unmarshall(raw) as any;
  return {
    id: item.id,
    ownerSub: item.ownerSub,
    name: item.name,
    description: item.description,
    defaultCategory: item.defaultCategory,
    assetCount: item.assetCount ?? 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapAsset(raw: any) {
  const item = unmarshall(raw) as any;
  return {
    id: item.id,
    cabinetId: item.cabinetId,
    ownerSub: item.ownerSub,
    kind: item.kind,
    category: item.category,
    title: item.title,
    notes: item.notes,
    tags: item.tags ?? [],
    s3Key: item.s3Key,
    contentType: item.contentType,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// ---------- handlers -------------------------------------------------

async function handleCreatorCabinets(identity: any) {
  requireCreator(identity);
  const sub = requireSub(identity);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: ddbM({
        ":pk": pkUser(sub),
        ":sk": "CREATOR_CABINET#",
      }),
    }),
  );

  return (res.Items ?? []).map(mapCabinet);
}

async function handleCreatorCabinet(args: { id: string }, identity: any) {
  requireCreator(identity);
  const sub = requireSub(identity);

  const res = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: ddbM({ pk: pkUser(sub), sk: skCabinet(args.id) }),
    }),
  );

  if (!res.Item) return null;
  return mapCabinet(res.Item);
}

async function handleCreateCreatorCabinet(
  args: { input: any },
  identity: any,
) {
  requireCreator(identity);
  const sub = requireSub(identity);
  const now = new Date().toISOString();
  const id = randomUUID();
  const input = args.input || {};

  const item = {
    pk: pkUser(sub),
    sk: skCabinet(id),
    entityType: "CREATOR_CABINET",
    id,
    ownerSub: sub,
    name: input.name,
    description: input.description ?? null,
    defaultCategory: input.defaultCategory ?? null,
    assetCount: 0,
    createdAt: now,
    updatedAt: now,
    gsi1pk: "CREATOR_CABINET",
    gsi1sk: now,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbM(item),
    }),
  );

  return mapCabinet(item);
}

async function handleUpdateCreatorCabinet(
  args: { input: any },
  identity: any,
) {
  requireCreator(identity);
  const sub = requireSub(identity);
  const { id, ...patch } = args.input || {};
  if (!id) throw new Error("id is required");
  const now = new Date().toISOString();

  const sets: string[] = ["updatedAt = :now"];
  const values: any = { ":now": now };

  if (patch.name != null) {
    sets.push("name = :name");
    values[":name"] = patch.name;
  }
  if (patch.description !== undefined) {
    sets.push("description = :desc");
    values[":desc"] = patch.description;
  }
  if (patch.defaultCategory !== undefined) {
    sets.push("defaultCategory = :cat");
    values[":cat"] = patch.defaultCategory;
  }

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbM({ pk: pkUser(sub), sk: skCabinet(id) }),
      UpdateExpression: "SET " + sets.join(", "),
      ExpressionAttributeValues: ddbM(values),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) throw new Error("Cabinet not found");
  return mapCabinet(res.Attributes);
}

async function handleDeleteCreatorCabinet(
  args: { id: string },
  identity: any,
) {
  requireCreator(identity);
  const sub = requireSub(identity);

  await ddb.send(
    new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: ddbM({ pk: pkUser(sub), sk: skCabinet(args.id) }),
    }),
  );

  // NOTE: assets remain for now – later we can add a background cleanup.
  return true;
}

async function handleCreatorCabinetAssets(
  args: { cabinetId: string; limit?: number | null },
  identity: any,
) {
  requireCreator(identity);
  const sub = requireSub(identity); // not used yet, but could be checked later
  const limit =
    args.limit && args.limit > 0 && args.limit <= 50 ? args.limit : 24;

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: ddbM({
        ":pk": pkCabinet(args.cabinetId),
        ":sk": "ASSET#",
      }),
      Limit: limit,
    }),
  );

  return {
    items: (res.Items ?? []).map(mapAsset),
    nextToken: null, // simple for now
  };
}

async function handleCreateCreatorAssetUpload(
  args: { input: any },
  identity: any,
) {
  requireCreator(identity);
  const sub = requireSub(identity);
  const {
    cabinetId,
    fileName,
    contentType,
    kind,
    category,
    title,
    notes,
    tags,
  } = args.input || {};

  if (!cabinetId || !fileName || !contentType || !kind) {
    throw new Error("cabinetId, fileName, contentType, and kind are required");
  }

  const now = new Date().toISOString();
  const assetId = randomUUID();

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const s3Key = `creator-media/${sub}/${cabinetId}/${assetId}-${safeName}`;

  // build asset record
  const assetItem = {
    pk: pkCabinet(cabinetId),
    sk: skAsset(assetId),
    entityType: "CREATOR_ASSET",
    id: assetId,
    cabinetId,
    ownerSub: sub,
    kind,
    category: category ?? null,
    title: title ?? null,
    notes: notes ?? null,
    tags: tags ?? [],
    s3Key,
    contentType,
    createdAt: now,
    updatedAt: now,
    gsi1pk: `CREATOR_ASSET#USER#${sub}`,
    gsi1sk: `${category || "OTHER"}#${now}`,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: ddbM(assetItem),
    }),
  );

  // increment cabinet assetCount
  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: ddbM({ pk: pkUser(sub), sk: skCabinet(cabinetId) }),
      UpdateExpression:
        "SET assetCount = if_not_exists(assetCount, :zero) + :one, updatedAt = :now",
      ExpressionAttributeValues: ddbM({
        ":zero": 0,
        ":one": 1,
        ":now": now,
      }),
    }),
  );

  // presigned upload URL
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: CREATOR_MEDIA_BUCKET,
      Key: s3Key,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 10 }, // 10 minutes
  );

  return {
    uploadUrl,
    asset: mapAsset(assetItem),
  };
}

// ---------- AppSync entrypoint ---------------------------------------

export const handler = async (event: any) => {
  console.log("CreatorCabinetFn event", JSON.stringify(event));
  const fieldName = event.info?.fieldName as string | undefined;
  const identity = event.identity;

  try {
    switch (fieldName) {
      case "creatorCabinets":
        return await handleCreatorCabinets(identity);
      case "creatorCabinet":
        return await handleCreatorCabinet(event.arguments, identity);
      case "createCreatorCabinet":
        return await handleCreateCreatorCabinet(event.arguments, identity);
      case "updateCreatorCabinet":
        return await handleUpdateCreatorCabinet(event.arguments, identity);
      case "deleteCreatorCabinet":
        return await handleDeleteCreatorCabinet(event.arguments, identity);
      case "creatorCabinetAssets":
        return await handleCreatorCabinetAssets(event.arguments, identity);
      case "createCreatorAssetUpload":
        return await handleCreateCreatorAssetUpload(event.arguments, identity);
      default:
        throw new Error(`Unsupported field in CreatorCabinetFn: ${fieldName}`);
    }
  } catch (err) {
    console.error("Error in CreatorCabinetFn", err);
    throw err;
  }
};
