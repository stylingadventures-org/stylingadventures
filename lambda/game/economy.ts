// lambda/game/economy.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { AppSyncIdentityCognito } from "aws-lambda";

const {
  TABLE_NAME = "",
  ADMIN_GROUP_NAME: ADMIN_GROUP_NAME_RAW = "ADMIN",
} = process.env;

if (!TABLE_NAME) {
  throw new Error("Missing env TABLE_NAME");
}

const ADMIN_GROUP_NAME = ADMIN_GROUP_NAME_RAW.toLowerCase();

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

// ---------------------------------------------------------------------------
// Types – kept slightly loose so schema can evolve
// ---------------------------------------------------------------------------

export type GameEconomyRuleCategory =
  | "WATCH_TIME"
  | "CHAT"
  | "TRIVIA"
  | "STREAK"
  | "SOCIAL"
  | "EVENT"
  | "REDEMPTION"
  | "OTHER";

export interface GameEconomyRule {
  id: string;
  /** e.g. WATCH_TIME / CHAT / STREAK / REDEMPTION */
  category: GameEconomyRuleCategory | string;
  /** Short label: "Watch 10 minutes" */
  label: string;
  /** Human readable conditions */
  description?: string;
  /** Coin reward (positive) or cost (negative for redemptions) */
  coins: number;
  /**
   * Optional small machine-readable hint the UI can use,
   * e.g. "PER_10_MIN", "PER_5_MIN", "PER_DAY", etc.
   */
  per?: string | null;
  /** Optional max times this rule can apply per day */
  maxPerDay?: number | null;
  /** Freeform JSON for advanced conditions */
  meta?: Record<string, any> | null;
}

export interface GameEconomyConfig {
  id: string; // always "GAME_ECONOMY"
  version: number;
  updatedAt: string; // ISO
  updatedBy?: string | null;

  // Top-level economy knobs
  coinToUsdRatio: number; // 1 coin = X dollars
  dailyCoinCap: number;
  weeklyCoinCap: number;
  monthlyBonusEventsLimit: number;

