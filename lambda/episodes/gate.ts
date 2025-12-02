// lambda/episodes/gate.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { AppSyncIdentityCognito } from "aws-lambda";
import { TABLE_NAME } from "../_shared/env";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

type SAIdentity =
  | (AppSyncIdentityCognito & { groups?: string[] | null })
  | null
  | undefined;

type AppSyncEvent = {
  info: { fieldName: string };
  arguments: any;
  identity?: SAIdentity;
};

// Helpers ---------------------------------------------------

function episodePk(id: string) {
  return `EPISODE#${id}`;
}
const EP_SK = "META";

function profilePk(sub: string) {
  return `USER#${sub}`;
}
const PROFILE_SK = "PROFILE";

function unlockSk(epId: string) {
  return `EP_UNLOCK#${epId}`;
}

function mapEpisode(it: any) {
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

async function loadEpisode(episodeId: string) {
  const got = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: episodePk(episodeId), sk: EP_SK },
    }),
  );
  if (!got.Item) throw new Error("Episode not found");
  return got.Item;
}

async function loadProfile(sub: string) {
  const got = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: profilePk(sub), sk: PROFILE_SK },
    }),
  );

  // If no profile row yet, treat as 0 coins/xp.
  const it = got.Item || {};
  return {
    userId: it.userId || sub,
    coins: Number(it.coins ?? 0),
    xp: Number(it.xp ?? 0),
    level: Number(it.level ?? 1),
    lastEventAt: (it.lastEventAt as string | undefined) ?? null,
  };
}

// isEpisodeEarlyAccess result shape (matches your earlier idea)
function buildEarlyAccessResult(epItem: any, now: Date) {
  const status = (epItem.status || "DRAFT") as string;
  const publicAtIso = epItem.publicAt || new Date().toISOString();
  const publicAt = new Date(publicAtIso);
  const isPublic = status === "PUBLISHED" && publicAt.getTime() <= now.getTime();

  return {
    episodeId: (epItem.id ||
      epItem.episodeId ||
      (epItem.pk || "").replace("EPISODE#", "")) as string,
    status,
    publicAt: publicAtIso,
    isPublic,
  };
}

// Handler ---------------------------------------------------

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;
  const identity = event.identity;
  const now = new Date();

  // ─────────────────────────────────────────
  // isEpisodeEarlyAccess(episodeId: ID!): EpisodeAccess!
  // ─────────────────────────────────────────
  if (fieldName === "isEpisodeEarlyAccess") {
    const { episodeId } = event.arguments || {};
    if (!episodeId) throw new Error("episodeId is required");

    const epItem = await loadEpisode(String(episodeId));
    return buildEarlyAccessResult(epItem, now);
  }

  // ─────────────────────────────────────────
  // unlockEpisode(episodeId: ID!): UnlockEpisodeResult!
  // ─────────────────────────────────────────
  if (fieldName === "unlockEpisode") {
    if (!identity?.sub) throw new Error("Unauthorized");
    const userId = identity.sub;
    const { episodeId } = event.arguments || {};
    if (!episodeId) throw new Error("episodeId is required");
    const epId = String(episodeId);

    // 1) Load episode meta
    const epItem = await loadEpisode(epId);
    const episode = mapEpisode(epItem);

    // 🔐 Type guard so TS knows `episode` is not null anymore
    if (!episode) {
      throw new Error(`Episode not found for id=${episodeId}`);
    }

    const cost = Number(episode.unlockCoinCost ?? 0);
    const nowIso = now.toISOString();

    // 2) Check if already unlocked (idempotent, no double-charge)
    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: profilePk(userId), sk: unlockSk(epId) },
      }),
    );
    if (existing.Item) {
      const profile = await loadProfile(userId);
      return {
        success: true,
        unlockedAt: existing.Item.unlockedAt || nowIso,
        costCoins: Number(existing.Item.costCoins ?? 0),
        episode,
        remainingCoins: profile.coins,
      };
    }

    // 3) If cost > 0, deduct coins from profile with a guard
    let remainingCoins: number;
    if (cost > 0) {
      const upd = await ddb
        .send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: profilePk(userId), sk: PROFILE_SK },
            UpdateExpression:
              "SET coins = if_not_exists(coins, :z) - :c, lastEventAt = :now",
            ConditionExpression:
              "if_not_exists(coins, :z) >= :c",
            ExpressionAttributeValues: {
              ":z": 0,
              ":c": cost,
              ":now": nowIso,
            },
            ReturnValues: "ALL_NEW",
          }),
        )
        .catch((err) => {
          if (String(err).includes("ConditionalCheckFailed")) {
            throw new Error("Not enough coins to unlock this episode.");
          }
          throw err;
        });

      remainingCoins = Number(upd.Attributes?.coins ?? 0);
    } else {
      // free unlock
      const profile = await loadProfile(userId);
      remainingCoins = profile.coins;
    }

    // 4) Write unlock record
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: profilePk(userId),
          sk: unlockSk(epId),
          type: "EPISODE_UNLOCK",
          episodeId: epId,
          costCoins: cost,
          unlockedAt: nowIso,
          source: "COIN_UNLOCK",
        },
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );

    return {
      success: true,
      unlockedAt: nowIso,
      costCoins: cost,
      episode,
      remainingCoins,
    };
  }

  // ─────────────────────────────────────────
  // myUnlockedEpisodes: [EpisodeUnlock!]!
  // ─────────────────────────────────────────
  if (fieldName === "myUnlockedEpisodes") {
    if (!identity?.sub) throw new Error("Unauthorized");
    const userId = identity.sub;

    // List unlock rows
    const out = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "pk = :p AND begins_with(sk, :pref)",
        ExpressionAttributeValues: {
          ":p": profilePk(userId),
          ":pref": "EP_UNLOCK#",
        },
      }),
    );

    const unlocks = out.Items || [];
    if (!unlocks.length) return [];

    // Fetch all episodes in parallel
    const episodesMap = new Map<string, any>();
    await Promise.all(
      unlocks.map(async (u) => {
        const epId = String(u.episodeId || String(u.sk).replace("EP_UNLOCK#", ""));
        if (episodesMap.has(epId)) return;
        try {
          const got = await ddb.send(
            new GetCommand({
              TableName: TABLE_NAME,
              Key: { pk: episodePk(epId), sk: EP_SK },
            }),
          );
          if (got.Item) {
            episodesMap.set(epId, mapEpisode(got.Item));
          }
        } catch {
          // ignore missing
        }
      }),
    );

    return unlocks.map((u) => {
      const epId = String(u.episodeId || String(u.sk).replace("EP_UNLOCK#", ""));
      return {
        episodeId: epId,
        unlockedAt: u.unlockedAt || new Date().toISOString(),
        costCoins: Number(u.costCoins ?? 0),
        source: u.source || null,
        episode: episodesMap.get(epId) || null,
      };
    });
  }

  throw new Error(`Unknown field ${fieldName}`);
};


