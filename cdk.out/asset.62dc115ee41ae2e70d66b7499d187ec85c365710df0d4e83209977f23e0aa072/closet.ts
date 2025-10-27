import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

const {
  TABLE_NAME = "",
  APPROVAL_SM_ARN = "",
  // optional index names if you ever change them in CDK:
  OWNER_GSI_NAME = "gsi1",
  STATUS_GSI_NAME = "gsi2",
} = process.env;

type AppSyncEvent = {
  info?: { fieldName?: string };
  arguments?: Record<string, any>;
  identity?: { sub?: string; claims?: any };
};

/** Helper */
function getSub(ev: AppSyncEvent): string {
  const sub = ev.identity?.sub || ev.identity?.claims?.sub;
  if (!sub) throw new Error("Unauthorized");
  return sub;
}

/** Query: list current user's items */
async function myCloset(ev: AppSyncEvent) {
  const sub = getSub(ev);

  const q = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: OWNER_GSI_NAME, // (gsi1) PK = gsi1pk, SK = gsi1sk
      KeyConditionExpression: "gsi1pk = :p",
      ExpressionAttributeValues: {
        ":p": { S: `OWNER#${sub}` },
      },
      ScanIndexForward: false, // newest first
    })
  );

  const items = (q.Items ?? []).map((it) => ({
    id: it.id?.S ?? "",
    ownerSub: it.ownerSub?.S ?? sub,
    status: it.status?.S ?? "DRAFT",
    title: it.title?.S ?? "",
    mediaKey: it.mediaKey?.S ?? "",
    createdAt: it.createdAt?.S ?? "",
    updatedAt: it.updatedAt?.S ?? "",
  }));

  // return an array (never null) to satisfy [ClosetItem!]!
  return items;
}

/** Mutation: create */
async function createClosetItem(ev: AppSyncEvent) {
  const sub = getSub(ev);
  const args = ev.arguments || {};
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: { S: `ITEM#${id}` },
        sk: { S: "META" },

        id: { S: id },
        ownerSub: { S: sub },
        status: { S: "DRAFT" },
        title: { S: args.title ?? "" },
        mediaKey: { S: args.mediaKey ?? "" },

        createdAt: { S: now },
        updatedAt: { S: now },

        // gsi1 = list by owner
        gsi1pk: { S: `OWNER#${sub}` },
        gsi1sk: { S: now },

        // gsi2 = list by status
        gsi2pk: { S: "STATUS#DRAFT" },
        gsi2sk: { S: now },
      },
      ConditionExpression: "attribute_not_exists(pk)",
    })
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
}

/** Mutation: request approval (kicks off Step Functions) */
async function requestClosetApproval(ev: AppSyncEvent) {
  const sub = getSub(ev);
  const id = ev.arguments?.id;
  if (!id) throw new Error("id required");

  const now = new Date().toISOString();

  await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { pk: { S: `ITEM#${id}` }, sk: { S: "META" } },
      UpdateExpression:
        "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": { S: "PENDING" },
        ":u": { S: now },
        ":g2pk": { S: "STATUS#PENDING" },
        ":g2sk": { S: now },
      },
      ConditionExpression: "attribute_exists(pk)",
    })
  );

  const out = await sfn.send(
    new StartExecutionCommand({
      stateMachineArn: APPROVAL_SM_ARN,
      input: JSON.stringify({ itemId: id, ownerSub: sub }),
    })
  );

  return out.executionArn!;
}

/** Single Lambda for multiple AppSync fields */
export const handler = async (event: AppSyncEvent) => {
  const field = event.info?.fieldName;
  switch (field) {
    case "myCloset":
      return myCloset(event);
    case "createClosetItem":
      return createClosetItem(event);
    case "requestClosetApproval":
      return requestClosetApproval(event);
    default:
      throw new Error(`Unknown field ${field}`);
  }
};
