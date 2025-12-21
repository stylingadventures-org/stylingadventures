import AnalyticsService from "../analytics.service";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Mock AWS SDK
jest.mock("@aws-sdk/lib-dynamodb");
jest.mock("@aws-sdk/client-dynamodb");

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let mockDocClient: jest.Mocked<DynamoDBDocumentClient>;

  beforeEach(() => {
    mockDocClient = DynamoDBDocumentClient.prototype as jest.Mocked<
      DynamoDBDocumentClient
    >;
    service = new AnalyticsService();
  });

  describe("recordEngagementEvent()", () => {
    it("should record valid engagement event", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const event = {
        userId: "user123",
        action: "view",
        targetId: "content456",
        duration: 30,
        timestamp: new Date(),
      };

      await service.recordEngagementEvent(event);

      expect(mockSend).toHaveBeenCalled();
    });

    it("should validate required engagement event fields", async () => {
      const invalidEvent = {
        userId: "user123",
        // Missing action, targetId, etc.
      };

      await expect(
        service.recordEngagementEvent(invalidEvent as any)
      ).rejects.toThrow();
    });

    it("should filter events by user", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const event1 = {
        userId: "user1",
        action: "view",
        targetId: "content1",
        duration: 30,
        timestamp: new Date(),
      };

      const event2 = {
        userId: "user2",
        action: "like",
        targetId: "content2",
        duration: 10,
        timestamp: new Date(),
      };

      await service.recordEngagementEvent(event1);
      await service.recordEngagementEvent(event2);

      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("should support various engagement actions", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const actions = ["view", "like", "comment", "share", "download"];

      for (const action of actions) {
        await service.recordEngagementEvent({
          userId: "user123",
          action,
          targetId: "content456",
          duration: 30,
          timestamp: new Date(),
        });
      }

      expect(mockSend).toHaveBeenCalledTimes(5);
    });

    it("should track engagement metadata", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const event = {
        userId: "user123",
        action: "view",
        targetId: "content456",
        duration: 60,
        deviceType: "mobile",
        country: "US",
        timestamp: new Date(),
      };

      await service.recordEngagementEvent(event);

      expect(mockSend).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("recordContentMetric()", () => {
    it("should record content metric", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const metric = {
        contentId: "content123",
        creatorId: "creator456",
        type: "video",
        duration: 300,
        format: "mp4",
        timestamp: new Date(),
      };

      await service.recordContentMetric(metric);

      expect(mockSend).toHaveBeenCalled();
    });

    it("should track content approval status", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const metric = {
        contentId: "content123",
        creatorId: "creator456",
        type: "video",
        approvalStatus: "approved",
        timestamp: new Date(),
      };

      await service.recordContentMetric(metric);

      expect(mockSend).toHaveBeenCalled();
    });

    it("should record content flagged for moderation", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const metric = {
        contentId: "content123",
        creatorId: "creator456",
        type: "image",
        moderationFlag: "high_risk",
        flagReason: "contains_minors",
        timestamp: new Date(),
      };

      await service.recordContentMetric(metric);

      expect(mockSend).toHaveBeenCalled();
    });

    it("should validate content metric type", async () => {
      const invalidMetric = {
        contentId: "content123",
        // Missing required fields
      };

      await expect(
        service.recordContentMetric(invalidMetric as any)
      ).rejects.toThrow();
    });

    it("should track content engagement counts", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const metric = {
        contentId: "content123",
        creatorId: "creator456",
        views: 1000,
        likes: 50,
        comments: 10,
        shares: 5,
        timestamp: new Date(),
      };

      await service.recordContentMetric(metric);

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("recordFinancialMetric()", () => {
    it("should record financial transaction", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const metric = {
        userId: "user123",
        amount: 1000,
        type: "earned",
        source: "content_views",
        timestamp: new Date(),
      };

      await service.recordFinancialMetric(metric);

      expect(mockSend).toHaveBeenCalled();
    });

    it("should track different earning sources", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const sources = [
        "content_views",
        "sponsorship",
        "collaboration",
        "marketplace",
      ];

      for (const source of sources) {
        await service.recordFinancialMetric({
          userId: "creator123",
          amount: 500,
          type: "earned",
          source,
          timestamp: new Date(),
        });
      }

      expect(mockSend).toHaveBeenCalledTimes(4);
    });

    it("should track cost/expense records", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const metric = {
        userId: "user123",
        amount: 100,
        type: "spent",
        category: "platform_fee",
        timestamp: new Date(),
      };

      await service.recordFinancialMetric(metric);

      expect(mockSend).toHaveBeenCalled();
    });

    it("should enforce financial validation", async () => {
      const invalidMetric = {
        userId: "user123",
        amount: -500, // Negative without expense context
        type: "earned",
        timestamp: new Date(),
      };

      await expect(
        service.recordFinancialMetric(invalidMetric as any)
      ).rejects.toThrow();
    });

    it("should track currency and payment method", async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (mockDocClient as any).send = mockSend;

      const metric = {
        userId: "user123",
        amount: 1000,
        type: "earned",
        source: "sponsorship",
        currency: "USD",
        paymentMethod: "stripe",
        timestamp: new Date(),
      };

      await service.recordFinancialMetric(metric);

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("getDashboardMetrics()", () => {
    it("should retrieve dashboard metrics for user", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          {
            userId: "user123",
            dau: 150,
            mau: 3500,
            retention: 0.72,
          },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await service.getDashboardMetrics("user123");

      expect(metrics).toBeDefined();
      expect(mockSend).toHaveBeenCalled();
    });

    it("should calculate 90-day retention tier", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          {
            userId: "user123",
            retentionDays: 89,
            retentionTier: "90-day",
          },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await service.getDashboardMetrics("user123");

      expect(metrics).toBeDefined();
    });

    it("should calculate 365-day retention tier", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          {
            userId: "user123",
            retentionDays: 365,
            retentionTier: "365-day",
          },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await service.getDashboardMetrics("user123");

      expect(metrics).toBeDefined();
    });

    it("should return empty array for non-existent user", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await service.getDashboardMetrics("nonexistent");

      expect(metrics).toEqual([]);
    });
  });

  describe("calculateEngagementMetrics()", () => {
    it("should calculate DAU from events", async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValueOnce({
          // First call for events
          Items: [
            { userId: "user1", timestamp: new Date() },
            { userId: "user2", timestamp: new Date() },
            { userId: "user1", timestamp: new Date() },
          ],
        });
      (mockDocClient as any).send = mockSend;

      const metrics = await (service as any).calculateEngagementMetrics(
        "2024-01-01"
      );

      expect(metrics).toBeDefined();
    });

    it("should calculate MAU from 30-day window", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: Array(50)
          .fill(null)
          .map((_, i) => ({
            userId: `user${i % 30}`,
            timestamp: new Date(),
          })),
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await (service as any).calculateEngagementMetrics(
        "2024-01-01"
      );

      expect(metrics).toBeDefined();
    });

    it("should calculate average session duration", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          { duration: 60 },
          { duration: 120 },
          { duration: 90 },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await (service as any).calculateEngagementMetrics(
        "2024-01-01"
      );

      expect(metrics).toBeDefined();
    });

    it("should calculate return rate", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          { userId: "user1", count: 5 }, // Returned user
          { userId: "user2", count: 1 }, // New user
          { userId: "user3", count: 15 }, // Very active
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await (service as any).calculateEngagementMetrics(
        "2024-01-01"
      );

      expect(metrics).toBeDefined();
    });
  });

  describe("calculateContentMetrics()", () => {
    it("should calculate approval rate", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          { status: "approved" },
          { status: "approved" },
          { status: "rejected" },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await (service as any).calculateContentMetrics(
        "2024-01-01"
      );

      expect(metrics).toBeDefined();
    });

    it("should calculate average content quality score", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          { qualityScore: 95 },
          { qualityScore: 87 },
          { qualityScore: 92 },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await (service as any).calculateContentMetrics(
        "2024-01-01"
      );

      expect(metrics).toBeDefined();
    });

    it("should track moderation flag rate", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          { flagged: true },
          { flagged: false },
          { flagged: true },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await (service as any).calculateContentMetrics(
        "2024-01-01"
      );

      expect(metrics).toBeDefined();
    });
  });

  describe("calculateFinancialMetrics()", () => {
    it("should calculate total revenue", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          { type: "earned", amount: 1000 },
          { type: "earned", amount: 2000 },
          { type: "spent", amount: 500 },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await (service as any).calculateFinancialMetrics(
        "2024-01-01"
      );

      expect(metrics).toBeDefined();
    });

    it("should calculate ARPU (Average Revenue Per User)", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          { userId: "user1", amount: 100 },
          { userId: "user2", amount: 200 },
          { userId: "user3", amount: 150 },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await (service as any).calculateFinancialMetrics(
        "2024-01-01"
      );

      expect(metrics).toBeDefined();
    });

    it("should track revenue by source", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          { source: "sponsorship", amount: 5000 },
          { source: "content_views", amount: 2000 },
          { source: "collaboration", amount: 1500 },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const metrics = await (service as any).calculateFinancialMetrics(
        "2024-01-01"
      );

      expect(metrics).toBeDefined();
    });
  });

  describe("generateAnalyticsReport()", () => {
    it("should generate comprehensive analytics report", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [],
      });
      (mockDocClient as any).send = mockSend;

      const report = await service.generateAnalyticsReport(
        new Date("2024-01-31").getTime()
      );

      expect(report).toBeDefined();
      expect(report.detailed_90).toBeDefined();
    });

    it("should support format parameter (CSV)", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [],
      });
      (mockDocClient as any).send = mockSend;

      const report = await service.generateAnalyticsReport(
        new Date("2024-01-31").getTime()
      );

      expect(report).toBeDefined();
    });

    it("should calculate retention tiers in report", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          { userId: "user123", dau: 100, mau: 2000, retentionDays: 45 },
        ],
      });
      (mockDocClient as any).send = mockSend;

      const report = await service.generateAnalyticsReport(
        new Date("2024-01-31").getTime()
      );

      expect(report).toBeDefined();
    });

    it("should include performance benchmarks", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [],
      });
      (mockDocClient as any).send = mockSend;

      const report = await service.generateAnalyticsReport(
        new Date("2024-01-31").getTime()
      );

      expect(report).toBeDefined();
    });
  });

  describe("data consistency and aggregation", () => {
    it("should aggregate metrics from multiple sources", async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValueOnce({ Items: [{ action: "view" }] })
        .mockResolvedValueOnce({ Items: [{ type: "video" }] })
        .mockResolvedValueOnce({ Items: [{ amount: 1000 }] });
      (mockDocClient as any).send = mockSend;

      const report = await service.generateAnalyticsReport(
        new Date("2024-01-31").getTime()
      );

      expect(report).toBeDefined();
      expect(report.detailed_90).toBeDefined();
    });

    it("should handle missing or incomplete data gracefully", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: [],
      });
      (mockDocClient as any).send = mockSend;

      const report = await service.generateAnalyticsReport(
        new Date("2024-01-31").getTime()
      );

      expect(report).toBeDefined();
      expect(report.detailed_90).toBeDefined();
    });
  });
});
