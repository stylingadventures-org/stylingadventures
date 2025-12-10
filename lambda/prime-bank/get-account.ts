import {
  DynamoDBClient,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { AppSyncIdentityCognito } from "aws-lambda";

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.PRIME_BANK_ACCOUNT_TABLE_NAME!;

type SAIdentity =
  | (AppSyncIdentityCognito & { groups?: string[] | null })
  | null
  | undefined;

interface AppSyncEvent {
  arguments: { userId?: string };
  info: { fieldName: string };
  identity?: SAIdentity;
}

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;

  if (fieldName === "getPrimeBankAccount") {
    const userId = event.arguments.userId;
    if (!userId) {
      throw new Error("userId is required");
    }
    return await fetchAccount(userId);
  }

  if (fieldName === "myPrimeBankAccount") {
    const sub = event.identity?.sub;
    if (!sub) {
      throw new Error("Unauthenticated");
    }
    return await fetchAccount(sub);
  }

  throw new Error(`Unknown field: ${fieldName}`);
};

async function fetchAccount(userId: string) {
  const resp = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { userId: { S: userId } },
    }),
  );

  if (!resp.Item) {
    return null;
  }

  const i = resp.Item;

  return {
    userId: i.userId?.S ?? userId,
    role: i.role?.S ?? null,
    primeCoins: Number(i.primeCoins?.N ?? "0"),
    creatorCredits: Number(i.creatorCredits?.N ?? "0"),
    bankMeterProgress: Number(i.bankMeterProgress?.N ?? "0"),
    dailyCoinTotal: i.dailyCoinTotal?.N
      ? Number(i.dailyCoinTotal.N)
      : null,
    weeklyCoinTotal: i.weeklyCoinTotal?.N
      ? Number(i.weeklyCoinTotal.N)
      : null,
    lastDailyReset: i.lastDailyReset?.S ?? null,
    lastWeeklyReset: i.lastWeeklyReset?.S ?? null,
  };
}
