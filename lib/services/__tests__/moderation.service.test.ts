import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import ModerationService from "../moderation.service";

const mockDocClient = {
  send: jest.fn(),
} as unknown as DynamoDBDocumentClient;

describe("ModerationService", () => {
  let service: ModerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModerationService(mockDocClient);
  });

  describe("analyzeContent()", () => {
    it("should analyze text content", async () => {
      const result = await service.analyzeContent(
        "item123",
        "user456",
        {
          text: "This is clean content about styling",
        }
      );

      expect(result).toHaveProperty("text");
      expect(result.text).toHaveProperty("profanity_score");
      expect(result.text).toHaveProperty("spam_score");
    });

    it("should detect profanity in text", async () => {
      const result = await service.analyzeContent(
        "item123",
        "user456",
        {
          text: "This is inappropriate content with bad words",
        }
      );

      expect(result.text.profanity_score).toBeGreaterThan(0);
    });

    it("should detect spam patterns", async () => {
      const spamText =
        "🔥🔥🔥 CLICK HERE 👉👉👉 https://spam.com https://spam2.com #spam #spam #spam";
      const result = await service.analyzeContent(
        "item123",
        "user456",
        {
          text: spamText,
        }
      );

      expect(result.text.spam_score).toBeGreaterThan(0);
    });

    it("should validate text length", async () => {
      const longText = "a".repeat(5001);
      const result = await service.analyzeContent(
        "item123",
        "user456",
        {
          text: longText,
        }
      );

      expect(result.text.valid).toBe(false);
    });

    it("should analyze metadata", async () => {
      const result = await service.analyzeContent(
        "item123",
        "user456",
        {
          tags: ["styling", "fashion"],
          description: "A beautiful style guide",
        }
      );

      expect(result.metadata).toBeDefined();
      expect(result.metadata.valid).toBe(true);
    });

    it("should flag restricted tags", async () => {
      const result = await service.analyzeContent(
        "item123",
        "user456",
        {
          tags: ["adult", "explicit"],
          description: "test",
        }
      );

      expect(result.metadata.has_restricted_tags).toBe(true);
    });

    it("should detect minors risk in content", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: { minors_risk: true },
      });

      const result = await service.analyzeContent(
        "item123",
        "user456",
        {
          text: "Content involving young people",
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe("makeModerationDecision()", () => {
    it("should auto-reject high confidence explicit content", async () => {
      const analysis = {
        text: { profanity_score: 0.98, spam_score: 0.1, valid: true },
        metadata: { has_restricted_tags: false, valid: true },
        image: { explicit_confidence: 0.96, suggestive_confidence: 0.1 },
        overall_confidence: 0.96,
      };

      const decision = await service.makeModerationDecision(
        "item123",
        "user456",
        analysis as any
      );

      expect(decision.status).toBe("REJECTED");
      expect(decision.reason).toContain("explicit");
    });

    it("should route to human review for 85% confidence", async () => {
      const analysis = {
        text: { profanity_score: 0.5, spam_score: 0.3, valid: true },
        metadata: { has_restricted_tags: false, valid: true },
        image: { explicit_confidence: 0.87, suggestive_confidence: 0.1 },
        overall_confidence: 0.87,
      };

      const decision = await service.makeModerationDecision(
        "item123",
        "user456",
        analysis as any
      );

      expect(decision.status).toBe("PENDING_HUMAN_REVIEW");
    });

    it("should auto-approve low confidence content", async () => {
      const analysis = {
        text: { profanity_score: 0.1, spam_score: 0.05, valid: true },
        metadata: { has_restricted_tags: false, valid: true },
        image: { explicit_confidence: 0.3, suggestive_confidence: 0.2 },
        overall_confidence: 0.3,
      };

      const decision = await service.makeModerationDecision(
        "item123",
        "user456",
        analysis as any
      );

      expect(decision.status).toBe("APPROVED");
    });

    it("should shadow moderate minors + sexual content", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: { minors_risk: true },
      });

      const analysis = {
        text: { profanity_score: 0.6, spam_score: 0.1, valid: true },
        metadata: { has_restricted_tags: true, valid: true },
        image: { explicit_confidence: 0.7, suggestive_confidence: 0.8 },
        overall_confidence: 0.75,
        minors_risk: true,
      };

      const decision = await service.makeModerationDecision(
        "item123",
        "user456",
        analysis as any
      );

      expect(decision.status).toBe("REJECTED");
      expect(decision.shadow_moderation).toBe(true);
    });

    it("should track repeat offender strikes", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: { strike_count: 2 },
      });

      const analysis = {
        text: { profanity_score: 0.96, spam_score: 0.1, valid: true },
        metadata: { has_restricted_tags: false, valid: true },
        image: { explicit_confidence: 0.1, suggestive_confidence: 0.1 },
        overall_confidence: 0.96,
      };

      await service.makeModerationDecision(
        "item123",
        "user456",
        analysis as any
      );

      expect(mockDocClient.send).toHaveBeenCalled();
    });

    it("should require manual review at 3 strikes", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Item: { strike_count: 3 },
      });

      const analysis = {
        text: { profanity_score: 0.5, spam_score: 0.2, valid: true },
        metadata: { has_restricted_tags: false, valid: true },
        image: { explicit_confidence: 0.4, suggestive_confidence: 0.3 },
        overall_confidence: 0.45,
      };

      const decision = await service.makeModerationDecision(
        "item123",
        "user456",
        analysis as any
      );

      // Should route to human review despite low confidence
      expect(decision.status).toBe("PENDING_HUMAN_REVIEW");
    });
  });

  describe("getRepeatOffenderStatus()", () => {
    it("should return strike count", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Items: [{ status: "REJECTED" }, { status: "REJECTED" }],
      });

      const status = await service.getRepeatOffenderStatus("user456");

      expect(status).toHaveProperty("strike_count");
      expect(status.strike_count).toBe(2);
    });

    it("should indicate if user is repeat offender", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Items: [
          { status: "REJECTED" },
          { status: "REJECTED" },
          { status: "REJECTED" },
        ],
      });

      const status = await service.getRepeatOffenderStatus("user456");

      expect(status.is_repeat_offender).toBe(true);
    });

    it("should reset after 90 days of clean record", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({
        Items: [
          { status: "REJECTED", timestamp: Date.now() - 100 * 86400000 },
        ],
      });

      const status = await service.getRepeatOffenderStatus("user456");

      expect(status.strike_count).toBe(0);
    });
  });

  describe("calculateSpamScore()", () => {
    it("should detect emoji spam", () => {
      const spamText = "🔥🔥🔥🔥🔥";
      const score = (service as any).calculateSpamScore(spamText);

      expect(score).toBeGreaterThan(0.5);
    });

    it("should detect repeated characters", () => {
      const spamText = "hellloooooo";
      const score = (service as any).calculateSpamScore(spamText);

      expect(score).toBeGreaterThan(0);
    });

    it("should detect multiple links", () => {
      const spamText =
        "Check this https://link1.com and https://link2.com and https://link3.com";
      const score = (service as any).calculateSpamScore(spamText);

      expect(score).toBeGreaterThan(0.3);
    });

    it("should detect excessive hashtags", () => {
      const spamText = "#spam #spam #spam #spam #spam";
      const score = (service as any).calculateSpamScore(spamText);

      expect(score).toBeGreaterThan(0.3);
    });
  });
});
