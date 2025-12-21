import Ajv, { ValidateFunction } from "ajv";

export interface ValidationIssue {
  level: "error" | "warning";
  code: string;
  message: string;
  element?: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
  };
}

export interface LayoutSchema {
  anchors?: any[];
  buttons?: any[];
  text?: any[];
  images?: any[];
  containers?: any[];
}

export class LayoutValidationService {
  private ajv: any;
  private wcagCheckCache: Map<string, ValidationResult> = new Map();

  constructor() {
    this.ajv = new Ajv();
  }

  /**
   * Validate layout against JSON Schema
   */
  async validateSchema(layout: LayoutSchema, schema: any): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    try {
      const validate = this.ajv.compile(schema);
      const isValid = validate(layout);

      if (!isValid && validate.errors) {
        for (const error of validate.errors) {
          issues.push({
            level: "error",
            code: error.keyword,
            message: error.message || "Schema validation failed",
            element: error.schemaPath,
          });
        }
      }
    } catch (error) {
      issues.push({
        level: "error",
        code: "schema_parse",
        message: `Failed to parse schema: ${(error as Error).message}`,
      });
    }

    return issues;
  }

  /**
   * WCAG accessibility checks
   */
  async validateAccessibility(layout: LayoutSchema): Promise<ValidationIssue[]> {
    const cacheKey = JSON.stringify(layout);
    if (this.wcagCheckCache.has(cacheKey)) {
      return this.wcagCheckCache.get(cacheKey)?.issues || [];
    }

    const issues: ValidationIssue[] = [];

    // Check buttons have accessible labels
    if (layout.buttons) {
      for (const btn of layout.buttons) {
        if (!btn.label && !btn.ariaLabel) {
          issues.push({
            level: "error",
            code: "wcag_button_label",
            message: "Button missing accessible label",
            element: btn.id || "unknown",
            suggestion: "Add label or aria-label attribute",
          });
        }

        if (btn.width && btn.height && btn.width < 44 && btn.height < 44) {
          issues.push({
            level: "warning",
            code: "wcag_touch_target",
            message: "Button too small for touch interaction (min 44x44)",
            element: btn.id || "unknown",
            suggestion: "Increase button size to at least 44x44 pixels",
          });
        }
      }
    }

    // Check text contrast (basic check - requires color values)
    if (layout.text) {
      for (const txt of layout.text) {
        if (txt.color && txt.backgroundColor) {
          const contrast = this.calculateContrast(txt.color, txt.backgroundColor);
          if (contrast < 4.5) {
            issues.push({
              level: "warning",
              code: "wcag_contrast",
              message: `Text contrast ratio ${contrast.toFixed(2)}:1 below recommended 4.5:1`,
              element: txt.id || "unknown",
              suggestion: "Increase contrast between text and background colors",
            });
          }
        }
      }
    }

    // Check images have alt text
    if (layout.images) {
      for (const img of layout.images) {
        if (!img.alt && !img.ariaLabel) {
          issues.push({
            level: "error",
            code: "wcag_image_alt",
            message: "Image missing alt text",
            element: img.id || "unknown",
            suggestion: "Add descriptive alt text",
          });
        }
      }
    }

    // Check tab order is logical
    if (layout.anchors) {
      const ids = layout.anchors
        .filter((a) => a.tabIndex !== undefined)
        .sort((a, b) => (a.tabIndex || 0) - (b.tabIndex || 0));

      for (let i = 0; i < ids.length; i++) {
        const gap = ids[i].tabIndex - (ids[i - 1]?.tabIndex || 0);
        if (gap > 1 && ids[i - 1]) {
          issues.push({
            level: "warning",
            code: "wcag_tab_order",
            message: `Potential tab order gap detected (jump from ${ids[i - 1]?.tabIndex} to ${ids[i].tabIndex})`,
            element: ids[i].id || "unknown",
            suggestion: "Review tab order for logical flow",
          });
        }
      }
    }

    // Cache result
    this.wcagCheckCache.set(cacheKey, {
      valid: issues.filter((i) => i.level === "error").length === 0,
      issues,
      summary: {
        totalIssues: issues.length,
        errors: issues.filter((i) => i.level === "error").length,
        warnings: issues.filter((i) => i.level === "warning").length,
      },
    });

    return issues;
  }

  /**
   * Full layout validation combining schema + accessibility
   */
  async validateLayout(
    layout: LayoutSchema,
    schema: any
  ): Promise<ValidationResult> {
    const schemaIssues = await this.validateSchema(layout, schema);
    const a11yIssues = await this.validateAccessibility(layout);
    const allIssues = [...schemaIssues, ...a11yIssues];

    return {
      valid: allIssues.filter((i) => i.level === "error").length === 0,
      issues: allIssues,
      summary: {
        totalIssues: allIssues.length,
        errors: allIssues.filter((i) => i.level === "error").length,
        warnings: allIssues.filter((i) => i.level === "warning").length,
      },
    };
  }

  /**
   * Calculate contrast ratio between two colors (simplified)
   */
  private calculateContrast(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance of a color
   */
  private getLuminance(color: string): number {
    // Simple hex to RGB conversion
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map((val) =>
      val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.wcagCheckCache.clear();
  }
}

export default LayoutValidationService;
