// lambda/game/gameplay.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  PutCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { AppSyncIdentityCognito } from "aws-lambda";
import { TABLE_NAME } from "../_shared/env";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

// AppSync sometimes sends groups: null – accept null|undefined.
type SAIdentity = (AppSyncIdentityCognito & { groups?: string[] | null }) | null | undefined;

type AppSyncEvent = {
  arguments: any;
  info: { fieldName: string };
  identity?: SAIdentity;
};

function isAdmin(id: SAIdentity): boolean {
  const g = (id as any)?.groups;
  return Array.isArray(g) && g.includes("ADMIN");
}
function assertSelfOrAdmin(targetUserId: string, identity?: SAIdentity) {
  if (!identity?.sub) throw new Error("Unauthenticated");
  if (!isAdmin(identity) && identity.sub !== targetUserId) throw new Error("Forbidden");
}

// Accept object or JSON string
function coerceMeta(m: unknown): Record<string, any> | null {
  if (m == null) return null;
  if (typeof m === "string") {
    try { return JSON.parse(m); } catch { return { raw: m }; }
  }
  return typeof m === "object" ? (m as any) : { value: m };
}
function levelFromXp(xp: number): number {
  let lvl = 1, need = 100, left = xp;
  while (left >= need) { left -= need; lvl++; need += 50; }
  return lvl;
}
function pad(n: number, width = 12) {
  const s = Math.max(0, n | 0).toString();
  return s.padStart(width, "0");
}

