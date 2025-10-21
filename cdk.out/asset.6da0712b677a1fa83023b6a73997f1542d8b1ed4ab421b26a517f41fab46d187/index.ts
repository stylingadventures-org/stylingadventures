// lambda/roles/index.ts
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
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

function nowIso() { return new Date().toISOString(); }

export const handler = async (event: AppSyncResolverEvent<any>) => {
  const field = event.info.fieldName;

  // Cognito identity (for Query.me)
  const ident = event.identity as AppSyncIdentityCognito | undefined;
  const sub = ident?.sub;
  const email = (ident as any)?.claims?.email as string | undefined;

  if (field === "me") {
    if (!sub) throw new Error("Unauthenticated");
    // Try to get record; if none, provision a default
    const got = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id: sub },
    }));
    if (got.Item) return got.Item as User;

    const item: User = {
      id: sub,
      email: email ?? null,
      role: "FAN",
      tier: "FREE",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: "attribute_not_exists(#id)",
      ExpressionAttributeNames: { "#id": "id" },
    }).catch(async () => {
      // If race condition, read again
      const again = await ddb.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: sub },
      }));
      return again;
    }));
    return item;
  }

  if (field === "setUserRole") {
    // Basic guard: require caller to be setUserRole-capable (enforced via Cognito @aws_auth on admin ops),
    // here we assume your admin UI will call this; optional: add extra checks here.
    const input = event.arguments?.input as {
      userId: string;
      email?: string | null;
      role: Role;
      tier?: Tier | null;
    };

    if (!input?.userId || !input?.role) {
      throw new Error("userId and role are required");
    }

    const existing = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id: input.userId },
    }));

    const item: User = existing.Item
      ? {
          ...(existing.Item as User),
          email: input.email ?? (existing.Item as User).email ?? null,
          role: input.role,
          tier: (input.tier ?? (existing.Item as User).tier) ?? null,
          updatedAt: nowIso(),
        }
      : {
          id: input.userId,
          email: input.email ?? null,
          role: input.role,
          tier: input.tier ?? "FREE",
          createdAt: nowIso(),
          updatedAt: nowIso(),
      };

    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return item;
  }

  throw new Error(`Unhandled field: ${field}`);
};
