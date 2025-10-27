// lambda/graphql/closet.ts
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  QueryCommand,
  GetItemCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { randomUUID } from "crypto";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

const {
  TABLE_NAME = "",
  APPROVAL_SM_ARN = "",
  GSI1_NAME = "gsi1", // owner index (gsi1pk/gsi1sk)
  GSI2_NAME = "gsi2", // status index (gsi2pk/gsi2sk)
} = process.env;

if (!TABLE_NAME) throw new Error("Missing env: TABLE_NAME");

// helpers
type AV = AttributeValue;
const S = (v: string): AV => ({ S: v });
const now = () => new Date().toISOString();

function parseGroups(claims: any): string[] {
  const raw = claims?.["cognito:groups"];
  if (Array.isArray(raw)) return raw;
  return String(raw || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
function requireSub(event: any) {
  const sub = event?.identity?.sub || event?.identity?.claims?.sub;
  if (!sub) throw new Error("Unauthorized");
  return String(sub);
}
function isAdmin(event: any) {
  const claims = event?.identity?.claims || {};
  return parseGroups(claims).includes("ADMIN");
}
function shape(i: Record<string, AV>) {
  return {
    id: i.id?.S ?? "",
    ownerSub: i.ownerSub?.S ?? "",
    status: i.status?.S ?? "DRAFT",
    title: i.title?.S ?? "",
    mediaKey: i.mediaKey?.S ?? "",
    createdAt: i.createdAt?.S ?? "",
    updatedAt: i.updatedAt?.S ?? "",
    reason: i.reason?.S,
  };
}

/* ============ Queries ============ */

export const myCloset = async (event: any) => {
  const sub = requireSub(event);

  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": S(`OWNER#${sub}`) },
      ScanIndexForward: false,
    })
  );

  return (out.Items || []).filter((i) => i.sk?.S === "META").map(shape);
};

export const adminListPending = async (_event: any) => {
  // group check handled by @aws_auth on schema
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI2_NAME,
      KeyConditionExpression: "gsi2pk = :pk",
      ExpressionAttributeValues: { ":pk": S("STATUS#PENDING") },
      ScanIndexForward: true,
    })
  );
  return (out.Items || []).filter((i) => i.sk?.S === "META").map(shape);
};

/* ============ Mutations ============ */

export const createClosetItem = async (event: any) => {
  const sub = requireSub(event);
  const { title = "", mediaKey = "" } = event?.arguments || {};
  const id = randomUUID();
  const t = now();

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: S(`ITEM#${id}`),
        sk: S("META"),
        id: S(id),
        ownerSub: S(sub),
        status: S("DRAFT"),
        title: S(title),
        mediaKey: S(mediaKey),
        createdAt: S(t),
        updatedAt: S(t),
        gsi1pk: S(`OWNER#${sub}`),
        gsi1sk: S(t),
        gsi2pk: S("STATUS#DRAFT"),
        gsi2sk: S(t),
      },
      ConditionExpression: "attribute_not_exists(pk)",
    })
  );

  return {
    id,
    ownerSub: sub,
    status: "DRAFT",
    title,
    mediaKey,
    createdAt: t,
    updatedAt: t,
  };
};

export const requestClosetApproval = async (event: any) => {
  const sub = requireSub(event);
  const id = event?.arguments?.id;
  if (!id) throw new Error("id required");

  // If not admin, verify ownership
  if (!isAdmin(event)) {
    const got = await ddb.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: { pk: S(`ITEM#${id}`), sk: S("META") },
        ProjectionExpression: "ownerSub",
      })
    );
    if (!got.Item?.ownerSub?.S) throw new Error("Not found");
    if (got.Item.ownerSub.S !== sub) throw new Error("Not authorized");
  }

  const t = now();
  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: S(`ITEM#${id}`), sk: S("META") },
      UpdateExpression:
        "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk REMOVE reason",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": S("PENDING"),
        ":u": S(t),
        ":g2pk": S("STATUS#PENDING"),
        ":g2sk": S(t),
      },
    })
  );

  if (APPROVAL_SM_ARN) {
    try {
      await sfn.send(
        new StartExecutionCommand({
          stateMachineArn: APPROVAL_SM_ARN,
          input: JSON.stringify({ itemId: id, ownerSub: sub }),
          name: `req-${id}-${Date.now()}`,
        })
      );
    } catch {
      /* swallow */
    }
  }
  return true;
};
