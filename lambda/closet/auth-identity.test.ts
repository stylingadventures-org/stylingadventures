/**
 * Auth Identity & Groups Tests
 * Tests for parsing user tier, groups, and admin role detection
 */

describe("Auth Identity Parsing", () => {
  /**
   * Parse Cognito groups from identity claims
   * Handles multiple formats: array, comma-separated string, custom claim
   */
  function parseGroups(identity: any): string[] {
    const claims = identity?.claims || {};
    const raw =
      claims["cognito:groups"] ||
      claims["custom:groups"] ||
      identity?.groups ||
      [];
    if (Array.isArray(raw)) {
      return raw.map((g) => String(g));
    }
    if (typeof raw === "string") {
      return raw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
    return [];
  }

  /**
   * Determine user tier from identity claims
   */
  type UserTier = "FREE" | "BESTIE" | "CREATOR" | "COLLAB" | "ADMIN" | "PRIME";

  function getUserTier(identity: any): UserTier {
    const claims = identity?.claims || {};

    const tierClaim =
      (claims["custom:tier"] as string | undefined) ||
      (claims["tier"] as string | undefined);

    let tier: UserTier = "FREE";
    if (
      tierClaim &&
      ["FREE", "BESTIE", "CREATOR", "COLLAB", "ADMIN", "PRIME"].includes(
        tierClaim,
      )
    ) {
      tier = tierClaim as UserTier;
    }

    const groups = parseGroups(identity);

    // Groups override tier for auth checks
    if (groups.includes("ADMIN")) return "ADMIN";
    if (groups.includes("CREATOR")) return "CREATOR";
    if (groups.includes("PRIME")) return "PRIME";

    return tier;
  }

  /**
   * Check if user is admin or collab (elevated access)
   */
  function isAdminIdentity(identity: any): boolean {
    const claims = identity?.claims || {};
    const raw = claims["cognito:groups"];
    const groups = Array.isArray(raw)
      ? raw
      : String(raw || "")
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean);

    return groups.includes("ADMIN") || groups.includes("COLLAB");
  }

  describe("parseGroups", () => {
    it("should parse array of groups", () => {
      const identity = {
        claims: { "cognito:groups": ["ADMIN", "CREATOR"] },
      };
      expect(parseGroups(identity)).toEqual(["ADMIN", "CREATOR"]);
    });

    it("should parse comma-separated string", () => {
      const identity = {
        claims: { "cognito:groups": "ADMIN,CREATOR" },
      };
      expect(parseGroups(identity)).toEqual(["ADMIN", "CREATOR"]);
    });

    it("should handle comma-separated with spaces", () => {
      const identity = {
        claims: { "cognito:groups": "ADMIN, CREATOR, PRIME" },
      };
      expect(parseGroups(identity)).toEqual(["ADMIN", "CREATOR", "PRIME"]);
    });

    it("should parse custom:groups claim", () => {
      const identity = {
        claims: { "custom:groups": ["BESTIE"] },
      };
      expect(parseGroups(identity)).toEqual(["BESTIE"]);
    });

    it("should parse identity.groups field", () => {
      const identity = {
        groups: ["CREATOR", "PRIME"],
      };
      expect(parseGroups(identity)).toEqual(["CREATOR", "PRIME"]);
    });

    it("should return empty array for missing groups", () => {
      expect(parseGroups({})).toEqual([]);
      expect(parseGroups({ claims: {} })).toEqual([]);
    });

    it("should filter empty strings", () => {
      const identity = {
        claims: { "cognito:groups": "ADMIN,,CREATOR," },
      };
      expect(parseGroups(identity)).toEqual(["ADMIN", "CREATOR"]);
    });

    it("should prefer cognito:groups over custom:groups", () => {
      const identity = {
        claims: {
          "cognito:groups": ["ADMIN"],
          "custom:groups": ["CREATOR"],
        },
      };
      expect(parseGroups(identity)).toEqual(["ADMIN"]);
    });
  });

  describe("getUserTier", () => {
    it("should default to FREE tier", () => {
      expect(getUserTier({})).toBe("FREE");
      expect(getUserTier({ claims: {} })).toBe("FREE");
    });

    it("should read custom:tier claim", () => {
      const identity = {
        claims: { "custom:tier": "BESTIE" },
      };
      expect(getUserTier(identity)).toBe("BESTIE");
    });

    it("should read tier claim", () => {
      const identity = {
        claims: { tier: "CREATOR" },
      };
      expect(getUserTier(identity)).toBe("CREATOR");
    });

    it("should reject invalid tier claims", () => {
      const identity = {
        claims: { "custom:tier": "INVALID" },
      };
      expect(getUserTier(identity)).toBe("FREE");
    });

    it("should accept all valid tiers", () => {
      const tiers: UserTier[] = [
        "FREE",
        "BESTIE",
        "CREATOR",
        "COLLAB",
        "ADMIN",
        "PRIME",
      ];
      for (const tier of tiers) {
        const identity = { claims: { "custom:tier": tier } };
        expect(getUserTier(identity)).toBe(tier);
      }
    });

    it("should allow group to override tier", () => {
      const identity = {
        claims: {
          "custom:tier": "BESTIE",
          "cognito:groups": "ADMIN",
        },
      };
      expect(getUserTier(identity)).toBe("ADMIN");
    });

    it("should prioritize groups over tier claim", () => {
      const identity = {
        claims: {
          "custom:tier": "FREE",
          "cognito:groups": ["CREATOR"],
        },
      };
      expect(getUserTier(identity)).toBe("CREATOR");
    });

    it("should return true for ADMIN group", () => {
      const identity = {
        claims: { "cognito:groups": ["ADMIN"] },
      };
      expect(getUserTier(identity)).toBe("ADMIN");
    });

    it("should return CREATOR for CREATOR group", () => {
      const identity = {
        claims: { "cognito:groups": ["CREATOR"] },
      };
      expect(getUserTier(identity)).toBe("CREATOR");
    });

    it("should return PRIME for PRIME group", () => {
      const identity = {
        claims: { "cognito:groups": ["PRIME"] },
      };
      expect(getUserTier(identity)).toBe("PRIME");
    });

    it("should prioritize tier groups in order: ADMIN > CREATOR > PRIME > custom tier", () => {
      // If user has multiple groups, ADMIN wins
      let identity = {
        claims: { "cognito:groups": ["CREATOR", "PRIME"] },
      };
      expect(getUserTier(identity)).toBe("CREATOR"); // CREATOR before PRIME in check

      // ADMIN always wins
      identity = {
        claims: { "cognito:groups": ["PRIME", "ADMIN"] },
      };
      expect(getUserTier(identity)).toBe("ADMIN");
    });
  });

  describe("isAdminIdentity", () => {
    it("should return false for unauthenticated users", () => {
      expect(isAdminIdentity({})).toBe(false);
      expect(isAdminIdentity({ claims: {} })).toBe(false);
    });

    it("should return true for ADMIN group", () => {
      const identity = {
        claims: { "cognito:groups": ["ADMIN"] },
      };
      expect(isAdminIdentity(identity)).toBe(true);
    });

    it("should return true for COLLAB group", () => {
      const identity = {
        claims: { "cognito:groups": ["COLLAB"] },
      };
      expect(isAdminIdentity(identity)).toBe(true);
    });

    it("should return true for comma-separated ADMIN", () => {
      const identity = {
        claims: { "cognito:groups": ["ADMIN", "CREATOR"] },
      };
      expect(isAdminIdentity(identity)).toBe(true);
    });

    it("should return true for comma-separated COLLAB", () => {
      const identity = {
        claims: { "cognito:groups": ["CREATOR", "COLLAB"] },
      };
      expect(isAdminIdentity(identity)).toBe(true);
    });

    it("should return false for non-admin groups", () => {
      const identity = {
        claims: { "cognito:groups": ["CREATOR", "PRIME"] },
      };
      expect(isAdminIdentity(identity)).toBe(false);
    });

    it("should return false for empty groups", () => {
      const identity = {
        claims: { "cognito:groups": [] },
      };
      expect(isAdminIdentity(identity)).toBe(false);
    });

    it("should handle both group formats", () => {
      // Array format
      let identity = {
        claims: { "cognito:groups": ["ADMIN"] },
      };
      expect(isAdminIdentity(identity)).toBe(true);

      // Multiple groups format
      identity = {
        claims: { "cognito:groups": ["ADMIN", "CREATOR"] },
      };
      expect(isAdminIdentity(identity)).toBe(true);
    });

    it("should be case-sensitive (AWS Cognito is case-sensitive)", () => {
      const identity = {
        claims: { "cognito:groups": ["admin"] }, // lowercase
      };
      expect(isAdminIdentity(identity)).toBe(false);
    });
  });

  describe("Resolver Guards", () => {
    it("should allow ADMIN users to delete items", () => {
      const identity = {
        claims: { "cognito:groups": ["ADMIN"] },
      };
      expect(isAdminIdentity(identity)).toBe(true);
    });

    it("should allow COLLAB users to delete items", () => {
      const identity = {
        claims: { "cognito:groups": ["COLLAB"] },
      };
      expect(isAdminIdentity(identity)).toBe(true);
    });

    it("should deny CREATOR users from admin operations", () => {
      const identity = {
        claims: { "cognito:groups": ["CREATOR"] },
      };
      expect(isAdminIdentity(identity)).toBe(false);
    });

    it("should deny BESTIE users from admin operations", () => {
      const identity = {
        claims: { "custom:tier": "BESTIE" },
      };
      expect(isAdminIdentity(identity)).toBe(false);
    });

    it("should deny unauthenticated users from admin operations", () => {
      expect(isAdminIdentity(null)).toBe(false);
      expect(isAdminIdentity(undefined)).toBe(false);
    });
  });
});
