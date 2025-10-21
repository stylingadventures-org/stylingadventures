import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

const { TABLE_NAME = "", APPROVAL_SM_ARN = "" } = process.env;

export const requestClosetApproval = async (event: any) => {
  const sub = event?.identity?.sub || event?.identity?.claims?.sub;
  if (!sub) throw new Error("Unauthorized");
  const args = event.arguments || {};
  const id = args.id;
  if (!id) throw new Error("id required");

  // set status PENDING
  await ddb.send(new UpdateItemCommand({
    TableName: TABLE_NAME,
    Key: { pk: { S: `ITEM#${id}` }, sk: { S: "META" } },
    UpdateExpression: "SET #s = :s, updatedAt = :u, gsi2pk = :g2pk, gsi2sk = :g2sk",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: {
      ":s": { S: "PENDING" },
      ":u": { S: new Date().toISOString() },
      ":g2pk": { S: "STATUS#PENDING" },
      ":g2sk": { S: new Date().toISOString() },
    },
  }));

  // start workflow
  const input = JSON.stringify({ itemId: id, ownerSub: sub });
  const out = await sfn.send(new StartExecutionCommand({
    stateMachineArn: APPROVAL_SM_ARN,
    input,
  }));

  return out.executionArn!;
};

export const createClosetItem = async (event: any) => {
  const sub = event?.identity?.sub || event?.identity?.claims?.sub;
  if (!sub) throw new Error("Unauthorized");
  const args = event.arguments || {};
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await ddb.send(new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      pk: { S: `ITEM#${id}` }, sk: { S: "META" },
      id: { S: id }, ownerSub: { S: sub }, status: { S: "DRAFT" },
      title: { S: args.title ?? "" }, mediaKey: { S: args.mediaKey ?? "" },
      createdAt: { S: now }, updatedAt: { S: now },
      gsi1pk: { S: `OWNER#${sub}` }, gsi1sk: { S: now },
      gsi2pk: { S: "STATUS#DRAFT" }, gsi2sk: { S: now },
    }
  }));

  return {
    id, ownerSub: sub, status: "DRAFT",
    title: args.title ?? "", mediaKey: args.mediaKey ?? "",
    createdAt: now, updatedAt: now
  };
};
