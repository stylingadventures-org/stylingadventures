// lambda/roles/index.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  AppSyncResolverEvent,
  AppSyncIdentityCognito,
} from "aws-lambda";

const TABLE_NAME = process.env.TABLE_NAME!;
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

export const handler = async (event: AppSyncResolverEvent<any>) => {
  const field = event.info.fieldName;

  // Cognito identity from AppSync
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

    // Try to fetch the user
    const got = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: sub },
      })
    );
    if (got.Item) return got.Item as User;

    // Create a default FAN user if not found (idempotent)
    const now = nowIso();
    const item: User = {
      id: sub,
      email: (email ?? null)?.toLowerCase?.() ?? null,
      role: "FAN",
      tier: "FREE",
      createdAt: now,
      updatedAt: now,
    };

    try {
      await ddb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
          ConditionExpression: "attribute_not_exists(#id)",
          ExpressionAttributeNames: { "#id": "id" },
        })
      );
    } catch {
      // If it already exists (race), ignore
      await ddb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { id: sub },
        })
      );
    }

    return item;
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

    // Only ADMIN can modify others; anyone can modify self
    if (!isAdmin && targetUserId !== sub) {
      throw new Error("Not authorized to modify other users");
    }

    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: targetUserId },
      })
    );

    const now = nowIso();
    const item: User = existing.Item
      ? {
          ...(existing.Item as User),
          email:
            (input.email ??
              (existing.Item as User).email ??
              null)?.toLowerCase?.() ?? null,
          role: input.role,
          tier: (input.tier ?? (existing.Item as User).tier) ?? null,
          updatedAt: now,
        }
      : {
          id: targetUserId,
          email: (input.email ?? null)?.toLowerCase?.() ?? null,
          role: input.role,
          tier: input.tier ?? "FREE",
          createdAt: now,
          updatedAt: now,
        };

    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return item;
  }

  /* ======================== adminListUsers ====================== */
  // Simple admin listing with optional email substring search + pagination
  if (field === "adminListUsers") {
    if (!isAdmin) throw new Error("Not authorized");

    const args = (event.arguments || {}) as {
      search?: string | null;
      limit?: number | null;
      nextToken?: string | null;
    };

    const limit = Math.min(Math.max(args.limit ?? 25, 1), 100);
    const startKey = args.nextToken
      ? JSON.parse(Buffer.from(args.nextToken, "base64").toString("utf8"))
      : undefined;

    const params: any = {
      TableName: TABLE_NAME,
      Limit: limit,
      ExclusiveStartKey: startKey,
    };

    const q = (args.search || "").trim().toLowerCase();
    if (q) {
      params.FilterExpression = "contains(#email, :q)";
      params.ExpressionAttributeNames = { "#email": "email" };
      params.ExpressionAttributeValues = { ":q": q };
    }

    const out = await ddb.send(new ScanCommand(params));

    const items = (out.Items || []).map((u: any) => ({
      id: u.id,
      email: u.email ?? null,
      role: u.role,
      tier: u.tier ?? null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return {
      items,
      nextToken: out.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(out.LastEvaluatedKey)).toString("base64")
        : null,
    };
  }

  /* =========================== default ========================== */
  throw new Error(`Unhandled field: ${field}`);
};
