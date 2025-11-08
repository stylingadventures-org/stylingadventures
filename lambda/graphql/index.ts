// lambda/graphql/index.ts
import { randomUUID } from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  AppSyncResolverEvent,
  AppSyncIdentityCognito,
} from "aws-lambda";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const TABLE = process.env.TABLE_NAME!;
const APPROVAL_SM_ARN = process.env.APPROVAL_SM_ARN || "";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sfn = new SFNClient({});

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
type ClosetStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "PUBLISHED";

interface ClosetItem {
  id: string;
  ownerSub: string;
  title?: string | null;
  status: ClosetStatus;
  mediaKey?: string | null;
  createdAt: string;
  updatedAt: string;
  // single-table attributes:
  pk?: string;
  sk?: string;
  gsi1pk?: string;
  gsi1sk?: string;
  gsi2pk?: string;
  gsi2sk?: string;
  approvalToken?: string;
  reason?: string | null;
}

const nowIso = () => new Date().toISOString();
const isAdmin = (ident?: AppSyncIdentityCognito) => {
  const groups = (ident as any)?.claims?.["cognito:groups"];
  return Array.isArray(groups)
    ? groups.includes("ADMIN")
    : `${groups || ""}`.includes("ADMIN");
};

const assertAuth = (sub?: string) => {
  if (!sub) throw new Error("Unauthenticated");
};

const keysForId = (id: string) => ({
  pk: `ITEM#${id}`,
  sk: "META",
});

