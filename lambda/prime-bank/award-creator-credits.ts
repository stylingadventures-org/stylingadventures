// lambda/prime-bank/award-creator-credits.ts
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { Handler } from "aws-lambda";

const ACCOUNT_TABLE_NAME = process.env.PRIME_BANK_ACCOUNT_TABLE_NAME!;
const TRANSACTION_TABLE_NAME = process.env.PRIME_BANK_TRANSACTION_TABLE_NAME!;

const ddb = new DynamoDBClient({});

interface AwardCreatorCreditsEvent {
  userId: string;
  amount: number;
  source: string;
  notes?: string;
}

export const handler: Handler<AwardCreatorCreditsEvent, any> = async (
  event
) => {
  console.log("AwardCreatorCredits event:", JSON.stringify(event));

  const { userId, amount, source, notes } = event;

  // 1) Update creatorCredits balance
  await ddb.send(
    new UpdateItemCommand({
      TableName: ACCOUNT_TABLE_NAME,
      Key: { userId: { S: userId } },
      UpdateExpression: "ADD creatorCredits :delta",
      ExpressionAttributeValues: {
        ":delta": { N: String(amount) },
      },
    })
  );

  // 2) Insert transaction record
  const timestamp = new Date().toISOString();
  const transactionId = `txn_${Date.now()}`;

  await ddb.send(
    new PutItemCommand({
      TableName: TRANSACTION_TABLE_NAME,
      Item: {
        userId: { S: userId },
        timestamp: { S: timestamp },
        transactionId: { S: transactionId },
        type: { S: "earn" },
        currency: { S: "creatorCredits" },
        amount: { N: String(amount) },
        source: { S: source },
        ...(notes ? { notes: { S: notes } } : {}),
      },
    })
  );

  return {
    ok: true,
    userId,
    amount,
    transactionId,
  };
};
