// lambda/graphql/index.ts
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";

const TABLE_NAME = process.env.TABLE_NAME!;
const APPROVAL_SM_ARN = process.env.APPROVAL_SM_ARN!;
const STATUS_GSI = process.env.STATUS_GSI ?? "gsi1";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

type ClosetStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "PUBLISHED";
type ClosetAudience = "PUBLIC" | "BESTIE" | "EXCLUSIVE";

interface ClosetItem {
  id: string;
  userId: string;
  ownerSub: string;
  status: ClosetStatus;
  createdAt: string;
  updatedAt: string;

  // S3 keys
  mediaKey?: string;      // processed / cutout image (set by bg-worker)
  rawMediaKey?: string;   // original upload key in S3 (e.g. "closet/uuid.jpg")

  title?: string;
  reason?: string;
  audience?: ClosetAudience;

  // Story-style metadata (Bestie / fan-facing)
  storyTitle?: string;
  storySeason?: string;
  storyVibes?: string[];
}

function nowIso() {
  return new Date().toISOString();
}

function pkForUser(userId: string) {
  return `USER#${userId}`;
}

function skForClosetItem(id: string) {
  return `CLOSET#${id}`;
}

function gsi1ForStatus(status: ClosetStatus) {
  return `CLOSET#STATUS#${status}`;
}

/**
 * Map a raw DynamoDB item into our ClosetItem shape.
 */
function mapClosetItem(raw: Record<string, any>): ClosetItem {
  const item = unmarshall(raw) as any;

  return {
    id: item.id,
    userId: item.userId,
    ownerSub: item.ownerSub,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    mediaKey: item.mediaKey,
    rawMediaKey: item.rawMediaKey,   // 👈 expose rawMediaKey
    title: item.title,
    reason: item.reason,
    audience: item.audience,
    storyTitle: item.storyTitle,
    storySeason: item.storySeason,
    storyVibes: item.storyVibes,
  };
}

/**
 * Ensure the caller is authenticated and return sub/userId.
 */
function requireUserSub(identity: any): string {
  if (!identity?.sub) {
    throw new Error("Not authenticated");
  }
  return identity.sub as string;
}

/**
 * 1) myCloset – return all items owned by the current user.
 */
async function handleMyCloset(identity: any): Promise<ClosetItem[]> {
  const sub = requireUserSub(identity);

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: marshall({
        ":pk": pkForUser(sub),
        ":sk": "CLOSET#",
      }),
    }),
  );

  return (res.Items ?? []).map(mapClosetItem);
}

/**
 * 2) createClosetItem – create a new item in DRAFT.
 *    We now accept rawMediaKey = FULL S3 key (including "closet/" prefix).
 */
async function handleCreateClosetItem(
  args: { title?: string; mediaKey?: string; rawMediaKey?: string },
  identity: any,
): Promise<ClosetItem> {
  const sub = requireUserSub(identity);
  const id = randomUUID();
  const now = nowIso();

  const item: ClosetItem = {
    id,
    userId: sub,
    ownerSub: sub,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    mediaKey: args.mediaKey,
    rawMediaKey: args.rawMediaKey, // 👈 store original upload key
    title: args.title,
  };

  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        pk: pkForUser(sub),
        sk: skForClosetItem(id),

        // status GSI
        gsi1pk: gsi1ForStatus(item.status),
        gsi1sk: now,

        // rawMediaKey GSI uses "rawMediaKey" as its partition key
        // (index name is RAW_MEDIA_GSI_NAME = "rawMediaKeyIndex" on the table)
        rawMediaKey: item.rawMediaKey,

        ...item,
      }),
    }),
  );

  return item;
}

/**
 * 3) updateClosetMediaKey – update the media key on an item owned by the user.
 *    rawMediaKey stays the same; bg-worker updates mediaKey after cutout.
 */