const toPublic = (raw: any): ClosetItem => ({
  id: raw.id,
  ownerSub: raw.ownerSub,
  title: raw.title ?? null,
  status: raw.status,
  mediaKey: raw.mediaKey ?? null,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

// ──────────────────────────────────────────────────────────────────────────────
// Resolvers
// ──────────────────────────────────────────────────────────────────────────────
export const handler = async (event: AppSyncResolverEvent<any>) => {
  const field = event.info.fieldName;
  const ident = event.identity as AppSyncIdentityCognito | undefined;
  const sub = ident?.sub;

  // ------------------ Query.myCloset ------------------
  if (field === "myCloset") {
    assertAuth(sub);

    // Most-recent first (by created/updated time)
    const out = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :p",
        ExpressionAttributeValues: {
          ":p": `OWNER#${sub}`,
        },
        ScanIndexForward: false,
        Limit: 50,
      })
    );

    return (out.Items || [])
      .filter((x) => x.sk === "META")
      .map(toPublic);
  }

  // ------------------ Mutation.createClosetItem ------------------
  if (field === "createClosetItem") {
    assertAuth(sub);
    const { title, mediaKey } = (event.arguments || {}) as {
      title?: string | null;
      mediaKey?: string | null;
    };

    const id = randomUUID();
    const ts = nowIso();

    const item: ClosetItem = {
      id,
      ownerSub: sub!,
      title: (title ?? "").trim() || null,
      mediaKey: (mediaKey ?? "").trim() || null,
      status: "DRAFT",
      createdAt: ts,
      updatedAt: ts,
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          ...item,
          ...keysForId(id),
          gsi1pk: `OWNER#${sub}`,
          gsi1sk: ts,
          gsi2pk: `STATUS#DRAFT`,
          gsi2sk: ts,
        },
        ConditionExpression: "attribute_not_exists(pk)",
      })
    );

    return item;
  }

  // ------------------ Mutation.updateClosetItem ------------------
  if (field === "updateClosetItem") {
    assertAuth(sub);
    const { id, title, mediaKey } = event.arguments as {
      id: string;
      title?: string | null;
      mediaKey?: string | null;
    };

    // Ownership check
    const got = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: keysForId(id),
      })
    );
    if (!got.Item) throw new Error("Not found");
    if (got.Item.ownerSub !== sub) throw new Error("Forbidden");

    const ts = nowIso();
    const expr: string[] = ["updatedAt = :u"];
    const values: Record<string, any> = { ":u": ts };

    if (typeof title !== "undefined") {
      expr.push("#t = :t");
      values[":t"] = title ?? null;
    }
    if (typeof mediaKey !== "undefined") {
      expr.push("mediaKey = :m");
      values[":m"] = mediaKey ?? null;
    }

    const updated = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: keysForId(id),
        UpdateExpression: `SET ${expr.join(", ")}`,
        ExpressionAttributeValues: values,
        ExpressionAttributeNames: { "#t": "title" },
        ReturnValues: "ALL_NEW",
      })
    );

    return toPublic(updated.Attributes);
  }

  // ------------------ Mutation.updateClosetMediaKey ------------------
  if (field === "updateClosetMediaKey") {
    assertAuth(sub);
    const { id, key } = event.arguments as { id: string; key: string };

    const got = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: keysForId(id),
      })
    );
    if (!got.Item) throw new Error("Not found");
    if (got.Item.ownerSub !== sub) throw new Error("Forbidden");

    const ts = nowIso();
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: keysForId(id),
        UpdateExpression: "SET mediaKey = :k, updatedAt = :u",
        ExpressionAttributeValues: { ":k": key, ":u": ts },
      })
    );
    return true;
  }

  // ------------------ Mutation.deleteClosetItem ------------------
  if (field === "deleteClosetItem") {
    assertAuth(sub);
    const { id } = event.arguments as { id: string };

    const got = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: keysForId(id),
      })
    );
    if (!got.Item) throw new Error("Not found");
    if (got.Item.ownerSub !== sub && !isAdmin(ident))
      throw new Error("Forbidden");

    await ddb.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: keysForId(id),
      })
    );
    return true;
  }

  // ------------------ Mutation.requestClosetApproval ------------------
  if (field === "requestClosetApproval") {
    assertAuth(sub);
    const { id } = event.arguments as { id: string };

    const got = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: keysForId(id),
      })
    );
    if (!got.Item) throw new Error("Not found");
    if (got.Item.ownerSub !== sub) throw new Error("Forbidden");

    const ts = nowIso();

    // Move to PENDING and index on gsi2
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: keysForId(id),
        UpdateExpression:
          "SET #s = :p, gsi2pk = :g, gsi2sk = :ts, updatedAt = :ts",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":p": "PENDING",
          ":g": "STATUS#PENDING",
          ":ts": ts,
        },
      })
    );

    // Kick off approval state machine (human-in-the-loop via SNS)
    if (APPROVAL_SM_ARN) {
      await sfn.send(
        new StartExecutionCommand({
          stateMachineArn: APPROVAL_SM_ARN,
          input: JSON.stringify({
            itemId: id,
            ownerSub: sub,
            // other fields if you want…
          }),
        })
      );
    }

    return true;
  }

  // ------------------ Query.adminListPending ------------------
  if (field === "adminListPending") {
    if (!isAdmin(ident)) throw new Error("Not authorized");

    const args = (event.arguments || {}) as {
      limit?: number | null;
      nextToken?: string | null;
    };

    const limit = Math.min(Math.max(args.limit ?? 25, 1), 100);
    const startKey = args.nextToken
      ? JSON.parse(Buffer.from(args.nextToken, "base64").toString("utf8"))
      : undefined;

    const out = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "gsi2",
        KeyConditionExpression: "gsi2pk = :p",
        ExpressionAttributeValues: { ":p": "STATUS#PENDING" },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: startKey,
      })
    );

    return {
      items: (out.Items || []).map(toPublic),
      nextToken: out.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(out.LastEvaluatedKey)).toString("base64")
        : null,
    };
  }

  // ------------------ Mutation.adminApproveItem ------------------
  if (field === "adminApproveItem") {
    if (!isAdmin(ident)) throw new Error("Not authorized");
    const { id } = event.arguments as { id: string };

    const ts = nowIso();
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: keysForId(id),
        UpdateExpression:
          "SET #s = :a, gsi2pk = :g, gsi2sk = :ts, updatedAt = :ts REMOVE approvalToken",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":a": "APPROVED",
          ":g": "STATUS#APPROVED",
          ":ts": ts,
        },
      })
    );
    return true;
  }

  // ------------------ Mutation.adminRejectItem ------------------
  if (field === "adminRejectItem") {
    if (!isAdmin(ident)) throw new Error("Not authorized");
    const { id, reason } = event.arguments as { id: string; reason?: string };

    const ts = nowIso();
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: keysForId(id),
        UpdateExpression:
          "SET #s = :r, gsi2pk = :g, gsi2sk = :ts, updatedAt = :ts, reason = :why REMOVE approvalToken",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":r": "REJECTED",
          ":g": "STATUS#REJECTED",
          ":ts": ts,
          ":why": reason ?? "Rejected by admin",
        },
      })
    );
    return true;
  }

  // ----------------------------------------------------------------
  throw new Error(`Unhandled field: ${field}`);
};
