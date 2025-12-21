import LayoutValidationService from "../../lib/services/layout-validation.service";

describe("LayoutValidationService", () => {
  let service: LayoutValidationService;

  beforeEach(() => {
    service = new LayoutValidationService();
    service.clearCache();
  });

  describe("validateSchema()", () => {
    it("should validate correct JSON schema", async () => {
      const layout = {
        anchors: [
          { id: "btn1", type: "button", label: "Click me" },
          { id: "text1", type: "text", content: "Hello" },
        ],
      };

      const schema = {
        type: "object",
        properties: {
          anchors: {
            type: "array",
            items: { type: "object" },
          },
        },
      };

      const issues = await service.validateSchema(layout, schema);

      expect(issues).toHaveLength(0);
    });

    it("should reject invalid schema", async () => {
      const layout = {
        anchors: "not an array",
      };

      const schema = {
        type: "object",
        properties: {
          anchors: { type: "array" },
        },
        required: ["anchors"],
      };

      const issues = await service.validateSchema(layout, schema);

      expect(issues.length).toBeGreaterThan(0);
    });

    it("should catch schema parse errors", async () => {
      const layout = { test: true };
      const invalidSchema = null;

      const issues = await service.validateSchema(layout, invalidSchema as any);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].code).toBe("schema_parse");
    });
  });

  describe("validateAccessibility()", () => {
    it("should flag buttons without labels", async () => {
      const layout = {
        buttons: [
          { id: "btn1", width: 100, height: 100 }, // Missing label
        ],
      };

      const issues = await service.validateAccessibility(layout);

      expect(issues.some((i) => i.code === "wcag_button_label")).toBe(true);
    });

    it("should accept buttons with aria-label", async () => {
      const layout = {
        buttons: [
          {
            id: "btn1",
            ariaLabel: "Submit form",
            width: 100,
            height: 100,
          },
        ],
      };

      const issues = await service.validateAccessibility(layout);

      expect(
        issues.some((i) => i.code === "wcag_button_label")
      ).toBe(false);
    });

    it("should flag buttons smaller than 44x44", async () => {
      const layout = {
        buttons: [
          {
            id: "btn1",
            label: "Small",
            width: 40,
            height: 40,
          },
        ],
      };

      const issues = await service.validateAccessibility(layout);

      expect(
        issues.some((i) => i.code === "wcag_touch_target")
      ).toBe(true);
    });

    it("should allow buttons 44x44 or larger", async () => {
      const layout = {
        buttons: [
          {
            id: "btn1",
            label: "OK",
            width: 50,
            height: 50,
          },
        ],
      };

      const issues = await service.validateAccessibility(layout);

      expect(
        issues.some((i) => i.code === "wcag_touch_target")
      ).toBe(false);
    });

    it("should flag images without alt text", async () => {
      const layout = {
        images: [
          { id: "img1", src: "test.jpg" }, // Missing alt
        ],
      };

      const issues = await service.validateAccessibility(layout);

      expect(issues.some((i) => i.code === "wcag_image_alt")).toBe(true);
    });

    it("should accept images with alt or aria-label", async () => {
      const layout = {
        images: [
          { id: "img1", src: "test.jpg", alt: "Product image" },
        ],
      };

      const issues = await service.validateAccessibility(layout);

      expect(issues.some((i) => i.code === "wcag_image_alt")).toBe(false);
    });

    it("should validate text contrast", async () => {
      const layout = {
        text: [
          {
            id: "text1",
            color: "#000000",
            backgroundColor: "#111111", // Very low contrast
          },
        ],
      };

      const issues = await service.validateAccessibility(layout);

      expect(
        issues.some((i) => i.code === "wcag_contrast")
      ).toBe(true);
    });

    it("should accept good contrast ratios", async () => {
      const layout = {
        text: [
          {
            id: "text1",
            color: "#000000",
            backgroundColor: "#FFFFFF", // High contrast
          },
        ],
      };

      const issues = await service.validateAccessibility(layout);

      expect(
        issues.some((i) => i.code === "wcag_contrast")
      ).toBe(false);
    });

    it("should detect tab order gaps", async () => {
      const layout = {
        anchors: [
          { id: "a1", tabIndex: 1 },
          { id: "a2", tabIndex: 5 }, // Gap from 1 to 5
        ],
      };

      const issues = await service.validateAccessibility(layout);

      expect(
        issues.some((i) => i.code === "wcag_tab_order")
      ).toBe(true);
    });
  });

  describe("validateLayout()", () => {
    it("should combine schema and accessibility validation", async () => {
      const layout = {
        buttons: [{ id: "btn1", width: 30, height: 30 }], // Missing label + too small
        anchors: [],
      };

      const schema = {
        type: "object",
        properties: {
          buttons: { type: "array" },
          anchors: { type: "array" },
        },
      };

      const result = await service.validateLayout(layout, schema);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.summary.errors).toBeGreaterThan(0);
    });

    it("should return valid result for compliant layout", async () => {
      const layout = {
        buttons: [
          {
            id: "btn1",
            label: "Submit",
            width: 50,
            height: 50,
          },
        ],
        images: [
          {
            id: "img1",
            src: "test.jpg",
            alt: "Test",
          },
        ],
        text: [
          {
            id: "text1",
            color: "#000000",
            backgroundColor: "#FFFFFF",
          },
        ],
        anchors: [],
      };

      const schema = {
        type: "object",
        properties: {
          buttons: { type: "array" },
          images: { type: "array" },
          text: { type: "array" },
          anchors: { type: "array" },
        },
      };

      const result = await service.validateLayout(layout, schema);

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it("should summarize issues correctly", async () => {
      const layout = {
        buttons: [
          { id: "btn1", width: 30, height: 30 }, // Error + warning
        ],
      };

      const schema = { type: "object" };

      const result = await service.validateLayout(layout, schema);

      expect(result.summary.totalIssues).toBeGreaterThan(0);
      expect(result.summary.errors).toBeGreaterThan(0);
    });
  });

  describe("caching", () => {
    it("should cache validation results", async () => {
      const layout = {
        buttons: [
          {
            id: "btn1",
            label: "OK",
            width: 50,
            height: 50,
          },
        ],
      };

      const result1 = await service.validateAccessibility(layout);
      const result2 = await service.validateAccessibility(layout);

      expect(result1).toEqual(result2);
    });

    it("should clear cache", async () => {
      const layout = {
        buttons: [
          {
            id: "btn1",
            label: "OK",
            width: 50,
            height: 50,
          },
        ],
      };

      await service.validateAccessibility(layout);
      service.clearCache();

      // Cache should be empty after clear
      expect((service as any).wcagCheckCache.size).toBe(0);
    });
  });
});