async function handleUpdateClosetMediaKey(
  args: { id: string; mediaKey: string },
  identity: any,
): Promise<ClosetItem> {
  const sub = requireUserSub(identity);

  const now = nowIso();

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        pk: pkForUser(sub),
        sk: skForClosetItem(args.id),
      }),
      UpdateExpression:
        "SET mediaKey = :mediaKey, updatedAt = :updatedAt, gsi1pk = :gsi1pk, gsi1sk = :gsi1sk",
      ExpressionAttributeValues: marshall({
        ":mediaKey": args.mediaKey,
        ":updatedAt": now,
        ":gsi1pk": gsi1ForStatus("DRAFT"),
        ":gsi1sk": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Item not found");
  }

  return mapClosetItem(res.Attributes);
}

/**
 * 4) requestClosetApproval – mark DRAFT→PENDING and kick off Step Functions.
 */
async function handleRequestClosetApproval(
  args: { id: string },
  identity: any,
): Promise<string> {
  const sub = requireUserSub(identity);
  const now = nowIso();

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        pk: pkForUser(sub),
        sk: skForClosetItem(args.id),
      }),
      ConditionExpression: "status = :draft",
      UpdateExpression:
        "SET status = :pending, updatedAt = :updatedAt, gsi1pk = :gsi1pk, gsi1sk = :gsi1sk",
      ExpressionAttributeValues: marshall({
        ":draft": "DRAFT",
        ":pending": "PENDING",
        ":updatedAt": now,
        ":gsi1pk": gsi1ForStatus("PENDING"),
        ":gsi1sk": now,
      }),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Item not found or not in DRAFT status");
  }

  const item = mapClosetItem(res.Attributes);

  // Fire-and-forget Step Functions execution
  await sfn.send(
    new StartExecutionCommand({
      stateMachineArn: APPROVAL_SM_ARN,
      input: JSON.stringify({
        itemId: item.id,
        userId: item.userId,
        ownerSub: item.ownerSub,
      }),
    }),
  );

  return item.id;
}

/**
 * 5) updateClosetItemStory – Bestie-side metadata for fan-facing view.
 */
async function handleUpdateClosetItemStory(
  args: {
    input: {
      id: string;
      storyTitle?: string | null;
      storySeason?: string | null;
      storyVibes?: (string | null)[] | null;
    };
  },
  identity: any,
): Promise<ClosetItem> {
  const sub = requireUserSub(identity);
  const { id, storyTitle, storySeason, storyVibes } = args.input;

  const now = nowIso();

  const updateExpressions: string[] = ["updatedAt = :updatedAt"];
  const expressionValues: Record<string, any> = {
    ":updatedAt": now,
  };

  if (storyTitle !== undefined) {
    updateExpressions.push("storyTitle = :storyTitle");
    expressionValues[":storyTitle"] = storyTitle;
  }

  if (storySeason !== undefined) {
    updateExpressions.push("storySeason = :storySeason");
    expressionValues[":storySeason"] = storySeason;
  }

  if (storyVibes !== undefined) {
    updateExpressions.push("storyVibes = :storyVibes");
    expressionValues[":storyVibes"] = storyVibes?.filter(
      (v): v is string => !!v,
    );
  }

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        pk: pkForUser(sub),
        sk: skForClosetItem(id),
      }),
      UpdateExpression: "SET " + updateExpressions.join(", "),
      ExpressionAttributeValues: marshall(expressionValues),
      ReturnValues: "ALL_NEW",
    }),
  );

  if (!res.Attributes) {
    throw new Error("Item not found");
  }

  return mapClosetItem(res.Attributes);
}

/**
 * AppSync Lambda resolver entrypoint.
 */
export const handler = async (event: any) => {
  console.log("ClosetResolverFn event", JSON.stringify(event));

  const fieldName = event.info?.fieldName;

  try {
    switch (fieldName) {
      case "myCloset":
        return await handleMyCloset(event.identity);

      case "createClosetItem":
        return await handleCreateClosetItem(event.arguments, event.identity);

      case "updateClosetMediaKey":
        return await handleUpdateClosetMediaKey(
          event.arguments,
          event.identity,
        );

      case "requestClosetApproval":
        return await handleRequestClosetApproval(
          event.arguments,
          event.identity,
        );

      case "updateClosetItemStory":
        return await handleUpdateClosetItemStory(
          event.arguments,
          event.identity,
        );

      default:
        throw new Error(`Unsupported field: ${fieldName}`);
    }
  } catch (err: any) {
    console.error("Error in ClosetResolverFn", err);
    throw err;
  }
};

