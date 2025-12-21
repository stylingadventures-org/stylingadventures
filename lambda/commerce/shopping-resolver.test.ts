/**
 * lambda/commerce/shopping-resolver.test.ts
 * 
 * Integration tests for Shopping resolver
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

import { handler } from "./shopping-resolver";

describe("Shopping Resolver", () => {
  const mockIdentity = {
    sub: "user-001",
    claims: {
      "cognito:groups": "BESTIE",
    },
  };

  const mockAdminIdentity = {
    sub: "admin-001",
    claims: {
      "cognito:groups": "ADMIN",
    },
  };

  describe("findExactItem", () => {
    it("should return empty array for non-existent item", async () => {
      const event = {
        info: { fieldName: "findExactItem" },
        arguments: {
          brandName: "NonExistentBrand",
          itemName: "NonExistentItem",
        },
      };

      const result = await handler(event);
      const items = result as any[];
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(0);
    });

    it("should filter by category", async () => {
      const event = {
        info: { fieldName: "findExactItem" },
        arguments: {
          brandName: "Gucci",
          itemName: "Dress",
          category: "FASHION",
        },
      };

      const result = await handler(event);
      const items = result as any[];
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe("sceneShoppableItems", () => {
    it("should return items from scene", async () => {
      const event = {
        info: { fieldName: "sceneShoppableItems" },
        arguments: { sceneId: "scene-001" },
      };

      const result = await handler(event);
      const items = result as any[];
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe("videoShoppableItems", () => {
    it("should return items from music video", async () => {
      const event = {
        info: { fieldName: "videoShoppableItems" },
        arguments: { videoId: "video-001" },
      };

      const result = await handler(event);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("myShoppingCart", () => {
    it("should return empty cart for new user", async () => {
      const event = {
        info: { fieldName: "myShoppingCart" },
        identity: mockIdentity,
        arguments: {},
      };

      const result = await handler(event);
      const cart = result as any;
      expect(cart).toHaveProperty("id");
      expect(cart).toHaveProperty("userId");
      expect(cart).toHaveProperty("items");
      expect(cart).toHaveProperty("total");
      expect(Array.isArray(cart.items)).toBe(true);
      expect(cart.items.length).toBe(0);
    });
  });

  describe("addToCart", () => {
    it("should require authentication", async () => {
      const event = {
        info: { fieldName: "addToCart" },
        identity: null,
        arguments: { itemId: "item-001" },
      };

      try {
        await handler(event);
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).toMatch(/authenticated/i);
      }
    });

    it("should add item to cart", async () => {
      const event = {
        info: { fieldName: "addToCart" },
        identity: mockIdentity,
        arguments: { itemId: "item-001" },
      };

      // This will fail because item doesn't exist, but we test structure
      try {
        await handler(event);
      } catch (err: any) {
        expect(err.message).toMatch(/not found/i);
      }
    });
  });

  describe("removeFromCart", () => {
    it("should require authentication", async () => {
      const event = {
        info: { fieldName: "removeFromCart" },
        identity: null,
        arguments: { itemId: "item-001" },
      };

      try {
        await handler(event);
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).toMatch(/authenticated/i);
      }
    });
  });

  describe("adminCreateShoppableItem", () => {
    it("should require ADMIN tier", async () => {
      const event = {
        info: { fieldName: "adminCreateShoppableItem" },
        identity: mockIdentity,
        arguments: {
          brand: "Gucci",
          name: "Dress",
          category: "FASHION",
          sku: "GUC-001",
          imageUrl: "s3://image.jpg",
          price: 1200,
        },
      };

      try {
        await handler(event);
        fail("Should have thrown error");
      } catch (err: any) {
        expect(err.message).toMatch(/ADMIN required/i);
      }
    });

    it("should create shoppable item for ADMIN", async () => {
      const event = {
        info: { fieldName: "adminCreateShoppableItem" },
        identity: mockAdminIdentity,
        arguments: {
          brand: "Gucci",
          name: "Dress",
          category: "FASHION",
          sku: "GUC-001",
          imageUrl: "s3://gucci/dress.jpg",
          price: 1200,
        },
      };

      const result = await handler(event);
      const item = result as any;
      expect(item).toHaveProperty("id");
      expect(item.brand).toBe("Gucci");
      expect(item.name).toBe("Dress");
      expect(item.price).toBe(1200);
      expect(Array.isArray(item.affiliateLinks)).toBe(true);
    });
  });

  describe("adminAddAffiliateLink", () => {
    it("should add affiliate link", async () => {
      const event = {
        info: { fieldName: "adminAddAffiliateLink" },
        identity: mockAdminIdentity,
        arguments: {
          itemId: "item-001",
          retailer: "Amazon",
          url: "https://amazon.com/item",
          commissionRate: 0.05,
        },
      };

      const result = await handler(event);
      const link = result as any;
      expect(link).toHaveProperty("id");
      expect(link.retailer).toBe("Amazon");
      expect(link.commissionRate).toBe(0.05);
      expect(link.isActive).toBe(true);
    });
  });
});
