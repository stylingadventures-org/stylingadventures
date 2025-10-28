// lambda/graphql/closet.ts
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  GetItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import {
  SFNClient,
  StartExecutionCommand,
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
} from "@aws-sdk/client-sfn";
import { randomUUID } from "crypto";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

const { TABLE_NAME = "", APPROVAL_SM_ARN = "" } = process.env;
if (!TABLE_NAME) throw new Error("Missing env: TABLE_NAME");

const S = (v: string) => ({ S: v });
const nowIso = () => new Date().toISOString();

// --- helper (auth claims)
function getSubAndAdmin(event: any) {
  const claims = event?.identity?.claims || {};
  const sub: string | undefined = event?.identity?.sub || claims?.sub;
  const rawGroups = claims?.["cognito:groups"];
  const groups: string[] = Array.isArray(rawGroups)
    ? (rawGroups as string[])
    : String(rawGroups || "")
        .split(",")
        .map((x: string) => x.trim())
        .filter(Boolean);
  const isAdmin = groups.includes("ADMIN");
  if (!sub) throw new Error("Unauthorized");
  return { sub, isAdmin };
}

/** -------- Queries -------- */
export const myCloset = async (event: any) => {
  const { sub } = getSubAndAdmin(event);
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :p",
      ExpressionAttributeValues: { ":p": S(`OWNER#${sub}`) },
      ScanIndexForward: false,
      ProjectionExpression:
        "id, ownerSub, #s, createdAt, updatedAt, mediaKey, title, reason",
      ExpressionAttributeNames: { "#s": "status" },
    }),
  );
  return (out.Items || []).map((it) => ({
    id: it.id.S!,
    ownerSub: it.ownerSub.S!,
    status: it["status"].S!,
    createdAt: it.createdAt.S!,
    updatedAt: it.updatedAt.S!,
    mediaKey: it.mediaKey?.S ?? "",
    title: it.title?.S ?? "",
    reason: it.reason?.S ?? "",
  }));
};

export const adminListPending = async (event: any) => {
  const { isAdmin } = getSubAndAdmin(event);
  if (!isAdmin) throw new Error("Forbidden");
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi2",
      KeyConditionExpression: "gsi2pk = :p",
      ExpressionAttributeValues: { ":p": S("STATUS#PENDING") },
      ScanIndexForward: true,
      ProjectionExpression:
        "id, ownerSub, #s, createdAt, updatedAt, mediaKey, title, reason",
      ExpressionAttributeNames: { "#s": "status" },
    }),
  );
  return (out.Items || []).map((it) => ({
    id: it.id.S!,
    ownerSub: it.ownerSub.S!,
    status: it["status"].S!,
    createdAt: it.createdAt.S!,
    updatedAt: it.updatedAt.S!,
    mediaKey: it.mediaKey?.S ?? "",
    title: it.title?.S ?? "",
    reason: it.reason?.S ?? "",
  }));
};

/** -------- Mutations -------- */
export const createClosetItem = async (event: any) => {
  const { sub } = getSubAndAdmin(event);
  const args = event?.arguments || {};
  const id = randomUUID();
  const now = nowIso();
  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: S(`ITEM#${id}`),
        sk: S("META"),
        id: S(id),
        ownerSub: S(sub),
        status: S("DRAFT"),
        title: S(args.title ?? ""),
        mediaKey: S(args.mediaKey ?? ""),
        createdAt: S(now),
        updatedAt: S(now),
        gsi1pk: S(`OWNER#${sub}`),
        gsi1sk: S(now),
        gsi2pk: S("STATUS#DRAFT"),
        gsi2sk: S(now),
      },
      ConditionExpression: "attribute_not_exists(pk)",
    }),
  );
  return {
    id,
    ownerSub: sub,
    status: "DRAFT",
    title: args.title ?? "",
    mediaKey: args.mediaKey ?? "",
    createdAt: now,
    updatedAt: now,
  };
};

