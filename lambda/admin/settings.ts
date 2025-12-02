// lambda/admin/settings.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { AppSyncIdentityCognito } from "aws-lambda";
import { TABLE_NAME } from "../_shared/env";

const {
  ADMIN_GROUP_NAME = "ADMIN",
  SUPERADMIN_EMAILS = "",
  SKIP_ADMIN_CHECK = "false",
} = process.env;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const SUPERADMINS = SUPERADMIN_EMAILS.split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

type SAIdentity = (AppSyncIdentityCognito & { groups?: string[] | null }) | null | undefined;

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

function isAdmin(identity: SAIdentity): boolean {
  if (SKIP_ADMIN_CHECK === "true") return true;

  const groups = getGroups(identity).map((g) => g.toUpperCase());
  if (groups.includes(ADMIN_GROUP_NAME.toUpperCase())) return true;

  const email =
    (identity as any)?.claims?.email ||
    (identity as any)?.claims?.["custom:email"] ||
    "";
  if (email && SUPERADMINS.includes(String(email).toLowerCase())) return true;

  return false;
}

function requireAdmin(identity: SAIdentity) {
  if (!identity?.sub) throw new Error("Unauthorized");
  if (!isAdmin(identity)) throw new Error("Forbidden");
}

// ─────────────────────────────────────────
// AdminSettings helpers
// ─────────────────────────────────────────

const ADMIN_SETTINGS_PK = "ADMIN#SETTINGS";
const ADMIN_SETTINGS_SK = "CURRENT";

const DEFAULT_ADMIN_SETTINGS = {
  animationsEnabled: true,
  soundsEnabled: true,
  autoBadgeGrant: true,
  badgeRules: [] as any[],
};

async function loadAdminSettings() {
  const r = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: ADMIN_SETTINGS_PK, sk: ADMIN_SETTINGS_SK },
    }),
  );
  const raw = (r.Item || {}) as any;
  return {
    ...DEFAULT_ADMIN_SETTINGS,
    ...raw.settings,
  };
}

async function saveAdminSettings(
  settings: any,
  identity: SAIdentity,
) {
  const nowIso = new Date().toISOString();
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: ADMIN_SETTINGS_PK,
        sk: ADMIN_SETTINGS_SK,
        settings,
        updatedAt: nowIso,
        updatedBy: identity?.sub || "unknown",
        type: "ADMIN_SETTINGS",
      },
    }),
  );
  return settings;
}

// ─────────────────────────────────────────
// GameEconomyConfig helpers
// ─────────────────────────────────────────

const GAME_CFG_PK = "ADMIN#GAME_RULES";
const GAME_CFG_SK = "CURRENT";

const DEFAULT_GAME_CFG = {
  version: 1,
  economy: {
    coinToUsdRatio: 1,
    dailyCoinCap: 10,
    weeklyCoinCap: 60,
    monthlyEventLimit: 2,
  },
  watch: {
    coinPerMinutes: 10, // 1 LC / 10 min
    dailyMax: 4,
  },
  chat: {
    coinPerMinutes: 5, // 1 LC / 5 min
    dailyMax: 5,
    minWords: 5,
    cooldownMinutes: 5,
  },
  trivia: {
    coinPerCorrect: 1,
    challengeBonus: 3,
    dailyMax: 5,
  },
  streaks: {
    day3: 3,
    day7: 10,
    day30: 40,
    minWatchMinutesPerDay: 10,
  },
  social: {
    shareReward: 5,
    clipWeeklyReward: 20,
    bringFriendReward: 15,
  },
  events: {
    doubleCoinEnabled: false,
    bigEventMonthlyLimit: 2,
    surpriseDropMin: 3,
    surpriseDropMax: 5,
  },
  redemption: {
    minEarnedEngagement: 20,
    weeklyRedemptionLimit: 1,
    rewards: [] as any[],
  },
};

async function loadGameEconomyConfig() {
  const r = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: GAME_CFG_PK, sk: GAME_CFG_SK },
    }),
  );
  if (!r.Item) {
    const nowIso = new Date().toISOString();
    return {
      ...DEFAULT_GAME_CFG,
      updatedAt: nowIso,
      updatedBy: null,
    };
  }
  const { config, version, updatedAt, updatedBy } = r.Item as any;
  return {
    ...DEFAULT_GAME_CFG,
    ...config,
    version: version ?? 1,
    updatedAt,
    updatedBy,
  };
}

function deepMerge<T>(base: T, patch: any): T {
  if (!patch || typeof patch !== "object") return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const [k, v] of Object.entries(patch)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      typeof (base as any)[k] === "object" &&
      !Array.isArray((base as any)[k])
    ) {
      out[k] = deepMerge((base as any)[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function saveGameEconomyConfig(
  input: any,
  identity: SAIdentity,
) {
  const current = await loadGameEconomyConfig();
  const merged = {
    ...current,
    ...deepMerge(current, input),
  };
  const nextVersion = (current.version || 1) + 1;
  const nowIso = new Date().toISOString();

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: GAME_CFG_PK,
        sk: GAME_CFG_SK,
        type: "GAME_RULES",
        version: nextVersion,
        updatedAt: nowIso,
        updatedBy: identity?.sub || "unknown",
        config: merged,
      },
    }),
  );

  return {
    ...merged,
    version: nextVersion,
    updatedAt: nowIso,
    updatedBy: identity?.sub || "unknown",
  };
}

// ─────────────────────────────────────────
// AppSync handler
// ─────────────────────────────────────────

type AppSyncEvent = {
  info: { fieldName: string };
  arguments: any;
  identity?: SAIdentity;
};

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;
  const identity = event.identity;

  if (fieldName === "getAdminSettings") {
    requireAdmin(identity);
    const settings = await loadAdminSettings();
    return settings;
  }

  if (fieldName === "updateAdminSettings") {
    requireAdmin(identity);
    const merged = {
      ...DEFAULT_ADMIN_SETTINGS,
      ...(await loadAdminSettings()),
      ...(event.arguments?.input || {}),
    };
    await saveAdminSettings(merged, identity);
    return merged;
  }

  if (fieldName === "getGameEconomyConfig") {
    requireAdmin(identity);
    return loadGameEconomyConfig();
  }

  if (fieldName === "updateGameEconomyConfig") {
    requireAdmin(identity);
    const input = event.arguments?.input || {};
    return saveGameEconomyConfig(input, identity);
  }

  throw new Error(`Unknown field ${fieldName}`);
};
