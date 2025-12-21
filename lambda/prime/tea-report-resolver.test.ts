/**
 * lambda/prime/tea-report-resolver.test.ts
 * 
 * Integration tests for Tea Report resolver
 */

// Prevent AWS SDK dynamic imports from running during tests by mocking DynamoDB client.
const _mockSend = async () => ({ Items: [], Count: 0, LastEvaluatedKey: null });
jest.mock("@aws-sdk/client-dynamodb", () => {
  class PutItemCommand {
    constructor(public args: any) {}
  }
  class GetItemCommand {
    constructor(public args: any) {}
  }
  class QueryCommand {
    constructor(public args: any) {}
  }
  return {
    DynamoDBClient: function () {
      return { send: _mockSend };
    },
    PutItemCommand,
    GetItemCommand,
    QueryCommand,
    __esModule: true,
  };
});

import { handler } from "./tea-report-resolver";

describe("Tea Report Resolver", () => {
  const mockIdentity = {
    sub: "test-user",
    claims: {
      "cognito:groups": "PRIME",
    },
  };

  describe("latestTeaReport", () => {
    it("should return null when no reports exist", async () => {
      const event = {
        info: { fieldName: "latestTeaReport" },
        identity: mockIdentity,
        arguments: {},
      };

      const result = await handler(event);
      expect(result).toBeNull();
    });
  });

  describe("teaReportHistory", () => {
    it("should return empty array with no pagination token initially", async () => {
      const event = {
        info: { fieldName: "teaReportHistory" },
        identity: mockIdentity,
        arguments: { limit: 10 },
      };

      const result = await handler(event);
      const paginated = result as any;
      expect(paginated).toHaveProperty("items");
      expect(paginated).toHaveProperty("nextToken");
      expect(Array.isArray(paginated.items)).toBe(true);
    });
  });

  describe("characterDrama", () => {
    it("should return empty array for unknown character", async () => {
      const event = {
        info: { fieldName: "characterDrama" },
        identity: mockIdentity,
        arguments: { characterName: "UnknownCharacter" },
      };

      const result = await handler(event);
      const drama = result as any[];
      expect(Array.isArray(drama)).toBe(true);
      expect(drama.length).toBe(0);
    });
  });

  describe("relationshipStatus", () => {
    it("should return null for unknown relationship", async () => {
      const event = {
        info: { fieldName: "relationshipStatus" },
        identity: mockIdentity,
        arguments: { character1: "Lala", character2: "Unknown" },
      };

      const result = await handler(event);
      expect(result).toBeNull();
    });
  });

  describe("adminGenerateTeaReport", () => {
    it("should require ADMIN/PRIME tier", async () => {
      const event = {
        info: { fieldName: "adminGenerateTeaReport" },
        identity: {
          sub: "user",
          claims: { "cognito:groups": "FREE" },
        },
        arguments: {
          period: "DAILY",
        },
      };

      try {
        await handler(event);
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).toMatch(/PRIME or ADMIN/i);
      }
    });

    it("should generate report for ADMIN", async () => {
      const event = {
        info: { fieldName: "adminGenerateTeaReport" },
        identity: mockIdentity,
        arguments: {
          period: "DAILY",
          sourceEpisodes: ["ep-001"],
        },
      };

      const result = await handler(event);
      const report = result as any;
      expect(report).toHaveProperty("id");
      expect(report).toHaveProperty("reportId");
      expect(report.period).toBe("DAILY");
      expect(Array.isArray(report.teaItems)).toBe(true);
      expect(Array.isArray(report.hotTakes)).toBe(true);
    });
  });

  describe("auth", () => {
    it("should throw error when not authenticated", async () => {
      const event = {
        info: { fieldName: "latestTeaReport" },
        identity: null,
        arguments: {},
      };

      try {
        await handler(event);
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).toMatch(/authenticated|PRIME/i);
      }
    });
  });
});
