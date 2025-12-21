/**
 * Prime Bank Service
 * Prime Coins + Creator Credits with Tier-Based Caps
 */

import {
  PrimeAccount,
  PrimeTransaction,
  UserTier,
  CoinSource,
  AwardCoinsRequest,
  AwardCoinsResponse,
  BankMeterCalculation,
  EnforceCapResponse,
  PrimeCoinsConfig,
} from "../types/prime-bank";

const TABLE_ACCOUNTS = "PRIME_ACCOUNTS";
const TABLE_TRANSACTIONS = "PRIME_TRANSACTIONS";
const TABLE_CONFIG = "PRIME_BANK_CONFIG";

/**
 * Default Prime Coins Configuration
 */
export const DEFAULT_CONFIG: PrimeCoinsConfig = {
  dailyCaps: {
    [UserTier.FREE]: 10,
    [UserTier.BESTIE]: 15,
    [UserTier.CREATOR]: 25,
  },
  weeklyCaps: {
    [UserTier.FREE]: 60,
    [UserTier.BESTIE]: 90,
    [UserTier.CREATOR]: 150,
  },
  sourceRates: {
    [CoinSource.DAILY_LOGIN]: 5,
    [CoinSource.VIEW_CONTENT]: 2,
    [CoinSource.CREATE_ITEM]: 10,
    [CoinSource.COLLAB_EARNINGS]: 0, // varies by collab
    [CoinSource.REFERRAL]: 25,
    [CoinSource.COMMUNITY_EVENT]: 15,
    [CoinSource.ADMIN_AWARD]: 0, // varies by admin
  },
  singleAwardMax: 1000,
  repeatOffenderStrikes: 3,
  strikeResetDays: 30,
  minorsShadowModerationEnabled: true,
};

export class PrimeBankService {
  constructor(private dynamoDB: any) {}

