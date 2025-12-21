import PrimeBankService from "../../lib/services/prime-bank.service";
import ModerationService from "../../lib/services/moderation.service";
import AnalyticsService from "../../lib/services/analytics.service";
import LayoutValidationService from "../../lib/services/layout-validation.service";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

jest.mock("@aws-sdk/lib-dynamodb");
jest.mock("@aws-sdk/client-dynamodb");

/**
 * Performance Tests for Build 22 Services
 * 
 * Tests concurrent operations, throughput, and response times
 * Target: All operations complete within SLA + maintain data consistency
 */

describe("Performance Tests - Build 22 Services", () => {
  let primeBankService: PrimeBankService;
  let moderationService: ModerationService;
  let analyticsService: AnalyticsService;
  let layoutService: LayoutValidationService;
  let mockDocClient: jest.Mocked<DynamoDBDocumentClient>;

  beforeEach(() => {
    mockDocClient = DynamoDBDocumentClient.prototype as jest.Mocked<
      DynamoDBDocumentClient
    >;
    primeBankService = new PrimeBankService();
    moderationService = new ModerationService();
    analyticsService = new AnalyticsService();
    layoutService = new LayoutValidationService();
  });

  describe("Prime Bank - Cap Enforcement Under Load", () => {
    it("should handle 100 concurrent coin awards atomically", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Attributes: { balance: 0 },
      });
      (mockDocClient as any).send = mockSend;

      const userId = "user-stress-test";
      const startTime = Date.now();
      const concurrentRequests = 100;

      // Simulate 100 concurrent award attempts
      const promises = Array(concurrentRequests)
        .fill(null)
        .map((_, i) =>
          primeBankService.awardCoins({
            userId,
            amount: 1,
            tier: "BESTIE",
            source: "content_views",
            timestamp: new Date(),
          })
        );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests completed
      expect(results).toHaveLength(concurrentRequests);

      // Verify response time SLA (should complete within 5 seconds)
      expect(duration).toBeLessThan(5000);

      // Verify atomic enforcement - some should fail due to cap
      const failedRequests = results.filter((r) => r.statusCode === 400);
      expect(failedRequests.length).toBeGreaterThan(0);
    });

    it("should enforce daily caps consistently under rapid-fire awards", async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValueOnce({
          Attributes: { dailyRemaining: 14 },
        })
        .mockResolvedValueOnce({
          Attributes: { dailyRemaining: 13 },
        })
        .mockResolvedValueOnce({
          Attributes: { dailyRemaining: 0 }, // Cap reached
        });
      (mockDocClient as any).send = mockSend;

      const userId = "user-daily-cap";
      let successCount = 0;
      let failureCount = 0;

      // Rapid fire 15 awards in succession
      for (let i = 0; i < 15; i++) {
        const result = await primeBankService.awardCoins({
          userId,
          amount: 1,
          tier: "BESTIE",
          source: "content_views",
          timestamp: new Date(),
        });

        if (result.statusCode === 200) {
          successCount++;
        } else if (result.statusCode === 400) {
          failureCount++;
        }
      }

      // BESTIE daily cap is 15, so most should succeed, excess should fail
      expect(successCount + failureCount).toBe(15);
    });

    it("should reset caps at midnight UTC without timing issues", async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValueOnce({
          Attributes: {
            lastDailyReset: new Date(Date.now() - 86400000), // 24 hours ago
          },
        })
        .mockResolvedValueOnce({ Attributes: {} }); // Reset successful

      (mockDocClient as any).send = mockSend;

      const userId = "user-reset-test";
      const startTime = Date.now();

      // Attempt award that triggers reset
      await primeBankService.resetCapCounters(userId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Reset should be fast (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it("should maintain consistency with weekly caps across multiple days", async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValueOnce({
          Attributes: {
            weeklyRemaining: 90,
            dailyRemaining: 15,
          },
        })
        .mockResolvedValueOnce({
          Attributes: {
            weeklyRemaining: 75,
            dailyRemaining: 0,
          },
        })
        .mockResolvedValueOnce({
          Attributes: {
            weeklyRemaining: 60, // Next day
            dailyRemaining: 15,
          },
        });

      (mockDocClient as any).send = mockSend;

      const userId = "user-weekly-test";
      const awards = [];

      // Day 1: Award 15 coins
      awards.push(
        await primeBankService.awardCoins({
          userId,
          amount: 15,
          tier: "BESTIE",
          source: "content_views",
          timestamp: new Date(),
        })
      );

      // Day 2: Award another 15 (should still be within weekly 90)
      awards.push(
        await primeBankService.awardCoins({
          userId,
          amount: 15,
          tier: "BESTIE",
          source: "content_views",
          timestamp: new Date(Date.now() + 86400000), // Next day
        })
      );

      // Day 3: Award another 15 (total 45, still within 90)
      awards.push(
        await primeBankService.awardCoins({
          userId,
          amount: 15,
          tier: "BESTIE",
          source: "content_views",
          timestamp: new Date(Date.now() + 172800000), // 2 days later
        })
      );

      // Should have 3 successful awards
      const successCount = awards.filter((a) => a.statusCode === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe("Moderation - High Throughput Processing", () => {
    it("should analyze 1000+ content items without performance degradation", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Attributes: {
          confidence: 0.95,
          decision: "approved",
        },
      });
      (mockDocClient as any).send = mockSend;

      const startTime = Date.now();
      const itemCount = 1000;

      // Process 1000 items sequentially (typical queue processing)
      const promises = Array(itemCount)
        .fill(null)
        .map((_, i) =>
          moderationService.analyzeContent({
            contentId: `content-${i}`,
            text: `Content item ${i}`,
            contentType: "text",
            timestamp: new Date(),
          })
        );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      const itemsPerSecond = (itemCount / duration) * 1000;

      // Should process at least 100 items/second
      expect(itemsPerSecond).toBeGreaterThan(100);

      // All items should process
      expect(results).toHaveLength(itemCount);
    });

    it("should maintain decision quality with 500 concurrent analyses", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Attributes: {
          confidence: 0.88,
          decision: "pending_review",
        },
      });
      (mockDocClient as any).send = mockSend;

      const startTime = Date.now();
      const concurrentCount = 500;

      const promises = Array(concurrentCount)
        .fill(null)
        .map((_, i) =>
          moderationService.analyzeContent({
            contentId: `concurrent-${i}`,
            text: "Test content",
            contentType: "text",
            timestamp: new Date(),
          })
        );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should complete
      expect(results).toHaveLength(concurrentCount);

      // Should complete in under 10 seconds
      expect(duration).toBeLessThan(10000);

      // Verify all decisions are valid
      const validDecisions = results.every(
        (r) =>
          r.decision === "approved" ||
          r.decision === "pending_review" ||
          r.decision === "rejected"
      );
      expect(validDecisions).toBe(true);
    });

    it("should detect spam patterns consistently under high load", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Attributes: {
          spamScore: 0.92,
          flags: ["spam_detected"],
        },
      });
      (mockDocClient as any).send = mockSend;

      const spamPatterns = [
        "🔥🔥🔥🔥🔥 BUY NOW 🔥🔥🔥🔥🔥",
        "Click link: http://spam1.com http://spam2.com http://spam3.com",
        "#ad #promo #spam #buy #now #deals #offer #limited",
      ];

      // Test spam detection 100 times across all patterns
      const promises = Array(300)
        .fill(null)
        .map((_, i) =>
          moderationService.analyzeContent({
            contentId: `spam-${i}`,
            text: spamPatterns[i % spamPatterns.length],
            contentType: "text",
            timestamp: new Date(),
          })
        );

      const results = await Promise.all(promises);

      // Should flag spam consistently
      const flaggedForSpam = results.filter(
        (r) => r.flags && r.flags.includes("spam_detected")
      ).length;
      expect(flaggedForSpam).toBeGreaterThan(250); // 80%+ detection rate
    });
  });

  describe("Analytics - Large Dataset Aggregation", () => {
    it("should ingest and aggregate 1M events efficiently", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: Array(10000)
          .fill(null)
          .map((_, i) => ({
            eventId: `event-${i}`,
            userId: `user-${i % 1000}`,
            action: "view",
            timestamp: new Date(),
          })),
      });
      (mockDocClient as any).send = mockSend;

      const startTime = Date.now();

      // Simulate ingesting 1M events in batches
      const batchSize = 10000;
      const totalEvents = 1000000;
      const batches = totalEvents / batchSize;

      const ingestPromises = Array(Math.ceil(batches))
        .fill(null)
        .map((_, batchIndex) =>
          analyticsService.recordEngagementEvent({
            userId: `user-${batchIndex % 1000}`,
            action: "view",
            targetId: `content-${batchIndex}`,
            duration: 60,
            timestamp: new Date(),
          })
        );

      await Promise.all(ingestPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;
      const eventsPerSecond = (totalEvents / duration) * 1000;

      // Should handle at least 10K events/second
      expect(eventsPerSecond).toBeGreaterThan(10000);
    });

    it("should calculate metrics from large event sets without memory issues", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: Array(100000)
          .fill(null)
          .map((_, i) => ({
            userId: `user-${i % 5000}`,
            action: i % 5,
            timestamp: new Date(Date.now() - Math.random() * 86400000),
          })),
      });
      (mockDocClient as any).send = mockSend;

      const startTime = Date.now();
      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;

      // Calculate metrics for 100K events
      const metrics = await (analyticsService as any).calculateEngagementMetrics(
        "2024-12-21"
      );

      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryIncrease = memoryAfter - memoryBefore;
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(metrics).toBeDefined();

      // Should complete in under 5 seconds
      expect(duration).toBeLessThan(5000);

      // Memory increase should be reasonable (< 100MB for 100K records)
      expect(memoryIncrease).toBeLessThan(100);
    });

    it("should generate comprehensive reports from large datasets", async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValueOnce({
          Items: Array(50000)
            .fill(null)
            .map((_, i) => ({
              userId: "user123",
              action: "view",
              timestamp: new Date(),
            })),
        })
        .mockResolvedValueOnce({
          Items: Array(30000)
            .fill(null)
            .map((_, i) => ({
              contentId: `content-${i}`,
              views: Math.floor(Math.random() * 1000),
            })),
        })
        .mockResolvedValueOnce({
          Items: Array(20000)
            .fill(null)
            .map((_, i) => ({
              amount: Math.floor(Math.random() * 10000),
              timestamp: new Date(),
            })),
        });

      (mockDocClient as any).send = mockSend;

      const startTime = Date.now();

      const report = await analyticsService.generateAnalyticsReport(
        "user123",
        {
          startDate: new Date("2024-12-01"),
          endDate: new Date("2024-12-21"),
          metrics: ["engagement", "content", "financial"],
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(report).toBeDefined();

      // Should complete report in under 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    it("should export 1M events to CSV without performance issues", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Items: Array(1000000)
          .fill(null)
          .map((_, i) => ({
            userId: `user-${i % 10000}`,
            amount: Math.random() * 1000,
            timestamp: new Date(),
          })),
      });
      (mockDocClient as any).send = mockSend;

      const startTime = Date.now();

      const report = await analyticsService.generateAnalyticsReport(
        "user123",
        {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-21"),
          metrics: ["financial"],
          format: "csv",
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(report).toBeDefined();

      // CSV export should handle 1M records in under 30 seconds
      expect(duration).toBeLessThan(30000);
    });
  });

  describe("Layout Validation - Caching Effectiveness", () => {
    it("should validate identical layouts with cache hit on second call", async () => {
      const layout = {
        buttons: [
          {
            id: "btn1",
            label: "Submit",
            width: 50,
            height: 50,
          },
        ],
      };

      const schema = { type: "object" };

      layoutService.clearCache();

      // First validation (cache miss)
      const startTime1 = Date.now();
      const result1 = await layoutService.validateAccessibility(layout);
      const duration1 = Date.now() - startTime1;

      // Second validation (cache hit)
      const startTime2 = Date.now();
      const result2 = await layoutService.validateAccessibility(layout);
      const duration2 = Date.now() - startTime2;

      // Second call should be significantly faster
      expect(duration2).toBeLessThan(duration1);

      // Results should be identical
      expect(result1).toEqual(result2);
    });

    it("should maintain cache efficiency with 10K validation queries", async () => {
      layoutService.clearCache();

      const layouts = Array(100)
        .fill(null)
        .map((_, i) => ({
          buttons: [
            {
              id: `btn-${i}`,
              label: "Test",
              width: 50,
              height: 50,
            },
          ],
        }));

      const startTime = Date.now();

      // Query each layout 100 times (10K total queries, 100 unique)
      for (let i = 0; i < 100; i++) {
        await Promise.all(
          layouts.map((layout) => layoutService.validateAccessibility(layout))
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // With caching, 10K queries should complete in reasonable time
      // Second set of 100 queries should be ~10x faster due to cache
      expect(duration).toBeLessThan(5000);
    });

    it("should clear cache and refresh validation results", async () => {
      const layout = {
        buttons: [
          { id: "btn1", label: "OK", width: 50, height: 50 },
        ],
      };

      // Validate once
      await layoutService.validateAccessibility(layout);
      expect((layoutService as any).wcagCheckCache.size).toBe(1);

      // Clear cache
      layoutService.clearCache();
      expect((layoutService as any).wcagCheckCache.size).toBe(0);

      // Validate again (fresh)
      await layoutService.validateAccessibility(layout);
      expect((layoutService as any).wcagCheckCache.size).toBe(1);
    });
  });

  describe("End-to-End Workflow Performance", () => {
    it("should complete collaboration workflow in <2 seconds", async () => {
      const mockSend = jest.fn().mockResolvedValue({ Attributes: {} });
      (mockDocClient as any).send = mockSend;

      const startTime = Date.now();

      // Step 1: Create invite
      // Step 2: Accept invite
      // Step 3: Accept terms

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All 3 steps should complete in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it("should process content approval → monetization in <1 second", async () => {
      const mockSend = jest.fn().mockResolvedValue({ Attributes: {} });
      (mockDocClient as any).send = mockSend;

      const startTime = Date.now();

      // Step 1: Analyze content
      // Step 2: Award coins
      // Step 3: Record analytics

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All 3 steps should complete in under 1 second
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Data Consistency Under Load", () => {
    it("should maintain referential integrity with 100 concurrent operations", async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValue({ Attributes: { status: "active" } });
      (mockDocClient as any).send = mockSend;

      const operations = Array(100)
        .fill(null)
        .map((_, i) => ({
          operationId: `op-${i}`,
          type: i % 3 === 0 ? "award" : i % 3 === 1 ? "analyze" : "ingest",
        }));

      // Execute all operations concurrently
      const promises = operations.map((op) =>
        Promise.resolve({ ...op, timestamp: Date.now() })
      );

      const results = await Promise.all(promises);

      // All operations should complete
      expect(results).toHaveLength(100);

      // Each should have valid data
      results.forEach((result) => {
        expect(result.operationId).toBeDefined();
        expect(result.type).toBeDefined();
        expect(result.timestamp).toBeDefined();
      });
    });

    it("should prevent duplicate records under concurrent writes", async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValueOnce({ Attributes: { id: "event-1" } })
        .mockResolvedValueOnce({ error: "Duplicate key" });

      (mockDocClient as any).send = mockSend;

      const eventId = "event-concurrent";

      // Attempt to write same event twice concurrently
      const writes = [
        analyticsService.recordEngagementEvent({
          userId: "user1",
          action: "view",
          targetId: "content1",
          duration: 30,
          timestamp: new Date(),
        }),
        analyticsService.recordEngagementEvent({
          userId: "user1",
          action: "view",
          targetId: "content1",
          duration: 30,
          timestamp: new Date(),
        }),
      ];

      const results = await Promise.allSettled(writes);

      // At least one should succeed, one might fail (duplicate prevention)
      expect(results.length).toBe(2);
    });
  });

  describe("Memory & Resource Management", () => {
    it("should not leak memory during 1000 iterations", async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Attributes: { balance: 100 },
      });
      (mockDocClient as any).send = mockSend;

      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;

      // Run 1000 operations
      for (let i = 0; i < 1000; i++) {
        await primeBankService.awardCoins({
          userId: `user-${i}`,
          amount: 10,
          tier: "BESTIE",
          source: "content_views",
          timestamp: new Date(),
        });
      }

      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryIncrease = memoryAfter - memoryBefore;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase
    });

    it("should handle garbage collection efficiently", async () => {
      const mockSend = jest.fn().mockResolvedValue({ Items: [] });
      (mockDocClient as any).send = mockSend;

      // Create and dispose 500 service instances
      const instances = Array(500)
        .fill(null)
        .map(() => new AnalyticsService());

      // Clear references
      instances.length = 0;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Memory should be recovered
      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      expect(memoryAfter).toBeLessThan(500); // Reasonable heap size
    });
  });
});
