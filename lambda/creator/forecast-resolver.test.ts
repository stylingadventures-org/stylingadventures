/**
 * lambda/creator/forecast-resolver.test.ts
 * 
 * Integration tests for Creator Forecast resolver
 */

// Mock DynamoDB to avoid dynamic import issues during tests
const _mockSend = async () => ({ Items: [], Count: 0, LastEvaluatedKey: null });
jest.mock("@aws-sdk/client-dynamodb", () => {
  class PutItemCommand { constructor(public args: any) {} }
  class GetItemCommand { constructor(public args: any) {} }
  class QueryCommand { constructor(public args: any) {} }
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

import { handler } from "./forecast-resolver";

describe("Creator Forecast Resolver", () => {
  const mockCreatorIdentity = {
    sub: "creator-user",
    claims: {
      "cognito:groups": "CREATOR",
    },
  };

  const mockAdminIdentity = {
    sub: "admin-user",
    claims: {
      "cognito:groups": "ADMIN",
    },
  };

  describe("creatorLatestForecast", () => {
    it("should return null when no forecasts exist", async () => {
      const event = {
        info: { fieldName: "creatorLatestForecast" },
        identity: mockCreatorIdentity,
        arguments: { creatorId: "creator-001" },
      };

      const result = await handler(event);
      expect(result).toBeNull();
    });
  });

  describe("creatorForecastHistory", () => {
    it("should return paginated forecast history", async () => {
      const event = {
        info: { fieldName: "creatorForecastHistory" },
        identity: mockCreatorIdentity,
        arguments: { creatorId: "creator-001", limit: 10 },
      };

      const result = await handler(event);
      const paginated = result as any;
      expect(paginated).toHaveProperty("items");
      expect(paginated).toHaveProperty("nextToken");
      expect(Array.isArray(paginated.items)).toBe(true);
    });
  });

  describe("creatorReport", () => {
    it("should return creator report with analytics", async () => {
      const event = {
        info: { fieldName: "creatorReport" },
        identity: mockCreatorIdentity,
        arguments: { creatorId: "creator-001" },
      };

      const result = await handler(event);
      const report = result as any;
      expect(report).toHaveProperty("id");
      expect(report).toHaveProperty("creatorId");
      expect(report).toHaveProperty("analyticsSnapshot");
      expect(report).toHaveProperty("forecasts");
      expect(report).toHaveProperty("recommendations");
    });
  });

  describe("platformTrendPredictions", () => {
    it("should return platform trends", async () => {
      const event = {
        info: { fieldName: "platformTrendPredictions" },
        identity: mockCreatorIdentity,
        arguments: {},
      };

      const result = await handler(event);
      const arr = result as any[];
      expect(Array.isArray(arr)).toBe(true);
      if (arr.length > 0) {
        expect(arr[0]).toHaveProperty("trendName");
        expect(arr[0]).toHaveProperty("probability");
      }
    });
  });

  describe("creatorGrowthRecommendations", () => {
    it("should return growth recommendations", async () => {
      const event = {
        info: { fieldName: "creatorGrowthRecommendations" },
        identity: mockCreatorIdentity,
        arguments: { creatorId: "creator-001" },
      };

      const result = await handler(event);
      const arr = result as any[];
      expect(Array.isArray(arr)).toBe(true);
      if (arr.length > 0) {
        expect(arr[0]).toHaveProperty("title");
        expect(arr[0]).toHaveProperty("priority");
      }
    });
  });

  describe("adminGenerateCreatorForecast", () => {
    it("should require ADMIN tier", async () => {
      const event = {
        info: { fieldName: "adminGenerateCreatorForecast" },
        identity: mockCreatorIdentity,
        arguments: {
          creatorId: "creator-001",
          forecastPeriod: "MONTHLY",
        },
      };

      try {
        await handler(event);
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).toMatch(/ADMIN required/i);
      }
    });

    it("should generate forecast for ADMIN", async () => {
      const event = {
        info: { fieldName: "adminGenerateCreatorForecast" },
        identity: mockAdminIdentity,
        arguments: {
          creatorId: "creator-001",
          forecastPeriod: "MONTHLY",
        },
      };

      const result = await handler(event);
      const forecast = result as any;
      expect(forecast).toHaveProperty("id");
      expect(forecast).toHaveProperty("creatorId");
      expect(forecast.forecastPeriod).toBe("MONTHLY");
      expect(forecast).toHaveProperty("growthPrediction");
      expect(forecast).toHaveProperty("audienceSentiment");
      expect(forecast).toHaveProperty("riskFactors");
      expect(forecast).toHaveProperty("opportunities");
    });
  });

  describe("auth", () => {
    it("should require Creator or higher tier", async () => {
      const event = {
        info: { fieldName: "creatorLatestForecast" },
        identity: {
          sub: "user",
          claims: { "cognito:groups": "FREE" },
        },
        arguments: { creatorId: "creator-001" },
      };

      try {
        await handler(event);
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).toMatch(/Creator tier required/i);
      }
    });
  });
});
