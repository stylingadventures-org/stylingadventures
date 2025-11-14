// lambda/graphql/index.ts
//
// General closet GraphQL resolver:
//   - Query.myCloset
//   - Query.closetFeed
//   - Mutation.createClosetItem
//   - Mutation.requestClosetApproval
//   - Mutation.updateClosetMediaKey

import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { randomUUID } from "crypto";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

const TABLE_NAME =
  process.env.TABLE_NAME || process.env.APP_TABLE || undefined;
const APPROVAL_SM_ARN = process.env.APPROVAL_SM_ARN;

if (!TABLE_NAME) {
  throw new Error(
    "ClosetResolverFn: TABLE_NAME (or APP_TABLE) environment variable is required",
  );
}

type ClosetStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED";
type ClosetAudience = "PUBLIC" | "BESTIE" | "EXCLUSIVE";

type ClosetItem = {
  id: string;
  ownerSub: string;
  title?: string | null;
  mediaKey?: string | null;
  status: ClosetStatus;
  audience: ClosetAudience;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AppSyncIdentity = {
  sub?: string;
  claims?: Record<string, any>;
};

type AppSyncEvent = {
  info: { fieldName: string; parentTypeName: string };
  arguments: any;
  identity?: AppSyncIdentity;
};

// ---------- helpers ----------

function getUserSub(event: AppSyncEvent): string {
  const sub =
    event.identity?.sub ||
    (event.identity?.claims && event.identity.claims["sub"]);
  if (!sub) {
    throw new Error("ClosetResolverFn: missing identity.sub");
  }
  return String(sub);
}

function mapClosetItem(raw: any): ClosetItem {
  const it = unmarshall(raw) as any;
  return {
    id: String(it.id),
    ownerSub: String(it.ownerSub),
    title: it.title ?? null,
    mediaKey: it.mediaKey ?? null,
    status: (it.status ?? "PENDING") as ClosetStatus,
    audience: (it.audience ?? "PUBLIC") as ClosetAudience,
    reason: it.reason ?? null,
    createdAt: String(it.createdAt),
    updatedAt: String(it.updatedAt ?? it.createdAt),
  };
}

/**
 * Find the META row for an item by id.
 */
async function findRawItemById(id: string) {
  const resp = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression:
        "begins_with(#pk, :itemPrefix) AND #sk = :meta AND #id = :id",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
        "#id": "id",
      },
      ExpressionAttributeValues: {
        ":itemPrefix": { S: "ITEM#" },
        ":meta": { S: "META" },
        ":id": { S: id },
      },
      Limit: 1,
    }),
  );
  if (!resp.Items || resp.Items.length === 0) return null;
  return resp.Items[0];
}

function pkOf(raw: any) {
  if (raw.pk?.S && raw.sk?.S) {
    return { pk: raw.pk.S as string, sk: raw.sk.S as string };
  }
  throw new Error("ClosetResolverFn: could not infer pk/sk");
}

// ---------- resolvers ----------

/**
 * Create a new closet item in DRAFT state for the current user.
 */
async function createClosetItem(
  event: AppSyncEvent,
  args: { title?: string | null },
): Promise<ClosetItem> {
  const ownerSub = getUserSub(event);
  const id = randomUUID();
  const now = new Date().toISOString();

  const item = {
    pk: { S: `ITEM#${id}` },
    sk: { S: "META" },
    id: { S: id },
    ownerSub: { S: ownerSub },
    title: { S: args.title ?? "Untitled upload" },
    status: { S: "DRAFT" },
    audience: { S: "PUBLIC" },
    createdAt: { S: now },
    updatedAt: { S: now },
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: "attribute_not_exists(pk)",
    }),
  );

  return {
    id,
    ownerSub,
    title: item.title.S!,
    mediaKey: null,
    status: "DRAFT",
    audience: "PUBLIC",
    reason: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Attach or change the S3 media key for an item.
 */
async function updateClosetMediaKey(
  event: AppSyncEvent,
  args: { id: string; mediaKey: string | null },
): Promise<ClosetItem> {
  const ownerSub = getUserSub(event);

  const base = await findRawItemById(args.id);
  if (!base) throw new Error(`Closet item not found for id=${args.id}`);
  const { pk, sk } = pkOf(base);
  const now = new Date().toISOString();

  const resp = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: { S: pk }, sk: { S: sk } },
      ConditionExpression: "#ownerSub = :owner",
      UpdateExpression: "SET #mediaKey = :mk, #updatedAt = :now",
      ExpressionAttributeNames: {
        "#mediaKey": "mediaKey",
        "#updatedAt": "updatedAt",
        "#ownerSub": "ownerSub",
      },
      ExpressionAttributeValues: {
        ":mk": args.mediaKey ? { S: args.mediaKey } : { NULL: true },
        ":now": { S: now },
        ":owner": { S: ownerSub },
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!resp.Attributes) {
    throw new Error("updateClosetMediaKey: update returned no attributes");
  }
  return mapClosetItem(resp.Attributes);
}

