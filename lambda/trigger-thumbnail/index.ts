import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const sfn = new SFNClient({});
const { STATE_MACHINE_ARN = "" } = process.env;

export const handler = async (event: any) => {
  if (!STATE_MACHINE_ARN) throw new Error("STATE_MACHINE_ARN is not set");

  // event.Records[] from SQS. Each record body is a JSON string from your presign/upload logic.
  const records = Array.isArray(event?.Records) ? event.Records : [];
  const results = [];

  for (const r of records) {
    const body = typeof r.body === "string" ? JSON.parse(r.body) : r.body ?? {};
    const input = JSON.stringify({
      ...body,
      receivedAt: new Date().toISOString(),
    });
    const res = await sfn.send(
      new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        input,
      })
    );
    results.push({ executionArn: res.executionArn });
  }

  return { ok: true, started: results.length, results };
};
