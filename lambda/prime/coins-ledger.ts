// lambda/prime/coins-ledger.ts

/**
 * Coins Ledger Lambda (Prime Studios)
 *
 * Purpose:
 *  - Track gig rewards, XP gains, and episode engagement payouts.
 *  - Designed to be called by internal workflows (Step Functions) or
 *    admin/studio tools – *not* directly by fans.
 *
 * Current behavior:
 *  - Validates the incoming event shape.
 *  - Emits a normalized ledger entry.
 *  - Does NOT persist anything yet (no DB writes).
 *
 * Future evolution:
 *  - Use TABLE_NAME / PK_NAME / SK_NAME env vars with DynamoDB single-table design.
 *  - Materialize running balances per user and/or per episode.
 */

export type CoinsEventType =
  | "GIG_REWARD"
  | "EPISODE_ENGAGEMENT"
  | "XP_ADJUSTMENT";

export interface CoinsLedgerEvent {
  userId: string;
  episodeId?: string;

  source: CoinsEventType;

  // Deltas can be positive or negative.
  coinsDelta?: number;
  xpDelta?: number;

  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface CoinsLedgerEntry {
  entryId: string;

  userId: string;
  episodeId?: string;

  source: CoinsEventType;
  coinsDelta: number;
  xpDelta: number;

  reason?: string;
  metadata?: Record<string, unknown>;

  createdAt: string;

  // Mocked running totals for now — real implementation would
  // look these up from DynamoDB and apply deltas.
  newCoinsBalance?: number;
  newXpTotal?: number;
}

function ensureNumber(val: unknown, fallback: number): number {
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export const handler = async (
  event: CoinsLedgerEvent,
): Promise<CoinsLedgerEntry> => {
  console.log("CoinsLedger incoming event:", JSON.stringify(event, null, 2));

  if (!event || !event.userId) {
    throw new Error("Missing required field: userId");
  }

  if (!event.source) {
    throw new Error("Missing required field: source");
  }

  const now = new Date().toISOString();
  const entryId = `ledger-${Math.random().toString(36).slice(2, 10)}`;

  const coinsDelta = ensureNumber(event.coinsDelta ?? 0, 0);
  const xpDelta = ensureNumber(event.xpDelta ?? 0, 0);

  const entry: CoinsLedgerEntry = {
    entryId,
    userId: event.userId,
    episodeId: event.episodeId,
    source: event.source,
    coinsDelta,
    xpDelta,
    reason: event.reason,
    metadata: event.metadata,
    createdAt: now,

    // These are intentionally mocked. Once you wire DynamoDB,
    // you can:
    //  - read the current balance
    //  - apply deltas
    //  - store & return the new balances.
    newCoinsBalance: coinsDelta, // placeholder
    newXpTotal: xpDelta, // placeholder
  };

  console.log("CoinsLedger normalized entry:", JSON.stringify(entry, null, 2));

  // 🔜 Future:
  //   - If TABLE_NAME is set, persist entry in DynamoDB.
  //   - You can key by pk = `USER#${userId}`, sk = `LEDGER#${timestamp}` etc.
  //
  // const tableName = process.env.TABLE_NAME;
  // if (tableName) { ... }

  return entry;
};
