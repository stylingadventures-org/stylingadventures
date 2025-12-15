import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from "@aws-sdk/client-sfn";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
const SM_ARN = process.env.SM_ARN;
const TABLE_NAME = process.env.TABLE_NAME;
const ADMIN_API_URL = process.env.ADMIN_API_URL;

const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

if (!SM_ARN || !TABLE_NAME || !ADMIN_API_URL) {
  throw new Error("Missing env: SM_ARN, TABLE_NAME, ADMIN_API_URL");
}

const sfn = new SFNClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function poll(executionArn, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const d = await sfn.send(new DescribeExecutionCommand({ executionArn }));
    if (d.status !== "RUNNING") return d;
    await sleep(2000);
  }
  throw new Error("Timed out waiting for execution to finish");
}

async function getMeta(id) {
  return ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: `ITEM#${id}`, [SK_NAME]: "META" },
    }),
  );
}

async function main() {
  const id = crypto.randomUUID();

  const input = {
    item: {
      id,
      userId: "147874a8-7021-70d8-b785-d720e87c17b0",
      ownerSub: "147874a8-7021-70d8-b785-d720e87c17b0",
      s3Key: "closet/76f52256-ec3a-4342-8612-0e9a178fa433.jpg",
      // rawMediaKey: "closet/76f52256-ec3a-4342-8612-0e9a178fa433.jpg",
    },
  };

  const started = await sfn.send(
    new StartExecutionCommand({
      stateMachineArn: SM_ARN,
      name: `e2e-${id}`,
      input: JSON.stringify(input),
    }),
  );

  console.log("Started:", started.executionArn);

  // wait for NotifyAdmin to write the token
  await sleep(6000);

  const meta = await getMeta(id);
  console.log("META:", meta.Item);

  const res = await fetch(`${ADMIN_API_URL}/admin/closet/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ approvalId: id, decision: "APPROVE" }),
  });

  const json = await res.json().catch(() => ({}));
  console.log("Approve response:", res.status, json);

  const done = await poll(started.executionArn);
  console.log("Execution final:", done.status, done.error || "", done.cause || "");
}

await main();