/**
 * Move an item from DRAFT to PENDING and kick off the approval workflow.
 */
async function requestClosetApproval(
  event: AppSyncEvent,
  args: { id: string },
): Promise<ClosetItem> {
  const ownerSub = getUserSub(event);
  const base = await findRawItemById(args.id);
  if (!base) throw new Error(`Closet item not found for id=${args.id}`);
  const { pk, sk } = pkOf(base);
  const now = new Date().toISOString();

  // Mark as PENDING
  const upd = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: { S: pk }, sk: { S: sk } },
      ConditionExpression: "#ownerSub = :owner",
      UpdateExpression: "SET #status = :pending, #updatedAt = :now",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
        "#ownerSub": "ownerSub",
      },
      ExpressionAttributeValues: {
        ":pending": { S: "PENDING" },
        ":now": { S: now },
        ":owner": { S: ownerSub },
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  // Kick off Step Functions workflow (if configured)
  if (APPROVAL_SM_ARN) {
    await sfn.send(
      new StartExecutionCommand({
        stateMachineArn: APPROVAL_SM_ARN,
        input: JSON.stringify({
          itemId: args.id,
          ownerSub,
        }),
      }),
    );
  }

  if (!upd.Attributes) {
    throw new Error("requestClosetApproval: update returned no attributes");
  }
  return mapClosetItem(upd.Attributes);
}

/**
 * Items for the current user, newest first.
 */
async function myCloset(event: AppSyncEvent): Promise<ClosetItem[]> {
  const ownerSub = getUserSub(event);

  const resp = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression:
        "begins_with(#pk, :itemPrefix) AND #sk = :meta AND #ownerSub = :owner",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
        "#ownerSub": "ownerSub",
      },
      ExpressionAttributeValues: {
        ":itemPrefix": { S: "ITEM#" },
        ":meta": { S: "META" },
        ":owner": { S: ownerSub },
      },
    }),
  );

  const items = (resp.Items || []).map(mapClosetItem);
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return items;
}

/**
 * Public feed ("Lala's Closet").
 *
 * For now we show:
 *   - pk begins_with "ITEM#"
 *   - sk == "META"
 *   - status in {APPROVED, PUBLISHED}
 *   - audience == PUBLIC
 *
 * That’s enough to make the feed work again and keeps
 * BESTIE/EXCLUSIVE items private.
 */
async function closetFeed(_event: AppSyncEvent): Promise<ClosetItem[]> {
  const resp = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression:
        "begins_with(#pk, :itemPrefix) AND #sk = :meta AND " +
        "(#status = :approved OR #status = :published) AND #audience = :public",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
        "#status": "status",
        "#audience": "audience",
      },
      ExpressionAttributeValues: {
        ":itemPrefix": { S: "ITEM#" },
        ":meta": { S: "META" },
        ":approved": { S: "APPROVED" },
        ":published": { S: "PUBLISHED" },
        ":public": { S: "PUBLIC" },
      },
    }),
  );

  const items = (resp.Items || []).map(mapClosetItem);
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return items;
}

// ---------- handler ----------

export const handler = async (event: AppSyncEvent) => {
  const { parentTypeName, fieldName } = event.info;

  if (parentTypeName === "Query") {
    if (fieldName === "myCloset") {
      return myCloset(event);
    }
    if (fieldName === "closetFeed") {
      return closetFeed(event);
    }
  }

  if (parentTypeName === "Mutation") {
    if (fieldName === "createClosetItem") {
      return createClosetItem(event, event.arguments);
    }
    if (fieldName === "requestClosetApproval") {
      return requestClosetApproval(event, event.arguments);
    }
    if (fieldName === "updateClosetMediaKey") {
      return updateClosetMediaKey(event, event.arguments);
    }
  }

  throw new Error(
    `ClosetResolverFn: unknown field ${parentTypeName}.${fieldName}`,
  );
};