// ── NEW: UTC helpers for streak calculation ─────────────────────────────
function isSameUtcDay(aIso?: string, bIso?: string) {
  if (!aIso || !bIso) return false;
  const a = new Date(aIso); const b = new Date(bIso);
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}
function isYesterdayUtc(aIso: string, bIso: string) {
  const a = new Date(aIso); // last
  const b = new Date(bIso); // now
  const y = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate() - 1));
  return a.getUTCFullYear() === y.getUTCFullYear()
    && a.getUTCMonth() === y.getUTCMonth()
    && a.getUTCDate() === y.getUTCDate();
}

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;
  const identity = event.identity;

  // ─────────────────────────────────────────────
  // PROFILE: read + set display name
  // ─────────────────────────────────────────────
  if (fieldName === "getMyProfile") {
    if (!identity?.sub) throw new Error("Unauthenticated");
    const userId = identity.sub;

    const got = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: `USER#${userId}`, sk: "PROFILE" },
    }));
    const xp = Number(got.Item?.xp ?? 0);
    return {
      userId,
      displayName: (got.Item?.displayName as string) || null,
      level: levelFromXp(xp),
      xp,
      coins: Number(got.Item?.coins ?? 0),
      badges: Array.isArray(got.Item?.badges) ? (got.Item!.badges as string[]) : [],
      lastEventAt: got.Item?.lastEventAt ?? null,
    };
  }

  if (fieldName === "setDisplayName") {
    if (!identity?.sub) throw new Error("Unauthenticated");
    const userId = identity.sub;
    const raw = (event.arguments?.displayName as string) || "";
    const name = raw.trim().slice(0, 40);

    const upd = await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: `USER#${userId}`, sk: "PROFILE" },
      UpdateExpression:
        "SET displayName = :n, updatedAt = :u, xp = if_not_exists(xp,:z), coins = if_not_exists(coins,:z)",
      ExpressionAttributeValues: {
        ":n": name,
        ":u": new Date().toISOString(),
        ":z": 0,
      },
      ReturnValues: "ALL_NEW",
    }));
    const xp = Number(upd.Attributes?.xp ?? 0);
    return {
      userId,
      displayName: (upd.Attributes?.displayName as string) || null,
      level: levelFromXp(xp),
      xp,
      coins: Number(upd.Attributes?.coins ?? 0),
      badges: Array.isArray(upd.Attributes?.badges) ? (upd.Attributes!.badges as string[]) : [],
      lastEventAt: upd.Attributes?.lastEventAt ?? null,
    };
  }

  // ─────────────────────────────────────────────
  // GAMEPLAY: log event / award
  // ─────────────────────────────────────────────
  if (fieldName === "logGameEvent") {
    if (!identity?.sub) throw new Error("Unauthenticated");
    const userId = identity.sub;
    const nowIso = new Date().toISOString();

    const input = event.arguments?.input ?? {};
    const evType: string = input.type || "UNKNOWN";
    const metadata = coerceMeta(input.metadata);

    // ── DAILY_LOGIN with streak logic ───────────────────────────
    if (evType === "DAILY_LOGIN") {
      // read lastLoginAt + streak
      const got = await ddb.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: `USER#${userId}`, sk: "PROFILE" },
        ProjectionExpression: "lastLoginAt, streakCount, xp, coins, badges, displayName, lastEventAt",
      }));

      const lastLoginAt = got.Item?.lastLoginAt as string | undefined;
      let streak = Number(got.Item?.streakCount ?? 0);

      // default rewards
      let xpInc = 1, coinInc = 0;

      if (lastLoginAt && isSameUtcDay(lastLoginAt, nowIso)) {
        // already logged in today – no-op rewards
        xpInc = 0; coinInc = 0;
      } else if (lastLoginAt && isYesterdayUtc(lastLoginAt, nowIso)) {
        streak += 1;
      } else {
        streak = 1;
      }

      // reward scales mildly with streak
      xpInc = streak > 0 ? 10 + Math.min(5, streak) : 0;
      coinInc = streak > 0 ? 1 : 0;

      const upd = await ddb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: `USER#${userId}`, sk: "PROFILE" },
        UpdateExpression: `
          SET xp = if_not_exists(xp,:z) + :xi,
              coins = if_not_exists(coins,:z) + :ci,
              lastEventAt = :now,
              lastLoginAt = :now,
              streakCount = :st
        `.replace(/\s+/g," "),
        ExpressionAttributeValues: { ":z": 0, ":xi": xpInc, ":ci": coinInc, ":now": nowIso, ":st": streak },
        ReturnValues: "ALL_NEW",
      }));
      const xpNow = Number(upd.Attributes?.xp ?? 0);

      // keep leaderboard row updated
      await ddb.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: `USER#${userId}`,
          sk: "LEADER",
          gsi1pk: "LEADERBOARD#GLOBAL",
          gsi1sk: `XP#${pad(xpNow)}#${userId}`,
          xp: xpNow,
          coins: Number(upd.Attributes?.coins ?? 0),
          streakCount: streak,
          updatedAt: nowIso,
          type: "LEADER",
        },
      }));

      return {
        userId,
        displayName: (upd.Attributes?.displayName as string) || null,
        level: levelFromXp(xpNow),
        xp: xpNow,
        coins: Number(upd.Attributes?.coins ?? 0),
        badges: Array.isArray(upd.Attributes?.badges) ? upd.Attributes!.badges as string[] : [],
        lastEventAt: upd.Attributes?.lastEventAt ?? nowIso,
        lastLoginAt: nowIso,
        streakCount: streak,
      };
    }

    // ── keep existing logic for other event types ───────────────
    const xpInc =
      evType === "LEVEL_CLEAR" ? 50 :
      evType === "SHARE"       ? 5  :
      evType === "STYLE_IT"    ? Math.max(1, Math.round((metadata?.score ?? 5) / 5)) :
      1;

    const coinInc =
      evType === "LEVEL_CLEAR" ? 5 :
      0;

    const upd = await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: `USER#${userId}`, sk: "PROFILE" },
      UpdateExpression: `
        SET xp = if_not_exists(xp,:z) + :xi,
            coins = if_not_exists(coins,:z) + :ci,
            lastEventAt = :now
      `.replace(/\s+/g, " "),
      ExpressionAttributeValues: { ":z": 0, ":xi": xpInc, ":ci": coinInc, ":now": nowIso },
      ReturnValues: "ALL_NEW",
    }));
    const xpNow = Number(upd.Attributes?.xp ?? 0);

    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: "LEADER",
        gsi1pk: "LEADERBOARD#GLOBAL",
        gsi1sk: `XP#${pad(xpNow)}#${userId}`,
        xp: xpNow,
        coins: Number(upd.Attributes?.coins ?? 0),
        updatedAt: nowIso,
        type: "LEADER",
      },
    }));

    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `EVENT#${Date.now()}`,
        type: "EVENT",
        evType,
        metadata,
        at: nowIso,
      },
      ConditionExpression: "attribute_not_exists(pk)",
    })).catch(() => {});

    return {
      userId,
      displayName: (upd.Attributes?.displayName as string) || null,
      level: levelFromXp(xpNow),
      xp: xpNow,
      coins: Number(upd.Attributes?.coins ?? 0),
      badges: Array.isArray(upd.Attributes?.badges) ? (upd.Attributes!.badges as string[]) : [],
      lastEventAt: upd.Attributes?.lastEventAt ?? nowIso,
    };
  }

  if (fieldName === "awardCoins") {
    const { userId, coins, xp } = event.arguments.input as { userId: string; coins: number; xp?: number };
    assertSelfOrAdmin(userId, identity);

    const incCoins = Math.max(0, coins | 0);
    const incXp = Math.max(0, (xp ?? 0) | 0);

    const upd = await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: `USER#${userId}`, sk: "PROFILE" },
      UpdateExpression: "SET coins = if_not_exists(coins,:z) + :c, xp = if_not_exists(xp,:z) + :x",
      ExpressionAttributeValues: { ":z": 0, ":c": incCoins, ":x": incXp },
      ReturnValues: "ALL_NEW",
    }));
    const xpNow = Number(upd.Attributes?.xp ?? 0);

    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: "LEADER",
        gsi1pk: "LEADERBOARD#GLOBAL",
        gsi1sk: `XP#${pad(xpNow)}#${userId}`,
        xp: xpNow,
        coins: Number(upd.Attributes?.coins ?? 0),
        updatedAt: new Date().toISOString(),
        type: "LEADER",
      },
    }));

    return {
      userId,
      displayName: (upd.Attributes?.displayName as string) || null,
      level: levelFromXp(xpNow),
      xp: xpNow,
      coins: Number(upd.Attributes?.coins ?? 0),
      badges: Array.isArray(upd.Attributes?.badges) ? (upd.Attributes!.badges as string[]) : [],
      lastEventAt: upd.Attributes?.lastEventAt ?? null,
    };
  }

  // ─────────────────────────────────────────────
  // LEADERBOARD: simple global XP
  // ─────────────────────────────────────────────
  if (fieldName === "topXP") {
    const limit = Math.max(1, Math.min(100, Number(event.arguments?.limit ?? 10)));
    const out = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :p",
      ExpressionAttributeValues: { ":p": "LEADERBOARD#GLOBAL" },
      ScanIndexForward: false, // highest XP first
      Limit: limit,
    }));
    const items = out.Items ?? [];
    // Enrich with displayName from profile (best-effort)
    const results = await Promise.all(items.map(async (it, i) => {
      const userId = (it.pk as string).replace("USER#", "");
      let displayName: string | undefined;
      try {
        const got = await ddb.send(new GetCommand({
          TableName: TABLE_NAME,
          Key: { pk: `USER#${userId}`, sk: "PROFILE" },
          ProjectionExpression: "displayName",
        }));
        displayName = got.Item?.displayName as string | undefined;
      } catch {}
      return {
        userId,
        displayName,
        xp: Number(it.xp ?? 0),
        coins: Number(it.coins ?? 0),
        rank: i + 1,
      };
    }));
    return results;
  }

  throw new Error(`Unknown field ${fieldName}`);
};
