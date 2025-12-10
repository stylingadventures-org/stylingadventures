// lambda/prime-bank/calculate-bank-meter.ts
import {
  DynamoDBClient,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { Handler } from "aws-lambda";

const ACCOUNT_TABLE_NAME = process.env.PRIME_BANK_ACCOUNT_TABLE_NAME!;
const ddb = new DynamoDBClient({});

interface CalculateBankMeterEvent {
  userId: string;
}

export const handler: Handler<CalculateBankMeterEvent, any> = async (event) => {
  console.log("CalculateBankMeter event:", JSON.stringify(event));

  const { userId } = event;

  // 1) Fetch current account
  const resp = await ddb.send(
    new GetItemCommand({
      TableName: ACCOUNT_TABLE_NAME,
      Key: { userId: { S: userId } },
    })
  );

  // TODO: use your real logic here.
  // For now, just set a dummy value (e.g., 10).
  const newMeterValue = 10;

  await ddb.send(
    new UpdateItemCommand({
      TableName: ACCOUNT_TABLE_NAME,
      Key: { userId: { S: userId } },
      UpdateExpression: "SET bankMeterProgress = :value",
      ExpressionAttributeValues: {
        ":value": { N: String(newMeterValue) },
      },
    })
  );

  return {
    ok: true,
    userId,
    bankMeterProgress: newMeterValue,
  };
};
