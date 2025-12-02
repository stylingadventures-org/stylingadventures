// lambda/game/profile.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { TABLE_NAME } from "../_shared/env";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

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
  lastEventAt?: string | null; // AWSDateTime
  streakCount?: number | null;
  lastLoginAt?: string | null; // AWSDateTime
};

// Same level curve as gameplay (XP-based)
function levelFromXp(xp: number): number {
  let lvl = 1;
  let need = 100;
  let left = xp | 0;
  while (left >= need) {
    left -= need;
    lvl++;
    need += 50;
  }
  return lvl;
}

async function getMyProfile(sub: string): Promise<GameProfile> {
  const pk = PK(sub);

  const { Item } = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk: SK } }),
  );

  // If no item yet, seed a minimal profile.
  if (!Item) {
    const nowIso = new Date().toISOString();

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: SK },
        UpdateExpression:
          "SET #uid=:uid, #xp=:xp, #coins=:coins, #badges=:badges, #ts=:ts",
        ExpressionAttributeNames: {
          "#uid": "userId",
          "#xp": "xp",
          "#coins": "coins",
          "#badges": "badges",
          "#ts": "lastEventAt",
        },
        ExpressionAttributeValues: {
          ":uid": sub,
          ":xp": 0,
          ":coins": 0,
          ":badges": [],
          ":ts": nowIso,
        },
      }),
    );

    const xp = 0;
    return {
      userId: sub,
      level: levelFromXp(xp),
      xp,
      coins: 0,
      badges: [],
      lastEventAt: nowIso,
      streakCount: null,
      lastLoginAt: null,
      displayName: null,
      avatarUrl: null,
      bio: null,
    };
  }

  // Self-heal: ensure userId is present
  if (!Item.userId) {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: SK },
        UpdateExpression: "SET #uid = if_not_exists(#uid, :uid)",
        ExpressionAttributeNames: { "#uid": "userId" },
        ExpressionAttributeValues: { ":uid": sub },
      }),
    );
  }

  // Self-heal: convert numeric timestamps → ISO strings for lastEventAt
  let lastEventIso: string | null = null;
  const rawLastEvent = (Item as any).lastEventAt;
  if (typeof rawLastEvent === "number") {
    lastEventIso = new Date(rawLastEvent).toISOString();
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: SK },
        UpdateExpression: "SET #ts = :ts",
        ExpressionAttributeNames: { "#ts": "lastEventAt" },
        ExpressionAttributeValues: { ":ts": lastEventIso },
      }),
    );
  } else if (typeof rawLastEvent === "string") {
    lastEventIso = rawLastEvent;
  } else {
    lastEventIso = null;
  }

  // Self-heal: convert numeric timestamps → ISO strings for lastLoginAt
  let lastLoginIso: string | null = null;
  const rawLastLogin = (Item as any).lastLoginAt;
  if (typeof rawLastLogin === "number") {
    lastLoginIso = new Date(rawLastLogin).toISOString();
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: SK },
        UpdateExpression: "SET #ll = :ll",
        ExpressionAttributeNames: { "#ll": "lastLoginAt" },
        ExpressionAttributeValues: { ":ll": lastLoginIso },
      }),
    );
  } else if (typeof rawLastLogin === "string") {
    lastLoginIso = rawLastLogin;
  } else {
    lastLoginIso = null;
  }

  const xp = (Item.xp as number) ?? 0;
  const coins = (Item.coins as number) ?? 0;

  return {
    userId: (Item.userId as string) ?? sub,
    level: levelFromXp(xp), // 🔥 always derived from XP
    xp,
    coins,
    badges: Array.isArray(Item.badges) ? (Item.badges as string[]) : [],
    displayName: (Item.displayName as string) ?? null,
    avatarUrl: (Item.avatarUrl as string) ?? null,
    bio: (Item.bio as string) ?? null,
    lastEventAt: lastEventIso,
    streakCount:
      typeof Item.streakCount === "number"
        ? (Item.streakCount as number)
        : null,
    lastLoginAt: lastLoginIso,
  };
}

async function setDisplayName(
  sub: string,
  displayName: string,
): Promise<GameProfile> {
  const pk = PK(sub);
  const name = (displayName ?? "").trim().slice(0, 40);
  const nowIso = new Date().toISOString();

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk: SK },
      UpdateExpression:
        "SET #dn=:dn, #ts=:ts ADD #xp :zero, #coins :zero",
      ExpressionAttributeNames: {
        "#dn": "displayName",
        "#ts": "lastEventAt",
        "#xp": "xp",
        "#coins": "coins",
      },
      ExpressionAttributeValues: {
        ":dn": name,
        ":ts": nowIso,
        ":zero": 0,
      },
    }),
  );

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
      // 🔁 matches schema: setDisplayName(displayName: String!)
      return setDisplayName(sub, event.arguments.displayName);

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

      // Always bump lastEventAt
      names["#ts"] = "lastEventAt";
      vals[":ts"] = new Date().toISOString();
      sets.push("#ts = :ts");

      if (!sets.length) return getMyProfile(sub);

      await ddb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { pk, sk: SK },
          UpdateExpression: `SET ${sets.join(", ")}`,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: vals,
        }),
      );

      return getMyProfile(sub);
    }

    default:
      throw new Error(`Unknown field ${event.info.fieldName}`);
  }
};
