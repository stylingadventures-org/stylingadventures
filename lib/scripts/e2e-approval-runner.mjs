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

async function describe(executionArn) {
  return sfn.send(new DescribeExecutionCommand({ executionArn }));
}

async function getMeta(id) {
  const out = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: `ITEM#${id}`, [SK_NAME]: "META" },
    }),
  );
  return out.Item;
}

async function waitForTokenOrFinish(executionArn, id, timeoutMs = 180000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const [meta, ex] = await Promise.all([getMeta(id), describe(executionArn)]);

    if (meta?.taskToken) return { meta, ex };
    if (ex.status !== "RUNNING") return { meta, ex }; // finished early (FAILED, etc.)

    await sleep(2000);
  }
  throw new Error("Timed out waiting for taskToken or execution to finish");
}

async function pollUntilDone(executionArn, timeoutMs = 240000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const d = await describe(executionArn);
    if (d.status !== "RUNNING") return d;
    await sleep(2000);
  }
  throw new Error("Timed out waiting for execution to finish");
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
  console.log("ApprovalId:", id);

  const { meta, ex } = await waitForTokenOrFinish(started.executionArn, id);

  console.log("Execution status (pre-approve):", ex.status, ex.error || "", ex.cause || "");
  console.log("META (pre-approve):", meta);

  if (!meta?.taskToken) {
    console.error("No taskToken was written. The execution likely failed before NotifyAdmin.");
    return;
  }

  const res = await fetch(`${ADMIN_API_URL}/admin/closet/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ approvalId: id, decision: "APPROVE" }),
  });

  const json = await res.json().catch(() => ({}));
  console.log("Approve response:", res.status, json);

  const done = await pollUntilDone(started.executionArn);
  console.log("Execution final:", done.status, done.error || "", done.cause || "");

  const meta2 = await getMeta(id);
  console.log("META (final):", meta2);
}

await main();
