import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock fs before importing the module under test
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
}));

// Mock ajv and ajv-formats
vi.mock("ajv", () => ({
  default: vi.fn().mockImplementation(() => ({
    addSchema: vi.fn(),
    getSchema: vi.fn(),
  })),
}));

vi.mock("ajv-formats", () => ({
  default: vi.fn(),
}));

// Import the module under test
import {
  validateRule,
  validateRules,
  validateRuleId,
  validateVersion,
  validateTag,
  validateBundlePath,
  validateCustomFields,
  validateRuleComprehensive,
} from "../rule-validator";

import { readFileSync } from "fs";
import type { RuleMetadata, ValidationResult } from "../../types/rule.types";
import type { CLIConfig } from "../../types/config.types";

describe("rule-validator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateRuleId", () => {
    it("should validate correct rule ID format", () => {
      expect(validateRuleId("foundation.cognitive-load")).toBe(true);
      expect(validateRuleId("typescript.conventions")).toBe(true);
      expect(validateRuleId("testing.unit-testing")).toBe(true);
      expect(validateRuleId("security.data-protection")).toBe(true);
    });

    it("should reject invalid rule ID format", () => {
      expect(validateRuleId("invalid")).toBe(false);
      expect(validateRuleId("Invalid.Case")).toBe(false);
      expect(validateRuleId("foundation-")).toBe(false);
      expect(validateRuleId("foundation.")).toBe(false);
      expect(validateRuleId(".foundation")).toBe(false);
      expect(validateRuleId("foundation..cognitive")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(validateRuleId("")).toBe(false);
      expect(validateRuleId("a.b")).toBe(true);
      expect(validateRuleId("a1.b2-c3")).toBe(true);
    });
  });

  describe("validateVersion", () => {
    it("should validate correct SemVer format", () => {
      expect(validateVersion("1.0.0")).toBe(true);
      expect(validateVersion("0.1.0")).toBe(true);
      expect(validateVersion("1.0.0-beta.1")).toBe(true);
      expect(validateVersion("1.0.0+20130313144700")).toBe(true);
      expect(validateVersion("1.0.0-beta.1+20130313144700")).toBe(true);
    });

    it("should reject invalid version format", () => {
      expect(validateVersion("1.0")).toBe(false);
      expect(validateVersion("1.0.0.0")).toBe(false);
      expect(validateVersion("v1.0.0")).toBe(false);
      expect(validateVersion("1.0.0-")).toBe(false);
      expect(validateVersion("01.0.0")).toBe(false);
      expect(validateVersion("1.00.0")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(validateVersion("")).toBe(false);
      expect(validateVersion("0.0.0")).toBe(true);
      expect(validateVersion("999.999.999")).toBe(true);
    });
  });

  describe("validateTag", () => {
    it("should validate correct tag format", () => {
      expect(validateTag("topic:ai-rules")).toBe(true);
      expect(validateTag("lint:eslint")).toBe(true);
      expect(validateTag("test:unit")).toBe(true);
      expect(validateTag("perf:optimization")).toBe(true);
      expect(validateTag("a11y:accessibility")).toBe(true);
      expect(validateTag("sec:security")).toBe(true);
      expect(validateTag("topic:ai-rules.cli")).toBe(true);
    });

    it("should reject invalid tag format", () => {
      expect(validateTag("invalid")).toBe(false);
      expect(validateTag("topic")).toBe(false);
      expect(validateTag("topic:")).toBe(false);
      expect(validateTag(":value")).toBe(false);
      expect(validateTag("invalid:tag")).toBe(false);
      expect(validateTag("TOPIC:value")).toBe(false);
      expect(validateTag("topic:Value")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(validateTag("")).toBe(false);
      expect(validateTag("topic:a")).toBe(true);
      expect(validateTag("topic:123")).toBe(true);
    });
  });

  describe("validateBundlePath", () => {
    it("should validate correct bundle path format", () => {
      expect(validateBundlePath("foundation")).toBe(true);
      expect(validateBundlePath("typescript")).toBe(true);
      expect(validateBundlePath("foundation/cognitive-load")).toBe(true);
      expect(validateBundlePath("typescript/conventions")).toBe(true);
      expect(validateBundlePath("testing/unit-testing")).toBe(true);
      expect(validateBundlePath("foundation-")).toBe(true); // Hyphens are allowed
    });

    it("should reject invalid bundle path format", () => {
      expect(validateBundlePath("Invalid")).toBe(false);
      expect(validateBundlePath("foundation_")).toBe(false);
      expect(validateBundlePath("foundation.")).toBe(false);
      expect(validateBundlePath("/foundation")).toBe(false);
      expect(validateBundlePath("foundation/")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(validateBundlePath("")).toBe(false);
      expect(validateBundlePath("a")).toBe(true);
      expect(validateBundlePath("a/b")).toBe(true);
    });
  });

  describe("validateCustomFields", () => {
    const mockConfig: CLIConfig = {
      repository: {
        path: "/test",
        rulesDirectory: "rules",
        schemaPath: "schema.json",
      },
      output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
      ui: { colors: true, verbose: false },
    };

    it("should validate rule with all correct fields", () => {
      const rule: RuleMetadata = {
        id: "foundation.cognitive-load",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
        tags: ["topic:ai-rules"],
        bundles: ["foundation/cognitive-load"],
        order: 100,
        review: {
          lastReviewed: "2023-01-01",
          reviewCycleDays: 30,
        },
      };

      const result = validateCustomFields(rule);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should detect invalid rule ID", () => {
      const rule: RuleMetadata = {
        id: "invalid-id",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
      };

      const result = validateCustomFields(rule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid rule ID format: invalid-id");
    });

    it("should detect invalid version", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "invalid-version",
        title: "Test Rule",
        category: "foundation",
      };

      const result = validateCustomFields(rule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Invalid version format: invalid-version"
      );
    });

    it("should detect invalid tags", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
        tags: ["invalid-tag", "topic:valid"],
      };

      const result = validateCustomFields(rule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid tag format: invalid-tag");
    });

    it("should detect invalid bundles", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
        bundles: ["invalid_bundle", "valid/bundle"],
      };

      const result = validateCustomFields(rule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Invalid bundle path format: invalid_bundle"
      );
    });

    it("should detect invalid order range", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
        order: 1500,
      };

      const result = validateCustomFields(rule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Order must be between 0 and 1000, got: 1500"
      );
    });

    it("should detect invalid review cycle", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
        review: {
          lastReviewed: "2023-01-01",
          reviewCycleDays: 5,
        },
      };

      const result = validateCustomFields(rule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Review cycle must be between 7 and 365 days, got: 5"
      );
    });

    it("should warn about too many tags", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
        tags: [
          "topic:1",
          "topic:2",
          "topic:3",
          "topic:4",
          "topic:5",
          "topic:6",
        ],
      };

      const result = validateCustomFields(rule);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("Rule has more than 5 tags: 6");
    });
  });

  describe("validateRule", () => {
    const mockConfig: CLIConfig = {
      repository: {
        path: "/test",
        rulesDirectory: "rules",
        schemaPath: "schema.json",
      },
      output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
      ui: { colors: true, verbose: false },
    };

    it("should handle schema file read errors", () => {
      (readFileSync as any).mockImplementation(() => {
        throw new Error("File not found");
      });

      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
      };

      const result = validateRule(rule, mockConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Validation error");
    });
  });

  describe("validateRules", () => {
    const mockConfig: CLIConfig = {
      repository: {
        path: "/test",
        rulesDirectory: "rules",
        schemaPath: "schema.json",
      },
      output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
      ui: { colors: true, verbose: false },
    };

    it("should process empty rules array", () => {
      const result = validateRules([], mockConfig);

      expect(result.validRules).toHaveLength(0);
      expect(result.invalidRules).toHaveLength(0);
    });

    it("should process rules array", () => {
      const rules: RuleMetadata[] = [
        {
          id: "foundation.test1",
          version: "1.0.0",
          title: "Test Rule 1",
          category: "foundation",
        },
      ];

      const result = validateRules(rules, mockConfig);

      expect(result.validRules).toBeDefined();
      expect(result.invalidRules).toBeDefined();
    });
  });

  describe("validateRuleComprehensive", () => {
    const mockConfig: CLIConfig = {
      repository: {
        path: "/test",
        rulesDirectory: "rules",
        schemaPath: "schema.json",
      },
      output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
      ui: { colors: true, verbose: false },
    };

    it("should validate rule with custom fields", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
        tags: ["topic:test"],
        order: 100,
      };

      const result = validateRuleComprehensive(rule, mockConfig);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it("should detect custom field validation errors", () => {
      const rule: RuleMetadata = {
        id: "invalid-id",
        version: "invalid-version",
        title: "Test Rule",
        category: "foundation",
      };

      const result = validateRuleComprehensive(rule, mockConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid rule ID format: invalid-id");
      expect(result.errors).toContain(
        "Invalid version format: invalid-version"
      );
    });

    it("should warn about optional fields when minify is enabled", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
        description: "Description",
        scope: ["global"],
        language: "typescript",
        order: 100,
      };

      const result = validateRuleComprehensive(rule, mockConfig, {
        minify: true,
        keepFields: [],
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("Optional field present under minify"))).toBe(
        true
      );
    });

    it("should not warn about fields in keepFields when minify is enabled", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
        description: "Description",
        scope: ["global"],
        language: "typescript",
      };

      const result = validateRuleComprehensive(rule, mockConfig, {
        minify: true,
        keepFields: ["description", "scope"],
      });

      // Should warn about language but not about description or scope
      const languageWarnings = result.warnings.filter((w) =>
        w.includes("language")
      );
      const descriptionWarnings = result.warnings.filter((w) =>
        w.includes("description")
      );
      const scopeWarnings = result.warnings.filter((w) =>
        w.includes("scope")
      );

      expect(languageWarnings.length).toBeGreaterThan(0);
      expect(descriptionWarnings.length).toBe(0);
      expect(scopeWarnings.length).toBe(0);
    });

    it("should not warn when minify is disabled", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
        description: "Description",
        scope: ["global"],
        language: "typescript",
      };

      const result = validateRuleComprehensive(rule, mockConfig, {
        minify: false,
      });

      const minifyWarnings = result.warnings.filter((w) =>
        w.includes("Optional field present under minify")
      );

      expect(minifyWarnings.length).toBe(0);
    });

    it("should not warn about required fields when minify is enabled", () => {
      const rule: RuleMetadata = {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
      };

      const result = validateRuleComprehensive(rule, mockConfig, {
        minify: true,
        keepFields: [],
      });

      const requiredFieldWarnings = result.warnings.filter(
        (w) =>
          w.includes("id") ||
          w.includes("version") ||
          w.includes("title") ||
          w.includes("category")
      );

      expect(requiredFieldWarnings.length).toBe(0);
    });
  });
});
