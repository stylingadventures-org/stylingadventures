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

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME!;
const CREATOR_MEDIA_BUCKET = process.env.CREATOR_MEDIA_BUCKET!;
const PK = process.env.PK_NAME || "pk";
const SK = process.env.SK_NAME || "sk";
const STATUS_GSI = process.env.STATUS_GSI || "gsi1";

function now() {
  return new Date().toISOString();
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

  switch (field) {
    // CABINETS
    case "creatorCabinets":
      return listCabinets(sub);
    case "creatorCabinet":
      return getCabinet(sub, event.arguments?.id);
    case "createCreatorCabinet":
      return createCabinet(sub, event.arguments?.input);
    case "updateCreatorCabinet":
      // schema: updateCreatorCabinet(input: UpdateCreatorCabinetInput!)
      return updateCabinet(sub, event.arguments?.input);
    case "deleteCreatorCabinet":
      return deleteCabinet(sub, event.arguments?.id);

    // FOLDERS
    case "creatorFolders":
      return listFolders(sub, event.arguments?.cabinetId);
    case "createCreatorFolder":
      return createFolder(sub, event.arguments?.input);
    case "renameCreatorFolder":
      return renameFolder(sub, event.arguments?.input);
    case "deleteCreatorFolder":
      return deleteFolder(sub, event.arguments?.id, event.arguments?.cabinetId);

    // ASSETS
    case "creatorCabinetAssets":
      return listAssets(sub, event.arguments);
    case "createCreatorAssetUpload":
      return createAssetUpload(sub, event.arguments?.input);
    case "updateCreatorAsset":
      return updateAsset(sub, event.arguments?.input);
    case "deleteCreatorAsset":
      return deleteAsset(sub, event.arguments?.id, event.arguments?.cabinetId);
    case "moveCreatorAsset":
      return moveAsset(sub, event.arguments?.input);

    // AI
    case "creatorAiSuggest":
      return runCreatorAi(event);

    default:
      throw new Error(`Unknown field ${field}`);
  }
};

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
      KeyConditionExpression: "#gpk = :gpk AND begins_with(#gsk, :prefix)",
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

  const items = res.Items ?? [];
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
      FilterExpression: "#folderId = :folderId",
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
// ASSETS
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

  // 1) create ASSET row in Dynamo (pending upload)
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
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
      },
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
    asset: {
      id: assetId,
      cabinetId,
      folderId,
      ownerSub: sub,
      kind: assetKind,
      category,
      title,
      notes,
      tags,
      s3Key,
      contentType,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
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