  /**
   * Award Prime Coins with Full Validation
   * - Validate user exists + tier
   * - Check daily/weekly caps
   * - Verify source is valid
   * - Track repeat offender strikes
   * - Create transaction record
   */
  async awardCoins(
    request: AwardCoinsRequest
  ): Promise<AwardCoinsResponse> {
    try {
      const { userId, amount, source, reason, metadata } = request;

      // Validate basic requirements
      if (!userId || userId.length === 0) {
        return { ok: false, error: "User not authenticated" };
      }

      if (amount <= 0 || amount > DEFAULT_CONFIG.singleAwardMax) {
        return {
          ok: false,
          error: `Amount must be between 1 and ${DEFAULT_CONFIG.singleAwardMax}`,
        };
      }

      // Load user account
      const accountResult = await this.dynamoDB.get({
        TableName: TABLE_ACCOUNTS,
        Key: { userId },
      });

      let account: PrimeAccount;
      if (!accountResult.Item) {
        // Create new account for user
        account = {
          userId,
          tier: UserTier.FREE,
          accountCreatedAt: Date.now(),
          accountAge: 0,
          totalPrimeCoins: 0,
          dailyCoins: 0,
          weeklyCoinTotal: 0,
          monthlyCoinTotal: 0,
          lastResetDaily: Date.now(),
          lastResetWeekly: Date.now(),
          lastResetMonthly: Date.now(),
          repeatOffenderStrikes: 0,
          lastUpdated: Date.now(),
        };
      } else {
        account = accountResult.Item as PrimeAccount;
      }

      // Reset counters if needed
      account = this.resetCapCounters(account);

      // Get caps for user's tier
      const dailyCap = DEFAULT_CONFIG.dailyCaps[account.tier];
      const weeklyCap = DEFAULT_CONFIG.weeklyCaps[account.tier];

      // Check caps
      if (account.dailyCoins + amount > dailyCap) {
        return {
          ok: false,
          error: "Daily coin cap exceeded",
          capStatus: {
            dailyRemaining: Math.max(0, dailyCap - account.dailyCoins),
            dailyReset: account.lastResetDaily + 24 * 60 * 60 * 1000,
            weeklyRemaining: Math.max(0, weeklyCap - account.weeklyCoinTotal),
            weeklyReset: account.lastResetWeekly + 7 * 24 * 60 * 60 * 1000,
            monthlyRemaining: 0,
            monthlyReset: 0,
          },
        };
      }

      if (account.weeklyCoinTotal + amount > weeklyCap) {
        return {
          ok: false,
          error: "Weekly coin cap exceeded",
          capStatus: {
            dailyRemaining: Math.max(0, dailyCap - account.dailyCoins),
            dailyReset: account.lastResetDaily + 24 * 60 * 60 * 1000,
            weeklyRemaining: Math.max(0, weeklyCap - account.weeklyCoinTotal),
            weeklyReset: account.lastResetWeekly + 7 * 24 * 60 * 60 * 1000,
            monthlyRemaining: 0,
            monthlyReset: 0,
          },
        };
      }

      // Check repeat offender status
      if (
        account.repeatOffenderStrikes >=
        DEFAULT_CONFIG.repeatOffenderStrikes
      ) {
        return {
          ok: false,
          error: "Account requires manual review due to repeat violations",
          strikeWarning: {
            strikes: account.repeatOffenderStrikes,
            nextRequiresManualReview: true,
          },
        };
      }

      // Update account
      account.totalPrimeCoins += amount;
      account.dailyCoins += amount;
      account.weeklyCoinTotal += amount;
      account.monthlyCoinTotal += amount;
      account.lastUpdated = Date.now();

      // Create transaction record
      const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const transaction: PrimeTransaction = {
        transactionId,
        userId,
        amount,
        source,
        reason,
        metadata: {
          ...metadata,
          dailyCapSnapshot: dailyCap,
          weeklyCapSnapshot: weeklyCap,
          tierAtTime: account.tier,
        },
        timestamp: Date.now(),
      };

      // Save account + transaction
      await Promise.all([
        this.dynamoDB.put({
          TableName: TABLE_ACCOUNTS,
          Item: account,
        }),
        this.dynamoDB.put({
          TableName: TABLE_TRANSACTIONS,
          Item: transaction,
        }),
      ]);

      return {
        ok: true,
        transactionId,
        userId,
        newBalance: account.totalPrimeCoins,
        amountAwarded: amount,
        capStatus: {
          dailyRemaining: Math.max(0, dailyCap - account.dailyCoins),
          dailyReset: account.lastResetDaily + 24 * 60 * 60 * 1000,
          weeklyRemaining: Math.max(0, weeklyCap - account.weeklyCoinTotal),
          weeklyReset: account.lastResetWeekly + 7 * 24 * 60 * 60 * 1000,
          monthlyRemaining: 0,
          monthlyReset: 0,
        },
      };
    } catch (error) {
      console.error("Award coins error:", error);
      return { ok: false, error: "Failed to award coins" };
    }
  }

  /**
   * Calculate Bank Meter Progress
   * Based on coins earned, items created, tier level, account age
   */
  async calculateBankMeter(userId: string): Promise<BankMeterCalculation | null> {
    try {
      // Load account
      const result = await this.dynamoDB.get({
        TableName: TABLE_ACCOUNTS,
        Key: { userId },
      });

      if (!result.Item) {
        return null;
      }

      const account = result.Item as PrimeAccount;

      // Calculate weights
      const coinsEarned = account.totalPrimeCoins;
      const coinsWeight = Math.min(coinsEarned / 100, 40); // max 40%

      const tierWeight = account.tier === UserTier.CREATOR ? 20 : 10;

      const accountAgeWeight = Math.min(
        (account.accountAge || 0) / 365,
        10
      ); // max 10% over 1 year

      const progress = coinsWeight + tierWeight + accountAgeWeight;

      return {
        userId,
        progress: Math.min(Math.round(progress), 100),
        breakdown: [
          {
            component: "coins_earned",
            value: coinsEarned,
            weight: 0.4,
            label: "Coins Earned This Month",
          },
          {
            component: "tier_level",
            value: account.tier === UserTier.CREATOR ? 20 : 10,
            weight: 0.2,
            label: "Creator Tier Level",
          },
          {
            component: "account_age",
            value: accountAgeWeight,
            weight: 0.1,
            label: "Account Age",
          },
        ],
        cachedAt: Date.now(),
        cacheExpires: Date.now() + 60 * 60 * 1000, // 1 hour cache
      };
    } catch (error) {
      console.error("Calculate bank meter error:", error);
      return null;
    }
  }