/** Update media key (owner or admin) */
export const updateClosetMediaKey = async (event: any) => {
  const { sub, isAdmin } = getSubAndAdmin(event);
  const id: string | undefined = event?.arguments?.id;
  const mediaKey: string | undefined = event?.arguments?.mediaKey;
  if (!id || !mediaKey) throw new Error("id and mediaKey required");

  // Require ownership if not admin
  if (!isAdmin) {
    const got = await ddb.send(new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      ProjectionExpression: "ownerSub"
    }));
    if (!got.Item?.ownerSub?.S) throw new Error("Not found");
    if (got.Item.ownerSub.S !== sub) throw new Error("Not authorized");
  }

  const now = nowIso();
  const out = await ddb.send(new UpdateItemCommand({
    TableName: TABLE_NAME,
    Key: { pk: S(`ITEM#${id}`), sk: S("META") },
    UpdateExpression: "SET mediaKey = :k, updatedAt = :u",
    ExpressionAttributeValues: { ":k": S(mediaKey), ":u": S(now) },
    ReturnValues: "ALL_NEW",
  }));

  const it = out.Attributes!;
  return {
    id: it.id.S!,
    ownerSub: it.ownerSub.S!,
    status: it["status"].S!,
    createdAt: it.createdAt.S!,
    updatedAt: it.updatedAt.S!,
    mediaKey: it.mediaKey?.S ?? "",
    title: it.title?.S ?? "",
    reason: it.reason?.S ?? "",
  };
};

export const requestClosetApproval = async (event: any) => {
  const { sub, isAdmin } = getSubAndAdmin(event);
  const id: string | undefined = event?.arguments?.id;
  if (!id) throw new Error("id required");
  const now = nowIso();

  if (!isAdmin) {
    const got = await ddb.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: { pk: S(`ITEM#${id}`), sk: S("META") },
        ProjectionExpression: "ownerSub",
      }),
    );
    if (!got.Item?.ownerSub?.S) throw new Error("Not found");
    if (got.Item.ownerSub.S !== sub) throw new Error("Not authorized");
  }

  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression:
        "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": S("PENDING"),
        ":u": S(now),
        ":g2pk": S("STATUS#PENDING"),
        ":g2sk": S(now),
      },
    }),
  );

  if (APPROVAL_SM_ARN) {
    try {
      await sfn.send(
        new StartExecutionCommand({
          stateMachineArn: APPROVAL_SM_ARN,
          input: JSON.stringify({ itemId: id, ownerSub: sub }),
          name: `req-${id}-${Date.now()}`,
        }),
      );
    } catch {
      /* non-fatal */
    }
  }
  return `requested:${id}`;
};

export const adminApproveItem = async (event: any) => {
  const { isAdmin } = getSubAndAdmin(event);
  if (!isAdmin) throw new Error("Forbidden");
  const id: string | undefined = event?.arguments?.id;
  if (!id) throw new Error("id required");
  const now = nowIso();

  const out = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression:
        "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk REMOVE reason, approvalToken",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": S("APPROVED"),
        ":u": S(now),
        ":g2pk": S("STATUS#APPROVED"),
        ":g2sk": S(now),
      },
      ReturnValues: "ALL_OLD",
    }),
  );

  const prev = out.Attributes!;
  const token = prev?.approvalToken?.S;
  if (token) {
    try {
      await sfn.send(
        new SendTaskSuccessCommand({
          taskToken: token,
          output: JSON.stringify({ approved: true }),
        }),
      );
    } catch {}
  }

  return {
    id: prev.id.S!,
    ownerSub: prev.ownerSub.S!,
    status: "APPROVED",
    createdAt: prev.createdAt.S!,
    updatedAt: now,
    mediaKey: prev.mediaKey?.S ?? "",
    title: prev.title?.S ?? "",
    reason: "",
  };
};

export const adminRejectItem = async (event: any) => {
  const { isAdmin } = getSubAndAdmin(event);
  if (!isAdmin) throw new Error("Forbidden");
  const id: string | undefined = event?.arguments?.id;
  const reason: string = event?.arguments?.reason ?? "";
  if (!id) throw new Error("id required");
  const now = nowIso();

  const out = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression:
        "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk, reason = :r REMOVE approvalToken",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": S("REJECTED"),
        ":u": S(now),
        ":g2pk": S("STATUS#REJECTED"),
        ":g2sk": S(now),
        ":r": S(reason),
      },
      ReturnValues: "ALL_OLD",
    }),
  );

  const prev = out.Attributes!;
  const token = prev?.approvalToken?.S;
  if (token) {
    try {
      await sfn.send(
        new SendTaskFailureCommand({
          taskToken: token,
          error: "Rejected",
          cause: reason || "Rejected by admin",
        }),
      );
    } catch {}
  }

  return {
    id: prev.id.S!,
    ownerSub: prev.ownerSub.S!,
    status: "REJECTED",
    createdAt: prev.createdAt.S!,
    updatedAt: now,
    mediaKey: prev.mediaKey?.S ?? "",
    title: prev.title?.S ?? "",
    reason,
  };
};
