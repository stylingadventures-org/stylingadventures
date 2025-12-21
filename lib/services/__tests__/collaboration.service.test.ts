import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import CollaborationService from "../collaboration.service";
import { ProjectAddendum } from "../../types/collaboration";

// Mock DynamoDB
const mockDocClient = {
  send: jest.fn(),
} as unknown as DynamoDBDocumentClient;

const mockS3Client = null;

describe("CollaborationService", () => {
  let service: CollaborationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CollaborationService(mockDocClient, mockS3Client);
  });

  describe("createInvite()", () => {
    it("should create a collaboration invite with valid config", async () => {
      const addendum: ProjectAddendum = {
        deliverables: [
          {
            type: "video",
            description: "Main video",
            dueDate: Date.now() + 86400000,
          },
        ],
        earningsSplit: { prime_pct: 50, creator_pct: 50 },
        deadlines: {
          kickoffDate: Date.now(),
          deliveryDate: Date.now() + 86400000,
          approvalDeadline: Date.now() + 172800000,
        },
      };

      (mockDocClient.send as jest.Mock).mockResolvedValue({});

      const result = await service.createInvite(
        "inviter123",
        "invitee456",
        addendum
      );

      expect(result.ok).toBe(true);
      expect(result.collabId).toBeDefined();
      expect(result.inviteId).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it("should reject invalid addendum config", async () => {
      const invalidAddendum: ProjectAddendum = {
        deliverables: [],
        earningsSplit: { prime_pct: 60, creator_pct: 50 }, // > 100%
        deadlines: {
          kickoffDate: Date.now(),
          deliveryDate: Date.now() + 86400000,
          approvalDeadline: Date.now() + 172800000,
        },
      };

      const result = await service.createInvite(
        "inviter123",
        "invitee456",
        invalidAddendum
      );

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should generate unique tokens", async () => {
      (mockDocClient.send as jest.Mock).mockResolvedValue({});

      const addendum: ProjectAddendum = {
        deliverables: [
          {
            type: "content",
            description: "test",
            dueDate: Date.now() + 86400000,
          },
        ],
        earningsSplit: { prime_pct: 50, creator_pct: 50 },
        deadlines: {
          kickoffDate: Date.now(),
          deliveryDate: Date.now() + 86400000,
          approvalDeadline: Date.now() + 172800000,
        },
      };

      const result1 = await service.createInvite("a", "b", addendum);
      const result2 = await service.createInvite("c", "d", addendum);

      expect(result1.token).not.toBe(result2.token);
    });
  });

  describe("validateAddendumConfig()", () => {
    it("should validate correct split (50/50)", () => {
      const addendum: ProjectAddendum = {
        deliverables: [
          {
            type: "test",
            description: "test",
            dueDate: Date.now() + 86400000,
          },
        ],
        earningsSplit: { prime_pct: 50, creator_pct: 50 },
        deadlines: {
          kickoffDate: Date.now(),
          deliveryDate: Date.now() + 86400000,
          approvalDeadline: Date.now() + 172800000,
        },
      };

      const result = service.validateAddendumConfig(addendum);
      expect(result.ok).toBe(true);
    });

    it("should reject split that doesn't total 100%", () => {
      const addendum: ProjectAddendum = {
        deliverables: [
          {
            type: "test",
            description: "test",
            dueDate: Date.now() + 86400000,
          },
        ],
        earningsSplit: { prime_pct: 60, creator_pct: 50 },
        deadlines: {
          kickoffDate: Date.now(),
          deliveryDate: Date.now() + 86400000,
          approvalDeadline: Date.now() + 172800000,
        },
      };

      const result = service.validateAddendumConfig(addendum);
      expect(result.ok).toBe(false);
    });

    it("should require deliverables", () => {
      const addendum: ProjectAddendum = {
        deliverables: [],
        earningsSplit: { prime_pct: 50, creator_pct: 50 },
        deadlines: {
          kickoffDate: Date.now(),
          deliveryDate: Date.now() + 86400000,
          approvalDeadline: Date.now() + 172800000,
        },
      };

      const result = service.validateAddendumConfig(addendum);
      expect(result.ok).toBe(false);
    });

    it("should reject future kickoff dates", () => {
      const addendum: ProjectAddendum = {
        deliverables: [
          {
            type: "test",
            description: "test",
            dueDate: Date.now() + 86400000,
          },
        ],
        earningsSplit: { prime_pct: 50, creator_pct: 50 },
        deadlines: {
          kickoffDate: Date.now() + 86400000,
          deliveryDate: Date.now() + 86400000,
          approvalDeadline: Date.now() + 172800000,
        },
      };

      const result = service.validateAddendumConfig(addendum);
      expect(result.ok).toBe(false);
    });
  });

  describe("getMasterTermsTemplate()", () => {
    it("should return valid master terms template", () => {
      const template = service.getMasterTermsTemplate();

      expect(template).toHaveProperty("contentOwnership");
      expect(template).toHaveProperty("licenseGrant");
      expect(template).toHaveProperty("exclusivityClause");
      expect(template).toHaveProperty("termDuration");
      expect(template).toHaveProperty("paymentTerms");
    });

    it("should have required fields in template", () => {
      const template = service.getMasterTermsTemplate();

      expect(template.contentOwnership).toHaveProperty("prime_rights");
      expect(template.contentOwnership).toHaveProperty("creator_rights");
      expect(template.licenseGrant).toHaveProperty("scope");
      expect(template.licenseGrant).toHaveProperty("duration");
    });
  });
});
