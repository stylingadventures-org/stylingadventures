// lambda/game/gameplay.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { AppSyncIdentityCognito } from "aws-lambda";
import { TABLE_NAME } from "../_shared/env";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

// AppSync sometimes sends groups: null – accept null|undefined.
type SAIdentity =
  | (AppSyncIdentityCognito & { groups?: string[] | null })
  | null
  | undefined;

type AppSyncEvent = {
  arguments: any;
  info: { fieldName: string };
  identity?: SAIdentity;
};

type UserTier = "FREE" | "BESTIE" | "CREATOR" | "COLLAB" | "ADMIN" | "PRIME";

// ─────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────

function isAdminOrPrime(id: SAIdentity): boolean {
  const groups = (id as any)?.groups;
  if (!Array.isArray(groups)) return false;
  return groups.includes("ADMIN") || groups.includes("PRIME");
}

function assertSelfOrAdmin(targetUserId: string, identity?: SAIdentity) {
  if (!identity?.sub) throw new Error("Unauthenticated");
  if (!isAdminOrPrime(identity) && identity.sub !== targetUserId) {
    throw new Error("Forbidden");
  }
}

// Prefer explicit token tier claim; fall back to groups if needed.
function getUserTier(identity: SAIdentity): UserTier {
  const claims = (identity as any)?.claims || {};

  const claimTier =
    (claims["tier"] as string | undefined) ??
    (claims["custom:tier"] as string | undefined);

  const validTiers: UserTier[] = [
    "FREE",
    "BESTIE",
    "CREATOR",
    "COLLAB",
    "ADMIN",
    "PRIME",
  ];

  if (claimTier && validTiers.includes(claimTier as UserTier)) {
    return claimTier as UserTier;
  }

  // Fallback: infer from Cognito groups
  const rawGroups = claims["cognito:groups"];
  const groups: string[] = Array.isArray(rawGroups)
    ? (rawGroups as string[])
    : String(rawGroups || "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

  if (groups.includes("ADMIN")) return "ADMIN";
  if (groups.includes("PRIME")) return "PRIME";
  if (groups.includes("CREATOR")) return "CREATOR";
  if (groups.includes("COLLAB")) return "COLLAB";
  if (groups.includes("BESTIE")) return "BESTIE";

  return "FREE";
}

// Accept object or JSON string
function coerceMeta(m: unknown): Record<string, any> | null {
  if (m == null) return null;
  if (typeof m === "string") {
    try {
      return JSON.parse(m);
    } catch {
      return { raw: m };
    }
  }
  return typeof m === "object" ? (m as any) : { value: m };
}

function levelFromXp(xp: number): number {
  let lvl = 1,
    need = 100,
    left = xp | 0;
  while (left >= need) {
    left -= need;
    lvl++;
    need += 50;
  }
  return lvl;
}

function pad(n: number, width = 12) {
  const s = Math.max(0, n | 0).toString();
  return s.padStart(width, "0");
}

// ── UTC helpers for streak calculation ─────────────────────────────
function isSameUtcDay(aIso?: string, bIso?: string) {
  if (!aIso || !bIso) return false;
  const a = new Date(aIso);
  const b = new Date(bIso);
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function isYesterdayUtc(aIso: string, bIso: string) {
  const a = new Date(aIso); // last login
  const b = new Date(bIso); // now
  const y = new Date(
    Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate() - 1),
  );
  return (
    a.getUTCFullYear() === y.getUTCFullYear() &&
    a.getUTCMonth() === y.getUTCMonth() &&
    a.getUTCDate() === y.getUTCDate()
  );
}

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;
  const identity = event.identity;

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

    // Determine tier from token claims
    const tier = getUserTier(identity);

    // FREE tier: allow "play", but do NOT persist anything.
    // Fans can tap/try things, but no stored XP/coins/progress.
    if (tier === "FREE") {
      return {
        success: true,
        xp: 0,
        coins: 0,
        newXP: 0,
        newCoins: 0,
        lastEventAt: nowIso,
      };
    }

    // Returned GameEventResult:
    // {
    //   success: Boolean!
    //   xp: Int
    //   coins: Int
    //   newXP: Int
    //   newCoins: Int
    //   lastEventAt: AWSDateTime
    // }

    // ── DAILY_LOGIN with streak logic ───────────────────────────
    if (evType === "DAILY_LOGIN") {
      const got = await ddb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { pk: `USER#${userId}`, sk: "PROFILE" },
          ProjectionExpression:
            "lastLoginAt, streakCount, xp, coins, badges, displayName, lastEventAt",
        }),
      );

      const lastLoginRaw = got.Item?.lastLoginAt as string | number | undefined;
      const lastLoginAt =
        typeof lastLoginRaw === "string"
          ? lastLoginRaw
          : typeof lastLoginRaw === "number"
          ? new Date(lastLoginRaw).toISOString()
          : undefined;

      let streak = Number(got.Item?.streakCount ?? 0);

      // default rewards
      let xpInc = 1;
      let coinInc = 0;

      if (lastLoginAt && isSameUtcDay(lastLoginAt, nowIso)) {
        // already logged in today – no-op rewards
        xpInc = 0;
        coinInc = 0;
      } else if (lastLoginAt && isYesterdayUtc(lastLoginAt, nowIso)) {
        streak += 1;
      } else {
        streak = 1;
      }

      // reward scales mildly with streak
      xpInc = streak > 0 ? 10 + Math.min(5, streak) : 0;
      coinInc = streak > 0 ? 1 : 0;

      const upd = await ddb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { pk: `USER#${userId}`, sk: "PROFILE" },
          UpdateExpression: `
            SET xp = if_not_exists(xp,:z) + :xi,
                coins = if_not_exists(coins,:z) + :ci,
                lastEventAt = :now,
                lastLoginAt = :now,
                streakCount = :st
          `.replace(/\s+/g, " "),
          ExpressionAttributeValues: {
            ":z": 0,
            ":xi": xpInc,
            ":ci": coinInc,
            ":now": nowIso,
            ":st": streak,
          },
          ReturnValues: "ALL_NEW",
        }),
      );
      const xpNow = Number(upd.Attributes?.xp ?? 0);
      const coinsNow = Number(upd.Attributes?.coins ?? 0);
      const lastEventAt =
        (upd.Attributes?.lastEventAt as string | undefined) ?? nowIso;

      // keep leaderboard row updated
      await ddb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            pk: `USER#${userId}`,
            sk: "LEADER",
            gsi1pk: "LEADERBOARD#GLOBAL",
            gsi1sk: `XP#${pad(xpNow)}#${userId}`,
            xp: xpNow,
            coins: coinsNow,
            streakCount: streak,
            updatedAt: nowIso,
            type: "LEADER",
          },
        }),
      );

      return {
        success: true,
        xp: xpNow,
        coins: coinsNow,
        newXP: xpInc,
        newCoins: coinInc,
        lastEventAt,
      };
    }

    // ── other event types ─────────────────────────────
    const xpInc =
      evType === "LEVEL_CLEAR"
        ? 50
        : evType === "SHARE"
        ? 5
        : evType === "STYLE_IT"
        ? Math.max(1, Math.round((metadata?.score ?? 5) / 5))
        : 1;

    const coinInc = evType === "LEVEL_CLEAR" ? 5 : 0;

    const upd = await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: `USER#${userId}`, sk: "PROFILE" },
        UpdateExpression: `
          SET xp = if_not_exists(xp,:z) + :xi,
              coins = if_not_exists(coins,:z) + :ci,
              lastEventAt = :now
        `.replace(/\s+/g, " "),
        ExpressionAttributeValues: {
          ":z": 0,
          ":xi": xpInc,
          ":ci": coinInc,
          ":now": nowIso,
        },
        ReturnValues: "ALL_NEW",
      }),
    );
    const xpNow = Number(upd.Attributes?.xp ?? 0);
    const coinsNow = Number(upd.Attributes?.coins ?? 0);
    const lastEventAt =
      (upd.Attributes?.lastEventAt as string | undefined) ?? nowIso;

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: `USER#${userId}`,
          sk: "LEADER",
          gsi1pk: "LEADERBOARD#GLOBAL",
          gsi1sk: `XP#${pad(xpNow)}#${userId}`,
          xp: xpNow,
          coins: coinsNow,
          updatedAt: nowIso,
          type: "LEADER",
        },
      }),
    );

    // best-effort log of the event; ignore conflicts
    await ddb
      .send(
        new PutCommand({
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
        }),
      )
      .catch(() => {});

    return {
      success: true,
      xp: xpNow,
      coins: coinsNow,
      newXP: xpInc,
      newCoins: coinInc,
      lastEventAt,
    };
  }

  // awardCoins(input: { userId, coins, xp? })
  if (fieldName === "awardCoins") {
    const { userId, coins, xp } = event.arguments
      .input as { userId: string; coins: number; xp?: number };

    // Only self or ADMIN/PRIME, but schema already restricts to ADMIN/PRIME.
    assertSelfOrAdmin(userId, identity);

    const incCoins = Math.max(0, coins | 0);
    const incXp = Math.max(0, (xp ?? 0) | 0);

    const upd = await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: `USER#${userId}`, sk: "PROFILE" },
        UpdateExpression:
          "SET coins = if_not_exists(coins,:z) + :c, xp = if_not_exists(xp,:z) + :x",
        ExpressionAttributeValues: {
          ":z": 0,
          ":c": incCoins,
          ":x": incXp,
        },
        ReturnValues: "ALL_NEW",
      }),
    );
    const xpNow = Number(upd.Attributes?.xp ?? 0);
    const coinsNow = Number(upd.Attributes?.coins ?? 0);
    const lastEventAt =
      (upd.Attributes?.lastEventAt as string | undefined) ?? null;

    // keep leaderboard row in sync
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: `USER#${userId}`,
          sk: "LEADER",
          gsi1pk: "LEADERBOARD#GLOBAL",
          gsi1sk: `XP#${pad(xpNow)}#${userId}`,
          xp: xpNow,
          coins: coinsNow,
          updatedAt: new Date().toISOString(),
          type: "LEADER",
        },
      }),
    );

    // awardCoins returns GameProfile
    return {
      userId,
      displayName: (upd.Attributes?.displayName as string) || null,
      level: levelFromXp(xpNow),
      xp: xpNow,
      coins: coinsNow,
      badges: Array.isArray(upd.Attributes?.badges)
        ? (upd.Attributes!.badges as string[])
        : [],
      lastEventAt,
    };
  }

  throw new Error(`Unknown field ${fieldName}`);
};

