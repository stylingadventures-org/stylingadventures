/**
 * lambda/prime/magazine-resolver.test.ts
 * 
 * Integration tests for Prime Magazine resolver
 */

// Mock DynamoDB to avoid AWS SDK dynamic imports during tests
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

import { handler } from "./magazine-resolver";

describe("Prime Magazine Resolver", () => {
  const mockIdentity = {
    sub: "test-user",
    claims: {
      "cognito:groups": "PRIME",
    },
  };

  describe("currentPrimeMagazine", () => {
    it("should return null when no published issues", async () => {
      const event = {
        info: { fieldName: "currentPrimeMagazine" },
        identity: mockIdentity,
        arguments: {},
      };

      const result = await handler(event);
      expect(result).toBeNull();
    });
  });

  describe("primeMagazineArchive", () => {
    it("should return paginated magazine list", async () => {
      const event = {
        info: { fieldName: "primeMagazineArchive" },
        identity: mockIdentity,
        arguments: { limit: 10 },
      };

      const result = await handler(event);
      const paginated = result as any;
      expect(paginated).toHaveProperty("items");
      expect(paginated).toHaveProperty("nextToken");
      expect(Array.isArray(paginated.items)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const event = {
        info: { fieldName: "primeMagazineArchive" },
        identity: mockIdentity,
        arguments: { limit: 5 },
      };

      const result = await handler(event);
      const paginated = result as any;
      expect(paginated.items.length).toBeLessThanOrEqual(5);
    });
  });

  describe("primeMagazine", () => {
    it("should return null for non-existent issue", async () => {
      const event = {
        info: { fieldName: "primeMagazine" },
        identity: mockIdentity,
        arguments: { issueNumber: 999 },
      };

      const result = await handler(event);
      expect(result).toBeNull();
    });
  });

  describe("magazineArticles", () => {
    it("should return empty array for non-existent magazine", async () => {
      const event = {
        info: { fieldName: "magazineArticles" },
        identity: mockIdentity,
        arguments: { magazineId: "non-existent", category: "EDITORIAL" },
      };

      const result = await handler(event);
      const arr = result as any[];
      expect(Array.isArray(arr)).toBe(true);
    });
  });

  describe("adminCreateMagazineIssue", () => {
    it("should require ADMIN/PRIME tier", async () => {
      const event = {
        info: { fieldName: "adminCreateMagazineIssue" },
        identity: {
          sub: "user",
          claims: { "cognito:groups": "FREE" },
        },
        arguments: {
          issueNumber: 1,
          title: "Issue 1",
          theme: "Fashion",
          coverImageKey: "s3://key",
        },
      };

      try {
        await handler(event);
        fail("Should have thrown error");
        } catch (err: any) {
          expect(err.message).toMatch(/PRIME|ADMIN/i);
        }
    });

    it("should create magazine issue for ADMIN", async () => {
      const event = {
        info: { fieldName: "adminCreateMagazineIssue" },
        identity: mockIdentity,
        arguments: {
          issueNumber: 1,
          title: "Issue 1",
          theme: "Fashion",
          coverImageKey: "s3://covers/issue1.jpg",
        },
      };

      const result = await handler(event);
      const magazine = result as any;
      expect(magazine).toHaveProperty("id");
      expect(magazine.issueNumber).toBe(1);
      expect(magazine.title).toBe("Issue 1");
      expect(magazine.theme).toBe("Fashion");
      expect(magazine.status).toBe("DRAFT");
    });
  });

  describe("adminAddArticle", () => {
    it("should add article to magazine", async () => {
      const event = {
        info: { fieldName: "adminAddArticle" },
        identity: mockIdentity,
        arguments: {
          magazineId: "mag-001",
          title: "Fashion Trends",
          author: "StyleExpert",
          category: "EDITORIAL",
          content: "Long article content about fashion trends...",
        },
      };

      const result = await handler(event);
      const article = result as any;
      expect(article).toHaveProperty("id");
      expect(article.title).toBe("Fashion Trends");
      expect(article.author).toBe("StyleExpert");
      expect(article.category).toBe("EDITORIAL");
      expect(article).toHaveProperty("wordCount");
      expect(article).toHaveProperty("readTime");
    });
  });

  describe("auth", () => {
    it("should throw error when not PRIME tier", async () => {
      const event = {
        info: { fieldName: "currentPrimeMagazine" },
        identity: {
          sub: "user",
          claims: { "cognito:groups": "FREE" },
        },
        arguments: {},
      };

      try {
        await handler(event);
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).toMatch(/PRIME or ADMIN/i);
      }
    });
  });
});
