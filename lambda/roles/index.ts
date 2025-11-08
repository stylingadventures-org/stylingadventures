// lambda/roles/index.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  AppSyncResolverEvent,
  AppSyncIdentityCognito,
} from "aws-lambda";

const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = (process.env.PK_NAME || "").trim();  // e.g. "pk" for single-table; blank for id-table
const SK_NAME = (process.env.SK_NAME || "").trim();  // e.g. "sk" for single-table
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

type Role = "FAN" | "BESTIE" | "CREATOR" | "COLLAB" | "ADMIN";
type Tier = "FREE" | "PRIME";

interface User {
  id: string;
  email?: string | null;
  role: Role;
  tier?: Tier | null;
  createdAt: string;
  updatedAt: string;
}

const nowIso = () => new Date().toISOString();

/** Build the key for Get/Put depending on table shape */
function keyFor(sub: string) {
  if (PK_NAME && SK_NAME) {
    // single-table (pk/sk)
    return {
      [PK_NAME]: `USER#${sub}`,
      [SK_NAME]: "PROFILE",
    } as Record<string, any>;
  }
  // id-only table
  return { id: sub } as Record<string, any>;
}

/** Normalize a DDB item → User */
function toUser(item: any, sub: string, email?: string | null): User {
  // Pull fields regardless of storage style
  const base = {
    id: sub,
    email: (item?.email ?? email ?? null) || null,
    role: (item?.role as Role) || "FAN",
    tier: (item?.tier as Tier) || "FREE",
    createdAt: item?.createdAt || nowIso(),
    updatedAt: item?.updatedAt || nowIso(),
  };
  return base;
}

/** For single-table, we store the user under pk=USER#sub, sk=PROFILE */
function toPutItem(u: User, sub: string) {
  if (PK_NAME && SK_NAME) {
    return {
      [PK_NAME]: `USER#${sub}`,
      [SK_NAME]: "PROFILE",
      id: sub,
      email: u.email ?? null,
      role: u.role,
      tier: u.tier ?? null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }
  // id-only
  return {
    id: sub,
    email: u.email ?? null,
    role: u.role,
    tier: u.tier ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export const handler = async (event: AppSyncResolverEvent<any>) => {
  const field = event.info.fieldName;

  const ident = event.identity as AppSyncIdentityCognito | undefined;
  const sub = ident?.sub;
  const email = (ident as any)?.claims?.email as string | undefined;
  const groups = (ident as any)?.claims?.["cognito:groups"];
  const isAdmin = Array.isArray(groups)
    ? groups.includes("ADMIN")
    : `${groups || ""}`.includes("ADMIN");

  /* ============================= me ============================= */
  if (field === "me") {
    if (!sub) throw new Error("Unauthenticated");

    // Try current storage (pk/sk or id)
    const got = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: keyFor(sub),
      })
    );

    if (got.Item) {
      return toUser(got.Item, sub, email ?? null);
    }

    // Not found → create a default record (idempotent)
    const now = nowIso();
    const user: User = {
      id: sub,
      email: (email ?? null)?.toLowerCase?.() ?? null,
      role: "FAN",
      tier: "FREE",
      createdAt: now,
      updatedAt: now,
    };

    const put = toPutItem(user, sub);
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: put,
        ConditionExpression: "attribute_not_exists(#k)",
        ExpressionAttributeNames: {
          "#k": PK_NAME ? PK_NAME : "id",
        },
      })
    ).catch(async () => {
      // Race: someone created it; read it back
      const again = await ddb.send(
        new GetCommand({ TableName: TABLE_NAME, Key: keyFor(sub) })
      );
      if (again.Item) return toUser(again.Item, sub, email ?? null);
    });

    return user;
  }

  /* ========================= setUserRole ======================== */
  if (field === "setUserRole") {
    if (!sub) throw new Error("Unauthenticated");

    const input = event.arguments?.input as {
      userId: string;
      email?: string | null;
      role: Role;
      tier?: Tier | null;
    };

    if (!input?.userId || !input?.role) {
      throw new Error("userId and role are required");
    }

    const targetUserId = input.userId;

    if (!isAdmin && targetUserId !== sub) {
      throw new Error("Not authorized to modify other users");
    }

    const got = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: keyFor(targetUserId) })
    );

    const now = nowIso();
    const existing = got.Item ? toUser(got.Item, targetUserId, null) : null;

    const merged: User = {
      id: targetUserId,
      email:
        (input.email ??
          existing?.email ??
          null)?.toLowerCase?.() ?? null,
      role: input.role,
      tier: input.tier ?? existing?.tier ?? "FREE",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toPutItem(merged, targetUserId),
      })
    );

    return merged;
  }

  throw new Error(`Unhandled field: ${field}`);
};