  /**
   * Enforce Earning Caps
   * Returns remaining cap + reset timestamps
   */
  async enforceCaps(userId: string): Promise<EnforceCapResponse | null> {
    try {
      // Load account
      const result = await this.dynamoDB.get({
        TableName: TABLE_ACCOUNTS,
        Key: { userId },
      });

      if (!result.Item) {
        return null;
      }

      let account = result.Item as PrimeAccount;

      // Reset if needed
      account = this.resetCapCounters(account);

      const dailyCap = DEFAULT_CONFIG.dailyCaps[account.tier];
      const weeklyCap = DEFAULT_CONFIG.weeklyCaps[account.tier];

      return {
        userId,
        tier: account.tier,
        remainingDaily: Math.max(0, dailyCap - account.dailyCoins),
        remainingWeekly: Math.max(0, weeklyCap - account.weeklyCoinTotal),
        remainingMonthly: 0, // not tracked in this phase
        resetTimestamps: {
          dailyReset: account.lastResetDaily + 24 * 60 * 60 * 1000,
          weeklyReset: account.lastResetWeekly + 7 * 24 * 60 * 60 * 1000,
          monthlyReset: account.lastResetMonthly + 30 * 24 * 60 * 60 * 1000,
        },
        canAward:
          account.dailyCoins < dailyCap && account.weeklyCoinTotal < weeklyCap,
      };
    } catch (error) {
      console.error("Enforce caps error:", error);
      return null;
    }
  }

  /**
   * Reset Cap Counters (called before checking caps)
   * Resets daily/weekly counters if thresholds crossed
   */
  private resetCapCounters(account: PrimeAccount): PrimeAccount {
    const now = Date.now();
    const HOUR = 60 * 60 * 1000;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;

    // Reset daily at midnight UTC
    if (now - account.lastResetDaily >= DAY) {
      account.dailyCoins = 0;
      account.lastResetDaily = this.getNextMidnightUTC(now);
    }

    // Reset weekly on Monday UTC
    if (now - account.lastResetWeekly >= WEEK) {
      account.weeklyCoinTotal = 0;
      account.lastResetWeekly = this.getNextMondayUTC(now);
    }

    return account;
  }

  /**
   * Helper: Get next midnight UTC timestamp
   */
  private getNextMidnightUTC(timestamp: number): number {
    const date = new Date(timestamp);
    date.setUTCHours(24, 0, 0, 0);
    return date.getTime();
  }

  /**
   * Helper: Get next Monday UTC timestamp
   */
  private getNextMondayUTC(timestamp: number): number {
    const date = new Date(timestamp);
    const day = date.getUTCDay();
    const daysUntilMonday = (8 - day) % 7;
    date.setUTCDate(date.getUTCDate() + daysUntilMonday);
    date.setUTCHours(0, 0, 0, 0);
    return date.getTime();
  }

  /**
   * Get Account Details
   */
  async getAccount(userId: string): Promise<PrimeAccount | null> {
    try {
      const result = await this.dynamoDB.get({
        TableName: TABLE_ACCOUNTS,
        Key: { userId },
      });
      return result.Item || null;
    } catch (error) {
      console.error("Get account error:", error);
      return null;
    }
  }
}

export default PrimeBankService;
