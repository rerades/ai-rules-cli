import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  stripDefaults,
  pickEssential,
  normalizeRuleMeta,
  RECOMMENDED_FIELDS,
  getAvailableMetadataFields,
  type NormalizeOptions,
} from "../meta-normalizer";
import type { RuleMetadata } from "../../types/rule.types";

describe("meta-normalizer", () => {
  const createBaseRule = (): RuleMetadata => ({
    id: "foundation.test",
    version: "1.0.0",
    title: "Test Rule",
    category: "foundation",
  });

  describe("stripDefaults", () => {
    it("should keep alwaysApply when true", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        alwaysApply: true,
      };

      const result = stripDefaults(rule);

      expect(result.alwaysApply).toBe(true);
    });

    it("should keep alwaysApply when false", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        alwaysApply: false,
      };

      const result = stripDefaults(rule);

      expect(result.alwaysApply).toBe(false);
    });

    it("should remove empty arrays", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        globs: [],
        frameworks: [],
        tooling: [],
        scope: [],
        audience: [],
        requires: [],
        conflicts: [],
        supersedes: [],
        bundles: [],
        files: [],
        tags: [],
        links: [],
      };

      const result = stripDefaults(rule);

      expect(result.globs).toBeUndefined();
      expect(result.frameworks).toBeUndefined();
      expect(result.tooling).toBeUndefined();
      expect(result.scope).toBeUndefined();
      expect(result.audience).toBeUndefined();
      expect(result.requires).toBeUndefined();
      expect(result.conflicts).toBeUndefined();
      expect(result.supersedes).toBeUndefined();
      expect(result.bundles).toBeUndefined();
      expect(result.files).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.links).toBeUndefined();
    });

    it("should keep arrays with values", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        tags: ["topic:test"],
        scope: ["global"],
        requires: ["other.rule"],
      };

      const result = stripDefaults(rule);

      expect(result.tags).toEqual(["topic:test"]);
      expect(result.scope).toEqual(["global"]);
      expect(result.requires).toEqual(["other.rule"]);
    });

    it("should keep non-array optional fields", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        description: "Test description",
        language: "ts",
        order: 100,
        maturity: "stable",
      };

      const result = stripDefaults(rule);

      expect(result.description).toBe("Test description");
      expect(result.language).toBe("ts");
      expect(result.order).toBe(100);
      expect(result.maturity).toBe("stable");
    });

    it("should keep required fields", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        alwaysApply: true,
        globs: [],
      };

      const result = stripDefaults(rule);

      expect(result.id).toBe("foundation.test");
      expect(result.version).toBe("1.0.0");
      expect(result.title).toBe("Test Rule");
      expect(result.category).toBe("foundation");
    });

    it("should handle complex enforcement object", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        enforcement: {
          lint: "warn",
          ci: "allow",
          scaffold: "none",
        },
      };

      const result = stripDefaults(rule);

      expect(result.enforcement).toEqual({
        lint: "warn",
        ci: "allow",
        scaffold: "none",
      });
    });
  });

  describe("pickEssential", () => {
    it("should always keep required fields", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        description: "Description",
        scope: ["global"],
        language: "ts",
        order: 100,
        maturity: "stable",
      };

      const result = pickEssential(rule, []);

      expect(result.id).toBe("foundation.test");
      expect(result.version).toBe("1.0.0");
      expect(result.title).toBe("Test Rule");
      expect(result.category).toBe("foundation");
    });

    it("should remove optional fields not in allowlist", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        description: "Description",
        scope: ["global"],
        language: "ts",
        maturity: "stable",
        order: 100,
      };

      const result = pickEssential(rule, []);

      expect(result.description).toBeUndefined();
      expect(result.scope).toBeUndefined();
      expect(result.language).toBeUndefined();
      expect(result.maturity).toBeUndefined();
      expect(result.order).toBeUndefined();
    });

    it("should keep allowed optional fields", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        description: "Description",
        scope: ["global"],
        language: "ts",
        enforcement: {
          lint: "warn",
          ci: "allow",
          scaffold: "none",
        },
      };

      const result = pickEssential(rule, [
        "description",
        "scope",
        "enforcement",
      ]);

      expect(result.description).toBe("Description");
      expect(result.scope).toEqual(["global"]);
      expect(result.enforcement).toEqual({
        lint: "warn",
        ci: "allow",
        scaffold: "none",
      });
      expect(result.language).toBeUndefined();
    });

    it("should handle allowed fields that are undefined", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        description: undefined,
      };

      const result = pickEssential(rule, ["description"]);

      expect(result.description).toBeUndefined();
    });

    it("should handle allowed fields that are null", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        description: null as any,
      };

      const result = pickEssential(rule, ["description"]);

      expect(result.description).toBeUndefined();
    });

    it("should keep allowed array fields", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        scope: ["global", "repo"],
        globs: ["**/*.ts"],
        audience: ["frontend"],
        tags: ["topic:test"],
      };

      const result = pickEssential(rule, [
        "scope",
        "globs",
        "audience",
        "tags",
      ]);

      expect(result.scope).toEqual(["global", "repo"]);
      expect(result.globs).toEqual(["**/*.ts"]);
      expect(result.audience).toEqual(["frontend"]);
      expect(result.tags).toEqual(["topic:test"]);
    });

    it("should handle order field", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        order: 50,
      };

      const result = pickEssential(rule, ["order"]);

      expect(result.order).toBe(50);
    });

    it("should handle inputs field", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        inputs: {
          includeStatus: {
            type: "boolean",
            default: true,
            description: "Include status",
          },
        },
      };

      const result = pickEssential(rule, ["inputs"]);

      expect(result.inputs).toEqual({
        includeStatus: {
          type: "boolean",
          default: true,
          description: "Include status",
        },
      });
    });

    it("should handle links field", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        links: [
          {
            rel: "docs",
            href: "https://example.com",
          },
        ],
      };

      const result = pickEssential(rule, ["links"]);

      expect(result.links).toEqual([
        {
          rel: "docs",
          href: "https://example.com",
        },
      ]);
    });

    it("should not keep fields not in common allowlist", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        owner: "owner@example.com",
        license: "MIT",
        maturity: "stable",
        lifecycle: "enforced",
      };

      const result = pickEssential(rule, []);

      expect(result.owner).toBeUndefined();
      expect(result.license).toBeUndefined();
      expect(result.maturity).toBeUndefined();
      expect(result.lifecycle).toBeUndefined();
    });
  });

  describe("normalizeRuleMeta", () => {
    it("should only strip defaults when minify is false", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        alwaysApply: true,
        globs: [],
        description: "Description",
        scope: ["global"],
      };

      const result = normalizeRuleMeta(rule, { minify: false });

      expect(result.alwaysApply).toBe(true);
      expect(result.globs).toBeUndefined();
      expect(result.description).toBe("Description");
      expect(result.scope).toEqual(["global"]);
    });

    it("should apply minify when enabled", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        alwaysApply: true,
        globs: [],
        description: "Description",
        scope: ["global"],
        language: "ts",
        order: 100,
      };

      const result = normalizeRuleMeta(rule, { minify: true });

      expect(result.id).toBe("foundation.test");
      expect(result.version).toBe("1.0.0");
      expect(result.title).toBe("Test Rule");
      expect(result.category).toBe("foundation");
      expect(result.description).toBeUndefined();
      expect(result.scope).toBeUndefined();
      expect(result.language).toBeUndefined();
      expect(result.order).toBeUndefined();
    });

    it("should respect keepFields when minify is enabled", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        alwaysApply: true,
        globs: [],
        description: "Description",
        scope: ["global"],
        language: "ts",
        enforcement: {
          lint: "warn",
          ci: "allow",
          scaffold: "none",
        },
      };

      const result = normalizeRuleMeta(rule, {
        minify: true,
        keepFields: ["description", "scope", "enforcement"],
      });

      expect(result.id).toBe("foundation.test");
      expect(result.version).toBe("1.0.0");
      expect(result.title).toBe("Test Rule");
      expect(result.category).toBe("foundation");
      expect(result.description).toBe("Description");
      expect(result.scope).toEqual(["global"]);
      expect(result.enforcement).toEqual({
        lint: "warn",
        ci: "allow",
        scaffold: "none",
      });
      expect(result.language).toBeUndefined();
    });

    it("should handle empty options", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        alwaysApply: true,
        globs: [],
      };

      const result = normalizeRuleMeta(rule);

      expect(result.alwaysApply).toBe(true);
      expect(result.globs).toBeUndefined();
      expect(result.description).toBeUndefined();
    });

    it("should handle undefined keepFields", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        description: "Description",
      };

      const result = normalizeRuleMeta(rule, { minify: true });

      expect(result.description).toBeUndefined();
    });

    it("should apply stripDefaults before pickEssential", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        alwaysApply: true,
        globs: [],
        description: "Description",
        scope: ["global"],
      };

      // First strip, then pick - empty arrays should be removed before picking
      const result = normalizeRuleMeta(rule, {
        minify: true,
        keepFields: ["globs"], // This won't be kept because it was empty and stripped
      });

      expect(result.globs).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.scope).toBeUndefined();
    });

    it("should handle full normalization workflow", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        alwaysApply: true,
        globs: [],
        frameworks: ["react"],
        description: "Test description",
        scope: ["global"],
        language: "ts",
        audience: ["frontend"],
        severity: "medium",
        order: 50,
        maturity: "stable",
        lifecycle: "enforced",
        owner: "owner@example.com",
      };

      const result = normalizeRuleMeta(rule, {
        minify: true,
        keepFields: ["description", "scope", "language"],
      });

      // Required fields always present
      expect(result.id).toBe("foundation.test");
      expect(result.version).toBe("1.0.0");
      expect(result.title).toBe("Test Rule");
      expect(result.category).toBe("foundation");

      // Kept fields
      expect(result.description).toBe("Test description");
      expect(result.scope).toEqual(["global"]);
      expect(result.language).toBe("ts");

      // Removed fields (alwaysApply is kept because it's in the common fields list)
      expect(result.alwaysApply).toBe(true);
      expect(result.globs).toBeUndefined();
      expect(result.frameworks).toBeUndefined();
      expect(result.audience).toBeUndefined();
      expect(result.severity).toBeUndefined();
      expect(result.order).toBeUndefined();
      expect(result.maturity).toBeUndefined();
      expect(result.lifecycle).toBeUndefined();
      expect(result.owner).toBeUndefined();
    });
  });

  describe("RECOMMENDED_FIELDS", () => {
    it("should contain the expected recommended fields", () => {
      const expectedFields = [
        "description",
        "scope",
        "globs",
        "language",
        "enforcement",
        "audience",
        "severity",
        "tags",
        "links",
        "order",
      ];

      expect(RECOMMENDED_FIELDS).toEqual(expectedFields);
    });

    it("should not contain required fields", () => {
      const requiredFields = ["id", "version", "title", "category"];

      for (const field of requiredFields) {
        expect(RECOMMENDED_FIELDS).not.toContain(field);
      }
    });

    it("should not contain administrative fields", () => {
      const adminFields = [
        "lifecycle",
        "maturity",
        "stability",
        "owner",
        "review",
        "license",
      ];

      for (const field of adminFields) {
        expect(RECOMMENDED_FIELDS).not.toContain(field);
      }
    });
  });

  describe("getAvailableMetadataFields", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return available fields from schema", () => {
      const fields = getAvailableMetadataFields();

      expect(fields).toBeInstanceOf(Array);
      expect(fields.length).toBeGreaterThan(0);
      // Should not include required fields
      expect(fields).not.toContain("id");
      expect(fields).not.toContain("version");
      expect(fields).not.toContain("title");
      expect(fields).not.toContain("category");
    });

    it("should return fields in alphabetical order", () => {
      const fields = getAvailableMetadataFields();
      const sorted = [...fields].sort();

      expect(fields).toEqual(sorted);
    });

    it("should include expected optional fields", () => {
      const fields = getAvailableMetadataFields();

      expect(fields).toContain("description");
      expect(fields).toContain("scope");
      expect(fields).toContain("globs");
      expect(fields).toContain("language");
      expect(fields).toContain("enforcement");
    });
  });

  describe("normalizeRuleMeta with RECOMMENDED_FIELDS", () => {
    it("should keep only recommended fields when minifying", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        description: "Test description",
        scope: ["global"],
        globs: ["**/*.ts"],
        language: "typescript",
        enforcement: {
          lint: "error",
          ci: "block",
          scaffold: "none",
        },
        audience: ["frontend"],
        severity: "high",
        tags: ["topic:test"],
        links: [{ rel: "docs", href: "https://example.com" }],
        order: 100,
        // Administrative fields that should be removed
        owner: "test@example.com",
        maturity: "stable",
        lifecycle: "enforced",
        license: "MIT",
      };

      const result = normalizeRuleMeta(rule, {
        minify: true,
        keepFields: RECOMMENDED_FIELDS,
      });

      // Required fields always present
      expect(result.id).toBe("foundation.test");
      expect(result.version).toBe("1.0.0");
      expect(result.title).toBe("Test Rule");
      expect(result.category).toBe("foundation");

      // Recommended fields should be kept
      expect(result.description).toBe("Test description");
      expect(result.scope).toEqual(["global"]);
      expect(result.globs).toEqual(["**/*.ts"]);
      expect(result.language).toBe("typescript");
      expect(result.enforcement).toEqual({
        lint: "error",
        ci: "block",
        scaffold: "none",
      });
      expect(result.audience).toEqual(["frontend"]);
      expect(result.severity).toBe("high");
      expect(result.tags).toEqual(["topic:test"]);
      expect(result.links).toEqual([
        { rel: "docs", href: "https://example.com" },
      ]);
      expect(result.order).toBe(100);

      // Administrative fields should be removed
      expect(result.owner).toBeUndefined();
      expect(result.maturity).toBeUndefined();
      expect(result.lifecycle).toBeUndefined();
      expect(result.license).toBeUndefined();
    });

    it("should handle missing recommended fields gracefully", () => {
      const rule: RuleMetadata = {
        ...createBaseRule(),
        // Only some recommended fields present
        description: "Test",
        scope: ["global"],
        // Other recommended fields missing
      };

      const result = normalizeRuleMeta(rule, {
        minify: true,
        keepFields: RECOMMENDED_FIELDS,
      });

      expect(result.description).toBe("Test");
      expect(result.scope).toEqual(["global"]);
      expect(result.globs).toBeUndefined();
      expect(result.language).toBeUndefined();
    });
  });
});
