/**
 * Prime Bank Economy Types
 * Prime Coins + Creator Credits with Tier-Based Progression
 */

export enum UserTier {
  FREE = "FREE",
  BESTIE = "BESTIE",
  CREATOR = "CREATOR",
  COLLAB = "COLLAB",
  ADMIN = "ADMIN",
  PRIME = "PRIME",
}

export enum CreatorTierLevel {
  STARTER = "STARTER",
  PLUS = "PLUS",
  PRIME_PRO = "PRIME_PRO",
}

export enum CoinSource {
  DAILY_LOGIN = "dailyLogin",
  VIEW_CONTENT = "viewContent",
  CREATE_ITEM = "createItem",
  COLLAB_EARNINGS = "collabEarnings",
  REFERRAL = "referral",
  COMMUNITY_EVENT = "communityEvent",
  ADMIN_AWARD = "adminAward",
}

export interface PrimeCoinsConfig {
  // Daily caps by tier
  dailyCaps: {
    [UserTier.FREE]: number; // 10
    [UserTier.BESTIE]: number; // 15
    [UserTier.CREATOR]: number; // 25
  };

  // Weekly caps by tier
  weeklyCaps: {
    [UserTier.FREE]: number; // 60
    [UserTier.BESTIE]: number; // 90
    [UserTier.CREATOR]: number; // 150
  };

  // Source earning rates
  sourceRates: {
    [key in CoinSource]: number;
  };

  // Single award maximum
  singleAwardMax: number; // 1000 per award

  // Repeat offender enforcement
  repeatOffenderStrikes: number; // threshold for requiring manual review
  strikeResetDays: number; // days of clean submissions to reset strikes

  // Moderation rules
  minorsShadowModerationEnabled: boolean;
}

export interface CreatorCreditsMultipliers {
  [CreatorTierLevel.STARTER]: number; // 1.0x
  [CreatorTierLevel.PLUS]: number; // 1.5x
  [CreatorTierLevel.PRIME_PRO]: number; // 2.0x - 3.0x
}

export interface PrimeAccount {
  // User
  userId: string;
  tier: UserTier;
  accountCreatedAt: number;
  accountAge: number; // days since creation

  // Prime Coins
  totalPrimeCoins: number;
  dailyCoins: number; // coins earned today
  weeklyCoinTotal: number; // coins earned this week
  monthlyCoinTotal: number; // coins earned this month

  // Reset Timestamps
  lastResetDaily: number; // last midnight UTC reset
  lastResetWeekly: number; // last Monday UTC reset
  lastResetMonthly: number; // last 1st UTC reset

  // Creator Credentials (if creator)
  creatorTier?: CreatorTierLevel;
  creatorMultiplier?: number; // 1.0x | 1.5x | 2.0x-3.0x
  totalCreatorCredits?: number;

  // Offender Tracking
  repeatOffenderStrikes: number;
  lastCleanSubmissionDate?: number;

  // Last Updated
  lastUpdated: number;
}

export interface PrimeTransaction {
  transactionId: string;
  userId: string;
  amount: number;
  source: CoinSource;
  reason: string; // human-readable explanation
  metadata?: {
    [key: string]: any;
  };
  timestamp: number;

  // Validation fields (for audit)
  dailyCapSnapshot?: number;
  weeklyCapSnapshot?: number;
  monthlyCapSnapshot?: number;
  tierAtTime?: UserTier;
}

export interface AwardCoinsRequest {
  userId: string;
  amount: number;
  source: CoinSource;
  reason: string;
  metadata?: {
    collabId?: string;
    itemId?: string;
    [key: string]: any;
  };
}

export interface AwardCoinsResponse {
  ok: boolean;
  transactionId?: string;
  userId?: string;
  newBalance?: number;
  amountAwarded?: number;
  error?: string;
  capStatus?: {
    dailyRemaining: number;
    dailyReset: number;
    weeklyRemaining: number;
    weeklyReset: number;
    monthlyRemaining: number;
    monthlyReset: number;
  };
  strikeWarning?: {
    strikes: number;
    nextRequiresManualReview: boolean;
  };
}

export interface BankMeterCalculation {
  userId: string;
  progress: number; // 0-100
  breakdown: {
    component: string; // "coins_earned", "items_created", "tier_level", "account_age"
    value: number;
    weight: number; // 0-1
    label: string;
  }[];
  nextMilestone?: {
    progress: number;
    reward: string;
    daysUntil: number;
  };
  cachedAt?: number;
  cacheExpires?: number;
}

export interface EnforceCapResponse {
  userId: string;
  tier: UserTier;
  remainingDaily: number;
  remainingWeekly: number;
  remainingMonthly: number;
  resetTimestamps: {
    dailyReset: number;
    weeklyReset: number;
    monthlyReset: number;
  };
  canAward: boolean;
  reason?: string;
}

export interface CollaborativeEarnings {
  collabId: string;
  poolTotal: number;
  splits: {
    [userId: string]: {
      pct: number;
      earned: number;
    };
  };
  splitConfig: {
    prime_pct: number;
    creator_pct: number;
  };
  updated: number;
}

export interface CollaborativeEarningsResponse {
  ok: boolean;
  collabId?: string;
  individualEarnings?: {
    [userId: string]: number;
  };
  totalPoolEarnings?: number;
  nextSplitCalculation?: number;
  error?: string;
}
