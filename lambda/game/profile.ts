// lambda/game/profile.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { TABLE_NAME } from "../_shared/env";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const PK = (sub: string) => `USER#${sub}`;
const SK = "PROFILE";

type GameProfile = {
  userId: string;
  level: number;
  xp: number;
  coins: number;
  badges?: string[];
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  lastEventAt?: number | null;
  // streakCount / lastLoginAt exist in schema but are optional and may be absent here
  streakCount?: number | null;
  lastLoginAt?: number | null;
};

async function getMyProfile(sub: string): Promise<GameProfile> {
  const pk = PK(sub);

  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk: SK } })
  );

  // If no item yet, seed it.
  if (!Item) {
    const now = Date.now();
    await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk: SK },
      UpdateExpression:
        "SET #uid=:uid, #lvl=:lvl, #xp=:xp, #coins=:coins, #badges=:badges, #ts=:ts",
      ExpressionAttributeNames: {
        "#uid": "userId",
        "#lvl": "level",
        "#xp": "xp",
        "#coins": "coins",
        "#badges": "badges",
        "#ts": "lastEventAt",
      },
      ExpressionAttributeValues: {
        ":uid": sub,
        ":lvl": 1,
        ":xp": 0,
        ":coins": 0,
        ":badges": [],
        ":ts": now,
      },
    }));
    return {
      userId: sub,
      level: 1,
      xp: 0,
      coins: 0,
      badges: [],
      lastEventAt: now,
    };
  }

  // Self-heal: if userId is missing on an old record, set it now.
  if (!Item.userId) {
    await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk: SK },
      UpdateExpression: "SET #uid = if_not_exists(#uid, :uid)",
      ExpressionAttributeNames: { "#uid": "userId" },
      ExpressionAttributeValues: { ":uid": sub },
    }));
  }

  return {
    // ← never return null: fall back to sub
    userId: (Item.userId as string) ?? sub,
    level: Item.level ?? 1,
    xp: Item.xp ?? 0,
    coins: Item.coins ?? 0,
    badges: Array.isArray(Item.badges) ? Item.badges : [],
    displayName: Item.displayName ?? null,
    avatarUrl: Item.avatarUrl ?? null,
    bio: Item.bio ?? null,
    lastEventAt: Item.lastEventAt ?? null,
    streakCount: Item.streakCount ?? null,
    lastLoginAt: Item.lastLoginAt ?? null,
  };
}

async function setDisplayName(sub: string, displayName: string): Promise<GameProfile> {
  const pk = PK(sub);
  const name = (displayName ?? "").trim().slice(0, 40);
  const now = Date.now();

  await ddb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { pk, sk: SK },
    UpdateExpression:
      "SET #dn=:dn, #ts=:ts ADD #lvl :zero, #xp :zero, #coins :zero",
    ExpressionAttributeNames: {
      "#dn": "displayName",
      "#ts": "lastEventAt",
      "#lvl": "level",
      "#xp": "xp",
      "#coins": "coins",
    },
    ExpressionAttributeValues: {
      ":dn": name,
      ":ts": now,
      ":zero": 0,
    },
  }));

  return getMyProfile(sub);
}

type AppSyncEvent = {
  info: { fieldName: string };
  arguments: any;
  identity?: { sub?: string };
};

export const handler = async (event: AppSyncEvent) => {
  const sub = event.identity?.sub;
  if (!sub) throw new Error("Unauthorized: missing sub");

  switch (event.info.fieldName) {
    case "getMyProfile":
      return getMyProfile(sub);

    case "setDisplayName":
      return setDisplayName(sub, event.arguments.displayName);

    // ─────────────────────────────────────────────────────────
    // NEW: minimal, safe updates for profile patch
    // ─────────────────────────────────────────────────────────
    case "updateProfile": {
      const { displayName, avatarUrl, bio } = event.arguments.input || {};
      const pk = PK(sub);

      const names: Record<string, string> = {};
      const vals: Record<string, any> = {};
      const sets: string[] = [];

      if (typeof displayName === "string") {
        names["#dn"] = "displayName";
        vals[":dn"] = displayName.trim().slice(0, 40);
        sets.push("#dn = :dn");
      }
      if (typeof avatarUrl === "string") {
        names["#av"] = "avatarUrl";
        vals[":av"] = avatarUrl;
        sets.push("#av = :av");
      }
      if (typeof bio === "string") {
        names["#bio"] = "bio";
        vals[":bio"] = bio.trim().slice(0, 280);
        sets.push("#bio = :bio");
      }

      names["#ts"] = "lastEventAt";
      vals[":ts"] = Date.now();
      sets.push("#ts = :ts");

      if (!sets.length) return getMyProfile(sub);

      await ddb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: SK },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: vals,
      }));

      return getMyProfile(sub);
    }

    default:
      throw new Error(`Unknown field ${event.info.fieldName}`);
  }
};
