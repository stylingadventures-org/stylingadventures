/**
 * Presign Upload Key Validation Tests
 * Tests for key sanitization, content-type validation, and security checks
 */

describe("Presign Key Sanitization", () => {
  // Import the validation logic (we'll extract these functions to _shared/presign-validation.ts)
  
  const VALID_KEY_PATTERN = /^[a-zA-Z0-9\/_\-.]+$/;
  
  function sanitizeKey(key: string): string | null {
    // Remove leading/trailing slashes
    let clean = key.trim().replace(/^\/+/, "").replace(/\/+$/, "");
    
    // Reject empty
    if (!clean) return null;
    
    // Reject path traversal
    if (clean.includes("..")) return null;
    
    // Reject invalid characters
    if (!VALID_KEY_PATTERN.test(clean)) return null;
    
    return clean;
  }

  describe("Valid Keys", () => {
    it("should accept simple alphanumeric keys", () => {
      expect(sanitizeKey("photo123.jpg")).toBe("photo123.jpg");
    });

    it("should accept keys with underscores", () => {
      expect(sanitizeKey("my_photo_2024.jpg")).toBe("my_photo_2024.jpg");
    });

    it("should accept keys with hyphens", () => {
      expect(sanitizeKey("my-photo-2024.jpg")).toBe("my-photo-2024.jpg");
    });

    it("should accept keys with slashes (directory structure)", () => {
      expect(sanitizeKey("users/abc123/photos/profile.jpg")).toBe(
        "users/abc123/photos/profile.jpg"
      );
    });

    it("should accept keys with dots", () => {
      expect(sanitizeKey("backup.2024.01.15.tar.gz")).toBe(
        "backup.2024.01.15.tar.gz"
      );
    });

    it("should trim leading/trailing slashes", () => {
      expect(sanitizeKey("/users/abc123/photo.jpg/")).toBe(
        "users/abc123/photo.jpg"
      );
    });

    it("should trim leading/trailing whitespace", () => {
      expect(sanitizeKey("  photo.jpg  ")).toBe("photo.jpg");
    });
  });

  describe("Invalid Keys - Security", () => {
    it("should reject path traversal with ..", () => {
      expect(sanitizeKey("../../../etc/passwd")).toBeNull();
    });

    it("should reject keys with path traversal in middle", () => {
      expect(sanitizeKey("users/../../../admin/file.txt")).toBeNull();
    });

    it("should reject empty strings", () => {
      expect(sanitizeKey("")).toBeNull();
    });

    it("should reject whitespace-only strings", () => {
      expect(sanitizeKey("   ")).toBeNull();
    });

    it("should reject keys with spaces", () => {
      expect(sanitizeKey("my photo.jpg")).toBeNull();
    });

    it("should reject keys with special characters", () => {
      expect(sanitizeKey("photo@2024.jpg")).toBeNull();
      expect(sanitizeKey("photo$money.jpg")).toBeNull();
      expect(sanitizeKey("photo&more.jpg")).toBeNull();
    });

    it("should reject keys with control characters", () => {
      expect(sanitizeKey("photo\x00.jpg")).toBeNull();
      expect(sanitizeKey("photo\t.jpg")).toBeNull();
      expect(sanitizeKey("photo\n.jpg")).toBeNull();
    });

    it("should reject keys with unicode characters", () => {
      expect(sanitizeKey("фото.jpg")).toBeNull(); // Cyrillic
      expect(sanitizeKey("照片.jpg")).toBeNull(); // Chinese
    });

    it("should reject keys with shell metacharacters", () => {
      expect(sanitizeKey("photo;rm -rf.jpg")).toBeNull();
      expect(sanitizeKey("photo|cat.jpg")).toBeNull();
      expect(sanitizeKey("photo`whoami`.jpg")).toBeNull();
      expect(sanitizeKey("photo$(whoami).jpg")).toBeNull();
    });

    it("should reject keys with SQL injection attempts", () => {
      expect(sanitizeKey("photo' OR '1'='1.jpg")).toBeNull();
      expect(sanitizeKey("photo\"; DROP TABLE--")).toBeNull();
    });
  });

  describe("Content-Type Validation", () => {
    const ALLOWED_CONTENT_TYPES = new Set([
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

    function isValidContentType(contentType: string): boolean {
      return ALLOWED_CONTENT_TYPES.has(contentType.toLowerCase());
    }

    describe("Valid Content Types", () => {
      it("should accept image/jpeg", () => {
        expect(isValidContentType("image/jpeg")).toBe(true);
      });

      it("should accept image/png", () => {
        expect(isValidContentType("image/png")).toBe(true);
      });

      it("should accept image/webp", () => {
        expect(isValidContentType("image/webp")).toBe(true);
      });

      it("should accept video/mp4", () => {
        expect(isValidContentType("video/mp4")).toBe(true);
      });

      it("should accept application/pdf", () => {
        expect(isValidContentType("application/pdf")).toBe(true);
      });

      it("should be case-insensitive", () => {
        expect(isValidContentType("IMAGE/JPEG")).toBe(true);
        expect(isValidContentType("Image/Png")).toBe(true);
      });
    });

    describe("Invalid Content Types", () => {
      it("should reject executables", () => {
        expect(isValidContentType("application/x-msdownload")).toBe(false);
        expect(isValidContentType("application/x-executable")).toBe(false);
      });

      it("should reject scripts", () => {
        expect(isValidContentType("application/javascript")).toBe(false);
        expect(isValidContentType("text/javascript")).toBe(false);
        expect(isValidContentType("text/x-python")).toBe(false);
      });

      it("should reject arbitrary archives", () => {
        expect(isValidContentType("application/zip")).toBe(false);
        expect(isValidContentType("application/x-rar")).toBe(false);
      });

      it("should reject HTML/XML", () => {
        expect(isValidContentType("text/html")).toBe(false);
        expect(isValidContentType("application/xml")).toBe(false);
      });

      it("should reject empty string", () => {
        expect(isValidContentType("")).toBe(false);
      });

      it("should reject arbitrary strings", () => {
        expect(isValidContentType("malware/virus")).toBe(false);
      });
    });
  });
});