  // Master rules list – everything from your sheet lives here
  rules: GameEconomyRule[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PK = "GAME#ECONOMY";
const SK = "CONFIG";

function getGroups(id: AppSyncIdentityCognito | undefined): string[] {
  if (!id) return [];
  const claims: any = (id as any).claims || {};
  const raw =
    claims["cognito:groups"] ||
    claims["custom:groups"] ||
    (id as any).groups ||
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

function isAdmin(id: AppSyncIdentityCognito | undefined): boolean {
  const groups = getGroups(id).map((g) => g.toLowerCase());
  return groups.includes(ADMIN_GROUP_NAME);
}

function shapeFromItem(item: any | undefined): GameEconomyConfig | null {
  if (!item) return null;
  return {
    id: "GAME_ECONOMY",
    version: Number(item.version ?? 1),
    updatedAt: String(item.updatedAt ?? new Date(0).toISOString()),
    updatedBy: item.updatedBy ?? null,
    coinToUsdRatio: Number(item.coinToUsdRatio ?? 1),
    dailyCoinCap: Number(item.dailyCoinCap ?? 10),
    weeklyCoinCap: Number(item.weeklyCoinCap ?? 60),
    monthlyBonusEventsLimit: Number(item.monthlyBonusEventsLimit ?? 2),
    rules: Array.isArray(item.rules) ? (item.rules as GameEconomyRule[]) : [],
  };
}

// ---------------------------------------------------------------------------
// Default config seeded on first read – mirrors your conditions sheet
// ---------------------------------------------------------------------------

const DEFAULT_RULES: GameEconomyRule[] = [
  // WATCH TIME
  {
    id: "watch-10min",
    category: "WATCH_TIME",
    label: "Watch stream – 10 minutes",
    description: "Earn coins for every 10 minutes of active watch time.",
    coins: 1,
    per: "PER_10_MIN",
    maxPerDay: 4,
    meta: { minMinutes: 10, maxCoinsPerDay: 4 },
  },

  // CHAT
  {
    id: "chat-5min",
    category: "CHAT",
    label: "Meaningful chat message",
    description:
      "1 coin every 5 minutes of meaningful chat (5+ words, no spam).",
    coins: 1,
    per: "PER_5_MIN",
    maxPerDay: 5,
    meta: {
      cooldownMinutes: 5,
      minWords: 5,
      maxCoinsPerDay: 5,
    },
  },

  // TRIVIA & GAMES
  {
    id: "trivia-correct",
    category: "TRIVIA",
    label: "Correct trivia answer",
    description: "Earn 1 coin for each correct trivia answer.",
    coins: 1,
    per: "PER_CORRECT_ANSWER",
    maxPerDay: 5,
    meta: { maxCoinsPerDay: 5 },
  },
  {
    id: "trivia-challenge-complete",
    category: "TRIVIA",
    label: "Trivia challenge complete",
    description: "Bonus for getting at least 3 of 5 answers correct.",
    coins: 3,
    per: "PER_CHALLENGE",
    maxPerDay: 1,
    meta: { minCorrect: 3, totalQuestions: 5 },
  },

  // STREAKS
  {
    id: "streak-3",
    category: "STREAK",
    label: "3-day watch streak",
    description: "Watch at least 10 minutes for 3 days in a row.",
    coins: 3,
    per: "ONCE_PER_STREAK",
    maxPerDay: 1,
    meta: { streakLength: 3, minMinutesPerDay: 10 },
  },
  {
    id: "streak-7",
    category: "STREAK",
    label: "7-day watch streak",
    description: "Bonus for a full week streak.",
    coins: 10,
    per: "ONCE_PER_STREAK",
    maxPerDay: 1,
    meta: { streakLength: 7, minMinutesPerDay: 10 },
  },
  {
    id: "streak-30",
    category: "STREAK",
    label: "30-day elite streak",
    description: "Big bonus for 30 days of consistent viewing.",
    coins: 40,
    per: "ONCE_PER_STREAK",
    maxPerDay: 1,
    meta: { streakLength: 30, minMinutesPerDay: 10 },
  },

  // SOCIAL / SHARE
  {
    id: "share-show",
    category: "SOCIAL",
    label: "Share the show",
    description: "Share the show and tag the creator.",
    coins: 5,
    per: "PER_SHARE",
    maxPerDay: 1,
    meta: { requiresTag: true },
  },
  {
    id: "post-clip",
    category: "SOCIAL",
    label: "Duet / stitch / post clip",
    description: "Earn coins once per week for posting a clip.",
    coins: 20,
    per: "PER_WEEK",
    maxPerDay: 1,
    meta: { maxPerWeek: 1 },
  },
  {
    id: "bring-friend",
    category: "SOCIAL",
    label: "Bring a friend",
    description:
      "Friend must watch at least 5 minutes for you to earn this reward.",
    coins: 15,
    per: "PER_FRIEND",
    maxPerDay: 1,
    meta: { friendMinMinutes: 5 },
  },

  // EVENTS
  {
    id: "double-coin-day",
    category: "EVENT",
    label: "Double Coin Day",
    description: "All other rewards are doubled while active.",
    coins: 0,
    per: "MULTIPLIER",
    meta: { multiplier: 2 },
  },
  {
    id: "surprise-drop",
    category: "EVENT",
    label: "Surprise drop",
    description: "Random bonus during a stream.",
    coins: 5,
    per: "AD_HOC",
    maxPerDay: 1,
    meta: { minCoins: 3, maxCoins: 5 },
  },
  {
    id: "big-event-bonus",
    category: "EVENT",
    label: "Big event bonus",
    description: "Large bonus for special event streams.",
    coins: 20,
    per: "PER_EVENT",
    maxPerDay: 1,
    meta: { maxPerMonth: 2 },
  },

  // REDEMPTION – EXAMPLES
  {
    id: "redeem-coffee-raffle",
    category: "REDEMPTION",
    label: "Coffee raffle entry",
    description: "Bestie Coffee: You + Me – 1 entry.",
    coins: -50,
    per: "PER_ENTRY",
    meta: {
      weeklyLimit: 1,
      mustFollow: true,
    },
  },
  {
    id: "redeem-bts-video",
    category: "REDEMPTION",
    label: "Behind-the-scenes video",
    description: "Unlock an exclusive BTS video.",
    coins: -100,
    per: "PER_REWARD",
    meta: {
      minEarnedCoins: 30,
    },
  },
  {
    id: "redeem-merch-discount",
    category: "REDEMPTION",
    label: "Merch discount",
    description: "Use coins for a merch discount.",
    coins: -200,
    per: "PER_REWARD",
    meta: {
      monthlyLimit: 1,
    },
  },
  {
    id: "redeem-audio-note",
    category: "REDEMPTION",
    label: "Personalized audio note",
    description: "Short personalized audio note reward.",
    coins: -150,
    per: "PER_REWARD",
    meta: {
      requiresStreakDays: 7,
    },
  },
  {
    id: "redeem-lasland-box",
    category: "REDEMPTION",
    label: "La’s Land Box",
    description: "High-value physical box reward.",
    coins: -400,
    per: "PER_REWARD",
    meta: {
      minStreakDays: 30,
      minStreamsWatched: 10,
    },
  },
  {
    id: "redeem-virtual-hangout",
    category: "REDEMPTION",
    label: "Virtual hangout",
    description: "Group or 1:1 virtual hangout.",
    coins: -500,
    per: "PER_REWARD",
    meta: {
      monthlyLimit: 1,
    },
  },
  {
    id: "redeem-250-raffle",
    category: "REDEMPTION",
    label: "$250 prize raffle entry",
    description: "Entry into a $250 prize raffle.",
    coins: -250,
    per: "PER_ENTRY",
    meta: {
      monthlyLimit: 1,
    },
  },
];

const DEFAULT_CONFIG: GameEconomyConfig = {
  id: "GAME_ECONOMY",
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
  coinToUsdRatio: 1, // 1 LC = $1 (can be virtual only, still useful for “value”)
  dailyCoinCap: 10,
  weeklyCoinCap: 60,
  monthlyBonusEventsLimit: 2,
  rules: DEFAULT_RULES,
};

// ---------------------------------------------------------------------------
// AppSync handler
// ---------------------------------------------------------------------------

type AppSyncEvent = {
  info: { fieldName: string };
  arguments: {
    input?: Partial<GameEconomyConfig> & { rules?: GameEconomyRule[] };
  };
  identity?: AppSyncIdentityCognito;
};

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;

  if (fieldName === "getGameEconomyConfig") {
    // Anyone signed in can read (no admin requirement)
    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: PK, sk: SK },
      }),
    );

    if (!existing.Item) {
      // Seed default config on first access
      await ddb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            pk: PK,
            sk: SK,
            type: "GAME_ECONOMY",
            ...DEFAULT_CONFIG,
          },
          ConditionExpression: "attribute_not_exists(pk)",
        }),
      ).catch(() => {
        // If another request seeded concurrently, ignore
      });

      return DEFAULT_CONFIG;
    }

    return shapeFromItem(existing.Item);
  }

  if (fieldName === "updateGameEconomyConfig") {
    const id = event.identity;
    if (!id?.sub) throw new Error("Unauthorized");
    if (!isAdmin(id)) throw new Error("Forbidden");

    const input = event.arguments.input || {};
    const nowIso = new Date().toISOString();
    const updatedBy = id.username || id.sub || "admin";

    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: PK, sk: SK },
      }),
    );

    const prev = shapeFromItem(existing.Item) ?? DEFAULT_CONFIG;
    const nextVersion = (prev.version || 1) + 1;

    // Merge: top-level knobs + full rules array if provided
    const merged: GameEconomyConfig = {
      id: "GAME_ECONOMY",
      version: nextVersion,
      updatedAt: nowIso,
      updatedBy,
      coinToUsdRatio:
        typeof input.coinToUsdRatio === "number"
          ? input.coinToUsdRatio
          : prev.coinToUsdRatio,
      dailyCoinCap:
        typeof input.dailyCoinCap === "number"
          ? input.dailyCoinCap
          : prev.dailyCoinCap,
      weeklyCoinCap:
        typeof input.weeklyCoinCap === "number"
          ? input.weeklyCoinCap
          : prev.weeklyCoinCap,
      monthlyBonusEventsLimit:
        typeof input.monthlyBonusEventsLimit === "number"
          ? input.monthlyBonusEventsLimit
          : prev.monthlyBonusEventsLimit,
      rules: Array.isArray(input.rules) ? input.rules : prev.rules,
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: PK,
          sk: SK,
          type: "GAME_ECONOMY",
          ...merged,
        },
      }),
    );

    return merged;
  }

  throw new Error(`Unknown field ${fieldName}`);
};
