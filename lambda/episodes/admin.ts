// lambda/episodes/admin.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { AppSyncIdentityCognito } from "aws-lambda";
import { TABLE_NAME } from "../_shared/env";

const {
  ADMIN_GROUP_NAME = "ADMIN",
} = process.env;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

type SAIdentity =
  | (AppSyncIdentityCognito & { groups?: string[] | null })
  | null
  | undefined;

function getGroups(id: SAIdentity): string[] {
  if (!id) return [];
  const claims: any = (id as any).claims || {};
  const raw =
    claims["cognito:groups"] ||
    claims["custom:groups"] ||
    (id as any).groups ||
    [];
  if (Array.isArray(raw)) return raw.map((g) => String(g));
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function isAdmin(id: SAIdentity): boolean {
  const groups = getGroups(id).map((g) => g.toUpperCase());
  return groups.includes(ADMIN_GROUP_NAME.toUpperCase());
}

function requireAdmin(id: SAIdentity) {
  if (!id?.sub) throw new Error("Unauthorized");
  if (!isAdmin(id)) throw new Error("Forbidden");
}

function episodePk(id: string) {
  return `EPISODE#${id}`;
}
const EP_SK = "META";

function buildEpisodeGsi1(
  status: string,
  publicAt: string,
  id: string,
) {
  const safeStatus = (status || "DRAFT").toUpperCase();
  const iso = new Date(publicAt || Date.now()).toISOString();
  return {
    gsi1pk: "EPISODE",
    gsi1sk: `STATUS#${safeStatus}#${iso}#${id}`,
  };
}

function mapEpisodeItem(it: any) {
  if (!it) return null;
  return {
    id: (it.id || it.episodeId || (it.pk || "").replace("EPISODE#", "")) as string,
    title: it.title || "",
    season: it.season ?? null,
    episodeNumber: it.episodeNumber ?? null,
    showId: it.showId ?? null,
    shortDescription: it.shortDescription ?? "",
    fullDescription: it.fullDescription ?? "",
    status: (it.status || "DRAFT") as string,
    publicAt: it.publicAt || new Date().toISOString(),
    durationSeconds: it.durationSeconds ?? null,
    unlockCoinCost: it.unlockCoinCost ?? null,
    chatEnabled: it.chatEnabled ?? true,
    thumbnails: Array.isArray(it.thumbnails) ? it.thumbnails : [],
    outfitsLinkedCount: it.outfitsLinkedCount ?? 0,
  };
}

type AppSyncEvent = {
  info: { fieldName: string };
  arguments: any;
  identity?: SAIdentity;
};

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;
  const identity = event.identity;

  // ─────────────────────────────────────────
  // adminCreateEpisode
  // ─────────────────────────────────────────
  if (fieldName === "adminCreateEpisode") {
    requireAdmin(identity);

    const input = event.arguments?.input || {};
    if (!input.title || !input.publicAt) {
      throw new Error("title and publicAt are required");
    }

    const nowIso = new Date().toISOString();
    const rawId: string =
      input.id ||
      `ep-${Date.now()}`;
    const id = String(rawId);

    const status: string = (input.status || "DRAFT") as string;
    const publicAtIso = new Date(input.publicAt).toISOString();

    const gsi = buildEpisodeGsi1(status, publicAtIso, id);

    const item: any = {
      pk: episodePk(id),
      sk: EP_SK,
      id,
      title: input.title,
      season: input.season ?? null,
      episodeNumber: input.episodeNumber ?? null,
      showId: input.showId ?? null,
      shortDescription: input.shortDescription ?? "",
      fullDescription: input.fullDescription ?? "",
      status,
      publicAt: publicAtIso,
      durationSeconds: input.durationSeconds ?? null,
      unlockCoinCost:
        typeof input.unlockCoinCost === "number" ? input.unlockCoinCost : null,
      chatEnabled:
        typeof input.chatEnabled === "boolean" ? input.chatEnabled : true,
      thumbnails: Array.isArray(input.thumbnails) ? input.thumbnails : [],
      outfitsLinkedCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      type: "EPISODE",
      ...gsi,
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );

    return mapEpisodeItem(item);
  }

  // ─────────────────────────────────────────
  // adminUpdateEpisode
  // ─────────────────────────────────────────
  if (fieldName === "adminUpdateEpisode") {
    requireAdmin(identity);

    const { episodeId, input } = event.arguments || {};
    if (!episodeId) throw new Error("episodeId is required");
    const id = String(episodeId);
    const pk = episodePk(id);

    const updates: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, any> = {};

    function setField(fieldName: string, value: any, attrName: string) {
      names[attrName] = fieldName;
      values[`:${attrName.slice(1)}`] = value;
      updates.push(`${attrName} = ${`:${attrName.slice(1)}`}`);
    }

    if (!input || typeof input !== "object") {
      throw new Error("input is required");
    }

    if (input.title != null) setField("title", input.title, "#title");
    if (input.season != null) setField("season", input.season, "#season");
    if (input.episodeNumber != null)
      setField("episodeNumber", input.episodeNumber, "#epnum");
    if (input.showId != null) setField("showId", input.showId, "#show");
    if (input.shortDescription != null)
      setField("shortDescription", input.shortDescription, "#short");
    if (input.fullDescription != null)
      setField("fullDescription", input.fullDescription, "#full");
    if (input.status != null) setField("status", input.status, "#status");
    if (input.publicAt != null)
      setField("publicAt", new Date(input.publicAt).toISOString(), "#pub");
    if (input.durationSeconds != null)
      setField("durationSeconds", input.durationSeconds, "#dur");
    if (input.unlockCoinCost != null)
      setField("unlockCoinCost", input.unlockCoinCost, "#cost");
    if (input.chatEnabled != null)
      setField("chatEnabled", input.chatEnabled, "#chat");
    if (input.thumbnails != null)
      setField("thumbnails", input.thumbnails, "#thumbs");

    // always bump updatedAt
    names["#updatedAt"] = "updatedAt";
    values[":updatedAt"] = new Date().toISOString();
    updates.push("#updatedAt = :updatedAt");

    if (updates.length === 0) {
      // nothing to change; just return existing
      const got = await ddb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { pk, sk: EP_SK },
        }),
      );
      return mapEpisodeItem(got.Item);
    }

    // We also need to keep gsi1 in sync if status/publicAt changed.
    // Fetch current values first.
    const current = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: EP_SK },
      }),
    );
    if (!current.Item) throw new Error("Episode not found");

    const currStatus = (current.Item.status || "DRAFT") as string;
    const currPublicAt = current.Item.publicAt || new Date().toISOString();

    const nextStatus = (input.status ?? currStatus) as string;
    const nextPublicAt = input.publicAt
      ? new Date(input.publicAt).toISOString()
      : currPublicAt;

    const gsi = buildEpisodeGsi1(nextStatus, nextPublicAt, id);

    names["#gsi1pk"] = "gsi1pk";
    names["#gsi1sk"] = "gsi1sk";
    values[":gsi1pk"] = gsi.gsi1pk;
    values[":gsi1sk"] = gsi.gsi1sk;
    updates.push("#gsi1pk = :gsi1pk");
    updates.push("#gsi1sk = :gsi1sk");

    const upd = await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: EP_SK },
        UpdateExpression: `SET ${updates.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      }),
    );

    return mapEpisodeItem(upd.Attributes);
  }

  // ─────────────────────────────────────────
  // adminListEpisodes
  // ─────────────────────────────────────────
  if (fieldName === "adminListEpisodes") {
    requireAdmin(identity);

    const {
      status,
      showId,
      season,
      limit = 20,
      nextToken,
    } = event.arguments || {};

    const queryInput: any = {
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :p",
      ExpressionAttributeValues: {
        ":p": "EPISODE",
      },
      ScanIndexForward: false, // newest publicAt first
      Limit: Math.min(100, Math.max(1, limit)),
    };

    const attrNames: Record<string, string> = {};
    const extraFilter: string[] = [];

    if (status) {
      // Use begins_with on gsi1sk to filter by status
      attrNames["#sk"] = "gsi1sk";
      queryInput.KeyConditionExpression =
        "gsi1pk = :p AND begins_with(#sk, :skPrefix)";
      queryInput.ExpressionAttributeNames = attrNames;
      queryInput.ExpressionAttributeValues[":skPrefix"] =
        `STATUS#${String(status).toUpperCase()}#`;
    }

    if (nextToken) {
      try {
        queryInput.ExclusiveStartKey = JSON.parse(nextToken);
      } catch {
        // ignore bad token
      }
    }

    // Optional server-side filter for showId/season
    if (showId) {
      attrNames["#showId"] = "showId";
      queryInput.ExpressionAttributeNames = {
        ...(queryInput.ExpressionAttributeNames || {}),
        "#showId": "showId",
      };
      queryInput.ExpressionAttributeValues[":showId"] = showId;
      extraFilter.push("#showId = :showId");
    }

    if (typeof season === "number") {
      attrNames["#season"] = "season";
      queryInput.ExpressionAttributeNames = {
        ...(queryInput.ExpressionAttributeNames || {}),
        "#season": "season",
      };
      queryInput.ExpressionAttributeValues[":season"] = season;
      extraFilter.push("#season = :season");
    }

    if (extraFilter.length) {
      queryInput.FilterExpression = extraFilter.join(" AND ");
    }

    const out = await ddb.send(new QueryCommand(queryInput));
    const items = (out.Items || []).map(mapEpisodeItem);
    const newNextToken = out.LastEvaluatedKey
      ? JSON.stringify(out.LastEvaluatedKey)
      : null;

    return {
      items,
      nextToken: newNextToken,
    };
  }

  throw new Error(`Unknown field ${fieldName}`);
};
