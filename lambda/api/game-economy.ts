// lambda/api/game-economy.ts

import { AppSyncIdentityCognito } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

// Main app table (single-table design)
const TABLE_NAME = process.env.TABLE_NAME as string;

// Name of the Prime Bank award Lambda, passed from CDK
const AWARD_PRIME_COINS_FN_NAME =
  process.env.AWARD_PRIME_COINS_FN_NAME || "";

type SAIdentity =
  | (AppSyncIdentityCognito & { groups?: string[] | null })
  | null
  | undefined;

type AppSyncEvent = {
  arguments: any;
  info: { fieldName: string };
  identity?: SAIdentity;
};

const lambdaClient = new LambdaClient({});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function requireAuth(identity?: SAIdentity) {
  if (!identity?.sub) {
    throw new Error("Unauthenticated");
  }
}

function currentUserId(identity?: SAIdentity): string {
  requireAuth(identity);
  return identity!.sub!;
}

async function invokeAwardPrimeCoins(payload: any): Promise<any> {
  if (!AWARD_PRIME_COINS_FN_NAME) {
    throw new Error("Prime Bank not configured");
  }

  const resp = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: AWARD_PRIME_COINS_FN_NAME,
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(payload)),
    }),
  );

  const raw = resp.Payload
    ? Buffer.from(resp.Payload as Uint8Array).toString("utf-8")
    : "";

  if (!raw) {
    throw new Error("Prime Bank: empty response from awardPrimeCoins");
  }

  const body = JSON.parse(raw);

  if (body.error) {
    throw new Error(body.error);
  }

  return body;
}

// ─────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;
  const identity = event.identity;

  // ─────────────────────────────────────────────
  // 1) Game economy config (existing behavior)
  // ─────────────────────────────────────────────
  if (fieldName === "getGameEconomyConfig") {
    const res = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: "CONFIG#GAME_ECONOMY",
          sk: "CONFIG#GAME_ECONOMY",
        },
      }),
    );

    // simple default if no config saved yet
    return (
      (res.Item as any) || {
        id: "default-game-economy-config",
        dailyLoginCoins: 1,
      }
    );
  }

  if (fieldName === "updateGameEconomyConfig") {
    const input = event.arguments?.input ?? {};

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: "CONFIG#GAME_ECONOMY",
          sk: "CONFIG#GAME_ECONOMY",
          ...input,
          updatedAt: new Date().toISOString(),
        },
      }),
    );

    return input;
  }

  // ─────────────────────────────────────────────
  // 2) Prime Bank: getPrimeBankAccount
  // ─────────────────────────────────────────────
  if (fieldName === "getPrimeBankAccount") {
    const userId = currentUserId(identity);

    // If Prime Bank isn't wired yet, return an empty account shape.
    if (!AWARD_PRIME_COINS_FN_NAME) {
      return {
        userId,
        role: "FAN",
        primeCoins: 0,
        creatorCredits: 0,
        bankMeterProgress: 0,
        dailyCoinTotal: 0,
        weeklyCoinTotal: 0,
        lastDailyReset: null,
        lastWeeklyReset: null,
      };
    }

    const body = await invokeAwardPrimeCoins({
      action: "getAccount",
      userId,
    });

    // Expect awardPrimeCoins to return { account: {...} }
    return body.account ?? body;
  }

  // ─────────────────────────────────────────────
  // 3) Prime Bank: dailyLogin
  // ─────────────────────────────────────────────
  if (fieldName === "dailyLogin") {
    const userId = currentUserId(identity);

    if (!AWARD_PRIME_COINS_FN_NAME) {
      return {
        ok: false,
        reason: "Prime Bank not configured",
      };
    }

    const body = await invokeAwardPrimeCoins({
      action: "dailyLogin",
      userId,
    });

    // We just pass through whatever the awardPrimeCoins Lambda returns.
    return body;
  }

  throw new Error(`Unknown field ${fieldName}`);
};
