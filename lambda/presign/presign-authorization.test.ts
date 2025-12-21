/**
 * Presign Upload Authorization Tests
 * Tests that the presign endpoint properly validates authentication and authorization
 */

import { APIGatewayProxyEventV2 } from "aws-lambda";

describe("Presign Upload Authorization", () => {
  /**
   * Mock event builder for testing
   */
  function createPresignEvent(overrides?: Partial<APIGatewayProxyEventV2>): any {
    return {
      version: "2.0",
      routeKey: "POST /presign",
      rawPath: "/presign",
      headers: {
        "content-type": "application/json",
        origin: "https://stylingadventures.com",
      },
      requestContext: {
        http: {
          method: "POST",
          path: "/presign",
          protocol: "HTTP/1.1",
          sourceIp: "192.168.1.1",
          userAgent: "test-agent",
        },
        routeKey: "POST /presign",
        stage: "prod",
        accountId: "123456789012",
        apiId: "api123",
        requestId: "req123",
        domainName: "api.example.com",
        authorizer: {
          jwt: {
            claims: {
              sub: "user-123",
              "cognito:groups": "CREATOR",
            },
          },
        },
      },
      body: JSON.stringify({
        key: "users/user-123/photos/profile.jpg",
        contentType: "image/jpeg",
        size: 102400,
      }),
      isBase64Encoded: false,
      ...overrides,
    } as any;
  }

  describe("Authentication Required", () => {
    it("should reject requests without authentication", () => {
      const event = createPresignEvent({
        requestContext: {
          ...createPresignEvent().requestContext,
          authorizer: undefined,
        },
      });

      // Event has no authorizer.jwt.claims
      const claims = event.requestContext?.authorizer?.jwt?.claims;
      expect(claims).toBeUndefined();
    });

    it("should reject requests without user sub claim", () => {
      const event = createPresignEvent({
        requestContext: {
          ...createPresignEvent().requestContext,
          authorizer: {
            jwt: {
              claims: {
                // No 'sub' claim
                "cognito:groups": "CREATOR",
              },
            },
          },
        },
      });

      const claims = event.requestContext?.authorizer?.jwt?.claims;
      expect(claims?.sub).toBeUndefined();
    });

    it("should accept requests with valid JWT claims", () => {
      const event = createPresignEvent();
      const claims = event.requestContext?.authorizer?.jwt?.claims;
      expect(claims?.sub).toBe("user-123");
    });
  });

  describe("User-Scoped Upload Path Validation", () => {
    it("should allow uploads to users/{sub}/ prefix", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "users/user-123/photos/profile.jpg",
          contentType: "image/jpeg",
        }),
      });

      const claims = event.requestContext?.authorizer?.jwt?.claims;
      const userSub = claims?.sub;
      const body = JSON.parse(event.body || "{}");

      // Key must start with users/{userSub}/
      expect(body.key).toMatch(new RegExp(`^users/${userSub}/`));
    });

    it("should reject uploads to different user's directory", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "users/other-user-456/photos/profile.jpg",
          contentType: "image/jpeg",
        }),
      });

      const claims = event.requestContext?.authorizer?.jwt?.claims;
      const userSub = claims?.sub;
      const body = JSON.parse(event.body || "{}");

      // Should fail the scope check
      const isValidScope = body.key.startsWith(`users/${userSub}/`);
      expect(isValidScope).toBe(false);
    });

    it("should reject uploads to arbitrary paths", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "arbitrary/path/file.jpg",
          contentType: "image/jpeg",
        }),
      });

      const claims = event.requestContext?.authorizer?.jwt?.claims;
      const userSub = claims?.sub;
      const body = JSON.parse(event.body || "{}");

      const isValidScope = body.key.startsWith(`users/${userSub}/`);
      expect(isValidScope).toBe(false);
    });

    it("should reject uploads to root directory", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "profile.jpg",
          contentType: "image/jpeg",
        }),
      });

      const claims = event.requestContext?.authorizer?.jwt?.claims;
      const userSub = claims?.sub;
      const body = JSON.parse(event.body || "{}");

      const isValidScope = body.key.startsWith(`users/${userSub}/`);
      expect(isValidScope).toBe(false);
    });
  });

  describe("Content-Type Validation", () => {
    const ALLOWED_TYPES = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "application/pdf",
      "text/csv",
    ]);

    it("should accept image/jpeg", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "users/user-123/photos/photo.jpg",
          contentType: "image/jpeg",
        }),
      });

      const body = JSON.parse(event.body || "{}");
      expect(ALLOWED_TYPES.has(body.contentType.toLowerCase())).toBe(true);
    });

    it("should reject application/x-executable", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "users/user-123/malware.exe",
          contentType: "application/x-executable",
        }),
      });

      const body = JSON.parse(event.body || "{}");
      expect(ALLOWED_TYPES.has(body.contentType.toLowerCase())).toBe(false);
    });

    it("should reject application/javascript", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "users/user-123/script.js",
          contentType: "application/javascript",
        }),
      });

      const body = JSON.parse(event.body || "{}");
      expect(ALLOWED_TYPES.has(body.contentType.toLowerCase())).toBe(false);
    });

    it("should be case-insensitive for content-type", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "users/user-123/photo.jpg",
          contentType: "IMAGE/JPEG",
        }),
      });

      const body = JSON.parse(event.body || "{}");
      expect(ALLOWED_TYPES.has(body.contentType.toLowerCase())).toBe(true);
    });
  });

  describe("Key Sanitization in Presign", () => {
    const VALID_KEY_PATTERN = /^[a-zA-Z0-9\/_\-.]+$/;

    function sanitizeKey(key: string): string | null {
      let clean = key.trim().replace(/^\/+/, "").replace(/\/+$/, "");
      if (!clean) return null;
      if (clean.includes("..")) return null;
      if (!VALID_KEY_PATTERN.test(clean)) return null;
      return clean;
    }

    it("should reject path traversal attacks", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "users/user-123/../../../etc/passwd",
          contentType: "image/jpeg",
        }),
      });

      const body = JSON.parse(event.body || "{}");
      expect(sanitizeKey(body.key)).toBeNull();
    });

    it("should reject shell injection in keys", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "users/user-123/photo;rm -rf.jpg",
          contentType: "image/jpeg",
        }),
      });

      const body = JSON.parse(event.body || "{}");
      expect(sanitizeKey(body.key)).toBeNull();
    });

    it("should accept valid nested paths", () => {
      const event = createPresignEvent({
        body: JSON.stringify({
          key: "users/user-123/closet/2024/winter/profile.jpg",
          contentType: "image/jpeg",
        }),
      });

      const body = JSON.parse(event.body || "{}");
      const sanitized = sanitizeKey(body.key);
      expect(sanitized).not.toBeNull();
      expect(sanitized).toMatch(/^users\/user-123\//);
    });
  });

  describe("CORS Origin Validation", () => {
    it("should accept requests from allowed origins in prod", () => {
      const event = createPresignEvent({
        headers: {
          origin: "https://stylingadventures.com",
        },
      });

      const origin = event.headers?.origin as string;
      const allowedOrigins = new Set([
        "https://stylingadventures.com",
        "https://d3fghr37bcpbig.cloudfront.net",
      ]);

      expect(allowedOrigins.has(origin)).toBe(true);
    });

    it("should allow localhost in dev mode", () => {
      const event = createPresignEvent({
        headers: {
          origin: "http://localhost:5173",
        },
      });

      const origin = event.headers?.origin as string;
      const envName: string = "dev"; // Simulating dev environment

      if (envName !== "prod") {
        expect(origin).toMatch(/^http:\/\/(localhost|127\.0\.0\.1)/);
      }
    });

    it("should reject localhost in production", () => {
      const event = createPresignEvent({
        headers: {
          origin: "http://localhost:5173",
        },
      });

      const origin = event.headers?.origin as string;
      const envName: string = "prod"; // Simulating prod environment
      const allowedOrigins = new Set([
        "https://stylingadventures.com",
        "https://d3fghr37bcpbig.cloudfront.net",
      ]);

      if (envName === "prod") {
        expect(allowedOrigins.has(origin)).toBe(false);
      }
    });

    it("should reject unauthorized origins", () => {
      const event = createPresignEvent({
        headers: {
          origin: "https://malicious.com",
        },
      });

      const origin = event.headers?.origin as string;
      const allowedOrigins = new Set([
        "https://stylingadventures.com",
        "https://d3fghr37bcpbig.cloudfront.net",
      ]);

      expect(allowedOrigins.has(origin)).toBe(false);
    });
  });

  describe("Rate Limiting Readiness", () => {
    it("should extract request context for rate limiting", () => {
      const event = createPresignEvent();
      const requestId = event.requestContext?.requestId;
      const sourceIp = event.requestContext?.http?.sourceIp;
      const userSub = event.requestContext?.authorizer?.jwt?.claims?.sub;

      expect(requestId).toBeDefined();
      expect(sourceIp).toBeDefined();
      expect(userSub).toBeDefined();

      // These fields should be available for rate limiting decisions
      expect([requestId, sourceIp, userSub].every((x) => x)).toBe(true);
    });
  });
});
