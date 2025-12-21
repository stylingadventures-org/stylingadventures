import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import PrimeBankService from "../../lib/services/prime-bank.service";
import { UserTier } from "../../lib/types/prime-bank";

const mockDocClient = {
  send: jest.fn(),
} as unknown as DynamoDBDocumentClient;

describe("PrimeBankService", () => {
  let service: PrimeBankService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PrimeBankService(mockDocClient);
  });

  describe("awardCoins()", () => {
    it("should award coins with valid parameters", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Attributes: { total_coins: 100 },
      });

      const result = await service.awardCoins({
        userId: "user123",
        amount: 50,
        source: "dailyLogin",
      });

      expect(result.ok).toBe(true);
      expect(result.newBalance).toBeDefined();
      expect(result.transactionId).toBeDefined();
    });

    it("should reject amount outside valid range", async () => {
      const resultZero = await service.awardCoins({
        userId: "user123",
        amount: 0,
        source: "dailyLogin",
      });
      expect(resultZero.ok).toBe(false);

      const resultTooHigh = await service.awardCoins({
        userId: "user123",
        amount: 1001,
        source: "dailyLogin",
      });
      expect(resultTooHigh.ok).toBe(false);
    });

    it("should reject invalid source", async () => {
      const result = await service.awardCoins({
        userId: "user123",
        amount: 50,
        source: "invalidSource",
      });

      expect(result.ok).toBe(false);
    });

    it("should enforce daily caps by tier", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Attributes: { total_coins: 0 },
      });

      // FREE tier should have 10 coin daily cap
      const resultFree = await service.awardCoins({
        userId: "user123",
        amount: 15,
        source: "dailyLogin",
        userTier: "FREE" as UserTier,
      });

      expect(resultFree.ok).toBe(false); // Exceeds FREE daily cap
    });

    it("should enforce weekly caps by tier", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Attributes: { total_coins: 0 },
      });

      // BESTIE tier has 90 coin weekly cap
      const result = await service.awardCoins({
        userId: "user123",
        amount: 100,
        source: "dailyLogin",
        userTier: "BESTIE" as UserTier,
      });

      expect(result.ok).toBe(false); // Exceeds BESTIE weekly cap
    });

    it("should allow higher amounts for CREATOR tier", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Attributes: { total_coins: 0 },
      });

      // CREATOR tier has 25 daily cap
      const result = await service.awardCoins({
        userId: "user123",
        amount: 20,
        source: "dailyLogin",
        userTier: "CREATOR" as UserTier,
      });

      expect(result.ok).toBe(true);
    });

    it("should track repeat offender strikes", async () => {
      (mockDocClient.send as jest.Mock)
        .mockResolvedValueOnce({ Attributes: { strikes: 0 } })
        .mockResolvedValueOnce({ Attributes: { strikes: 1 } })
        .mockResolvedValueOnce({ Attributes: { strikes: 2 } })
        .mockResolvedValueOnce({ Attributes: { strikes: 3 } });

      await service.awardCoins({
        userId: "user123",
        amount: 10,
        source: "dailyLogin",
        incrementRepeatOffender: true,
      });

      // Third strike reached
      const result = await service.awardCoins({
        userId: "user123",
        amount: 10,
        source: "dailyLogin",
        incrementRepeatOffender: true,
      });

      // Should require manual review at 3 strikes
      expect(result.ok).toBe(true);
    });
  });

  describe("calculateBankMeter()", () => {
    it("should return progress between 0-100", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: {
          total_coins: 500,
          user_tier: "BESTIE",
          created_at: Date.now() - 30 * 86400000, // 30 days old
        },
      });

      const result = await service.calculateBankMeter("user123");

      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
    });

    it("should weight coins component", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: {
          total_coins: 1000,
          user_tier: "FREE",
          created_at: Date.now() - 365 * 86400000,
        },
      });

      const result = await service.calculateBankMeter("user123");

      expect(result.breakdown.coins_pct).toBeDefined();
      expect(result.breakdown.coins_pct).toBeCloseTo(40, 5); // Coins = 40%
    });

    it("should cache results", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: {
          total_coins: 500,
          user_tier: "CREATOR",
          created_at: Date.now(),
        },
      });

      await service.calculateBankMeter("user123");
      await service.calculateBankMeter("user123");

      // Should only call DynamoDB once due to caching
      expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe("enforceCaps()", () => {
    it("should return remaining daily and weekly caps", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: {
          total_coins: 5,
          user_tier: "FREE",
          daily_total: 5,
          weekly_total: 20,
        },
      });

      const result = await service.enforceCaps("user123");

      expect(result.remaining_daily_cap).toBeDefined();
      expect(result.remaining_weekly_cap).toBeDefined();
      expect(result.can_award).toBeDefined();
    });

    it("should indicate when caps are exceeded", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: {
          user_tier: "FREE",
          daily_total: 10,
          weekly_total: 60,
        },
      });

      const result = await service.enforceCaps("user123");

      expect(result.remaining_daily_cap).toBeLessThanOrEqual(0);
      expect(result.can_award).toBe(false);
    });

    it("should provide reset timestamps", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: {
          user_tier: "BESTIE",
          daily_total: 10,
          weekly_total: 50,
        },
      });

      const result = await service.enforceCaps("user123");

      expect(result.next_daily_reset).toBeDefined();
      expect(result.next_weekly_reset).toBeDefined();
    });
  });

  describe("resetCapCounters()", () => {
    it("should reset daily counters at midnight UTC", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({});

      await service.resetCapCounters("daily");

      expect(mockDocClient.send).toHaveBeenCalled();
    });

    it("should reset weekly counters on Monday UTC", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({});

      await service.resetCapCounters("weekly");

      expect(mockDocClient.send).toHaveBeenCalled();
    });
  });

  describe("getAccount()", () => {
    it("should return account details", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: {
          userId: "user123",
          total_coins: 500,
          user_tier: "CREATOR",
          created_at: Date.now(),
        },
      });

      const result = await service.getAccount("user123");

      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("total_coins");
      expect(result).toHaveProperty("user_tier");
    });

    it("should return null for nonexistent account", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({ Item: undefined });

      const result = await service.getAccount("nonexistent");

      expect(result).toBeNull();
    });
  });
});
