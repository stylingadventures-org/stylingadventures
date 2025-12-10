// lambda/prime-bank/award-prime-coins.ts
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { Handler } from "aws-lambda";

const ACCOUNT_TABLE_NAME = process.env.PRIME_BANK_ACCOUNT_TABLE_NAME!;
const TRANSACTION_TABLE_NAME = process.env.PRIME_BANK_TRANSACTION_TABLE_NAME!;

const ddb = new DynamoDBClient({});

// Simple shape for now – you can expand later
interface AwardPrimeCoinsEvent {
  userId: string;
  amount: number;
  source: string; // e.g. "dailyLogin"
  notes?: string;
}

export const handler: Handler<AwardPrimeCoinsEvent, any> = async (event) => {
  console.log("AwardPrimeCoins event:", JSON.stringify(event));

  const { userId, amount, source, notes } = event;

  // TODO: add validation, caps, etc.

  // 1) Update PrimeBankAccount.balance
  await ddb.send(
    new UpdateItemCommand({
      TableName: ACCOUNT_TABLE_NAME,
      Key: { userId: { S: userId } },
      UpdateExpression: "ADD primeCoins :delta",
      ExpressionAttributeValues: {
        ":delta": { N: String(amount) },
      },
    })
  );

  // 2) Insert a transaction record
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
        currency: { S: "primeCoins" },
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
