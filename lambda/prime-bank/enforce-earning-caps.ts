// lambda/prime-bank/enforce-earning-caps.ts
import {
  DynamoDBClient,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { Handler } from "aws-lambda";

const ACCOUNT_TABLE_NAME = process.env.PRIME_BANK_ACCOUNT_TABLE_NAME!;
const ddb = new DynamoDBClient({});

interface EnforceEarningCapsEvent {
  userId: string;
  amountToAward: number; // requested amount
  role: "Fan" | "Bestie" | "Creator" | "Admin" | string;
}

export const handler: Handler<EnforceEarningCapsEvent, any> = async (event) => {
  console.log("EnforceEarningCaps event:", JSON.stringify(event));

  const { userId, amountToAward, role } = event;

  // 1) Fetch current account
  const resp = await ddb.send(
    new GetItemCommand({
      TableName: ACCOUNT_TABLE_NAME,
      Key: { userId: { S: userId } },
    })
  );

  // TODO: pull these from config, not hard-coded.
  const dailyCap = role === "Bestie" ? 100 : 50;
  const weeklyCap = role === "Bestie" ? 500 : 250;

  // Very naive logic for now:
  // - Just check if requested amount is under the caps.
  // - In the future you'll read dailyCoinTotal / weeklyCoinTotal and reset them based on lastDailyReset / lastWeeklyReset.
  const allowed = amountToAward <= dailyCap && amountToAward <= weeklyCap;

  if (!allowed) {
    return {
      ok: false,
      reason: "CAP_EXCEEDED",
      suggestedMaxAward: Math.min(dailyCap, weeklyCap),
    };
  }

  // 2) (Placeholder) update daily/weekly totals
  await ddb.send(
    new UpdateItemCommand({
      TableName: ACCOUNT_TABLE_NAME,
      Key: { userId: { S: userId } },
      UpdateExpression:
        "ADD dailyCoinTotal :delta, weeklyCoinTotal :delta SET lastDailyReset = :today, lastWeeklyReset = :today",
      ExpressionAttributeValues: {
        ":delta": { N: String(amountToAward) },
        ":today": { S: new Date().toISOString().slice(0, 10) },
      },
    })
  );

  return {
    ok: true,
    userId,
    amountToAward,
  };
};
