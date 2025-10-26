import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock fs/promises before importing the module under test
vi.mock("fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
}));

// Mock gray-matter
vi.mock("gray-matter", () => ({
  default: vi.fn(),
}));

// Mock config module
vi.mock("../config", () => ({
  getRulesDirectoryPath: vi.fn(),
  getRuleFilePath: vi.fn(),
}));

// Mock rule-validator module
vi.mock("../rule-validator", () => ({
  validateRuleComprehensive: vi.fn(),
}));

// Mock logger
vi.mock("../../utils/logger", () => ({
  Logger: vi.fn(() => ({
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Import the module under test
import {
  loadAllRules,
  loadRuleFromFile,
  loadRuleById,
  loadRulesByCategory,
  loadRulesByCategories,
  getAvailableCategories,
  getAvailableRuleIds,
  searchRules,
  getRulesRequiring,
  getRulesConflictingWith,
  clearRulesCache,
  getCacheStats,
} from "../rule-loader";

import { readdir, readFile } from "fs/promises";
import matter from "gray-matter";
import type { RuleMetadata, RuleContent } from "../../types/rule.types";
import type { CLIConfig } from "../../types/config.types";
import * as configModule from "../config";
import * as ruleValidatorModule from "../rule-validator";

const mockGetRulesDirectoryPath = vi.mocked(configModule.getRulesDirectoryPath);
const mockGetRuleFilePath = vi.mocked(configModule.getRuleFilePath);
const mockValidateRuleComprehensive = vi.mocked(
  ruleValidatorModule.validateRuleComprehensive
);

describe("rule-loader", () => {
  let mockConfig: CLIConfig;

  const mockRuleMetadata: RuleMetadata = {
    id: "foundation.test",
    version: "1.0.0",
    title: "Test Rule",
    category: "foundation",
    tags: ["topic:test"],
    order: 100,
  };

  const mockRuleContent: RuleContent = {
    metadata: mockRuleMetadata,
    content: "# Test Rule\n\nThis is a test rule.",
    fileName: "foundation.test",
    filePath: "/test/rules/foundation.test.mdx",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearRulesCache();

    // Create fresh config for each test
    mockConfig = {
      repository: {
        path: "/test",
        rulesDirectory: "rules",
        schemaPath: "schema.json",
      },
      output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
      ui: { colors: true, verbose: false },
    };

    // Setup default mocks
    mockGetRulesDirectoryPath.mockReturnValue("/test/rules");
    mockGetRuleFilePath.mockImplementation(
      (_, fileName) => `/test/rules/${fileName}.mdx`
    );
    mockValidateRuleComprehensive.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    });
  });

  describe("loadRuleFromFile", () => {
    it("should load rule from file successfully", async () => {
      const mockFileContent =
        "---\nid: foundation.test\nversion: 1.0.0\ntitle: Test Rule\n---\n# Test Rule\n\nThis is a test rule.";
      (readFile as any).mockResolvedValue(mockFileContent);
      (matter as any).mockReturnValue({
        data: mockRuleMetadata,
        content: "# Test Rule\n\nThis is a test rule.",
      });

      const result = await loadRuleFromFile(mockConfig, "foundation.test.mdx");

      expect(result).toEqual({
        ...mockRuleContent,
        filePath: "/test/rules/foundation.test.mdx",
      });
      expect(readFile).toHaveBeenCalled();
      expect(matter).toHaveBeenCalledWith(mockFileContent);
    });

    it("should handle file read errors", async () => {
      (readFile as any).mockRejectedValue(new Error("File not found"));

      const result = await loadRuleFromFile(mockConfig, "nonexistent.mdx");
      expect(result).toBeNull();
    });

    it("should handle gray-matter parsing errors", async () => {
      const mockFileContent = "invalid yaml content";
      (readFile as any).mockResolvedValue(mockFileContent);
      (matter as any).mockImplementation(() => {
        throw new Error("YAML parsing error");
      });

      const result = await loadRuleFromFile(mockConfig, "invalid.mdx");
      expect(result).toBeNull();
    });
  });

  describe("loadAllRules", () => {
    it("should load all rules from directory", async () => {
      const mockFiles = ["foundation.test.mdx", "typescript.conventions.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\n---\n# Test"
      );
      (matter as any).mockReturnValue({
        data: mockRuleMetadata,
        content: "# Test",
      });

      const result = await loadAllRules(mockConfig);

      expect(result).toHaveLength(2);
      expect(readdir).toHaveBeenCalledWith("/test/rules");
    });

    it("should handle directory read errors", async () => {
      (readdir as any).mockRejectedValue(new Error("Directory not found"));

      await expect(loadAllRules(mockConfig)).rejects.toThrow();
    });

    it("should filter out non-mdx files", async () => {
      const mockFiles = [
        "foundation.test.mdx",
        "readme.txt",
        "typescript.conventions.mdx",
      ];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\n---\n# Test"
      );
      (matter as any).mockReturnValue({
        data: mockRuleMetadata,
        content: "# Test",
      });

      const result = await loadAllRules(mockConfig);

      expect(result).toHaveLength(2); // Only .mdx files
    });
  });

  describe("loadRuleById", () => {
    it("should load rule by ID successfully", async () => {
      const mockFiles = ["foundation.test.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\n---\n# Test"
      );
      (matter as any).mockReturnValue({
        data: mockRuleMetadata,
        content: "# Test",
      });

      const result = await loadRuleById(mockConfig, "foundation.test");

      expect(result).toBeDefined();
      expect(result?.metadata.id).toBe("foundation.test");
    });

    it("should return undefined when rule not found", async () => {
      const mockFiles = ["other.rule.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue("---\nid: other.rule\n---\n# Test");
      (matter as any).mockReturnValue({
        data: { ...mockRuleMetadata, id: "other.rule" },
        content: "# Test",
      });

      const result = await loadRuleById(mockConfig, "foundation.test");

      expect(result).toBeNull();
    });
  });

  describe("loadRulesByCategory", () => {
    it("should load rules by category successfully", async () => {
      const mockFiles = ["foundation.test.mdx", "typescript.conventions.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\n---\n# Test"
      );
      (matter as any).mockReturnValue({
        data: mockRuleMetadata,
        content: "# Test",
      });

      const result = await loadRulesByCategory(mockConfig, "foundation");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array when no rules found for category", async () => {
      const mockFiles = ["typescript.conventions.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: typescript.conventions\n---\n# Test"
      );
      (matter as any).mockReturnValue({
        data: {
          ...mockRuleMetadata,
          id: "typescript.conventions",
          category: "typescript",
        },
        content: "# Test",
      });

      const result = await loadRulesByCategory(mockConfig, "foundation");

      expect(result).toHaveLength(0);
    });
  });

  describe("loadRulesByCategories", () => {
    it("should load rules by multiple categories", async () => {
      const mockFiles = ["foundation.test.mdx", "typescript.conventions.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\n---\n# Test"
      );
      (matter as any).mockReturnValue({
        data: mockRuleMetadata,
        content: "# Test",
      });

      const result = await loadRulesByCategories(mockConfig, [
        "foundation",
        "typescript",
      ]);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getAvailableCategories", () => {
    it("should return available categories", async () => {
      const mockFiles = ["foundation.test.mdx", "typescript.conventions.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\n---\n# Test"
      );
      (matter as any).mockReturnValue({
        data: mockRuleMetadata,
        content: "# Test",
      });

      const result = await getAvailableCategories(mockConfig);

      expect(result).toContain("foundation");
    });
  });

  describe("getAvailableRuleIds", () => {
    it("should return available rule IDs", async () => {
      const mockFiles = ["foundation.test.mdx", "typescript.conventions.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\n---\n# Test"
      );
      (matter as any).mockReturnValue({
        data: mockRuleMetadata,
        content: "# Test",
      });

      const result = await getAvailableRuleIds(mockConfig);

      expect(result).toContain("foundation.test");
    });
  });

  describe("searchRules", () => {
    it("should search rules by query", async () => {
      const mockFiles = ["foundation.test.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\n---\n# Test Rule"
      );
      (matter as any).mockReturnValue({
        data: mockRuleMetadata,
        content: "# Test Rule",
      });

      const result = await searchRules(mockConfig, "test");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty results when no matches found", async () => {
      const mockFiles = ["foundation.test.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\n---\n# Test Rule"
      );
      (matter as any).mockReturnValue({
        data: mockRuleMetadata,
        content: "# Test Rule",
      });

      const result = await searchRules(mockConfig, "nonexistent");

      expect(result).toHaveLength(0);
    });
  });

  describe("getRulesRequiring", () => {
    it("should return rules that require a specific rule", async () => {
      const mockFiles = ["foundation.test.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\nrequires: [other.rule]\n---\n# Test"
      );
      (matter as any).mockReturnValue({
        data: { ...mockRuleMetadata, requires: ["other.rule"] },
        content: "# Test",
      });

      const result = await getRulesRequiring(mockConfig, "other.rule");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getRulesConflictingWith", () => {
    it("should return rules that conflict with a specific rule", async () => {
      const mockFiles = ["foundation.test.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue(
        "---\nid: foundation.test\nconflicts: [other.rule]\n---\n# Test"
      );
      (matter as any).mockReturnValue({
        data: { ...mockRuleMetadata, conflicts: ["other.rule"] },
        content: "# Test",
      });

      const result = await getRulesConflictingWith(mockConfig, "other.rule");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("cache management", () => {
    it("should clear rules cache", () => {
      clearRulesCache();
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
    });

    it("should return cache statistics", () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("keys");
    });
  });

  describe("edge cases", () => {
    it("should handle empty directory", async () => {
      (readdir as any).mockResolvedValue([]);

      const result = await loadAllRules(mockConfig);

      expect(result).toHaveLength(0);
    });

    it("should handle files without frontmatter", async () => {
      const mockFiles = ["foundation.test.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue("# Test Rule\n\nNo frontmatter");
      (matter as any).mockReturnValue({
        data: {},
        content: "# Test Rule\n\nNo frontmatter",
      });

      const result = await loadAllRules(mockConfig);

      expect(result).toHaveLength(0); // Should skip rules without proper metadata
    });

    it("should handle malformed rule metadata", async () => {
      const mockFiles = ["foundation.test.mdx"];
      (readdir as any).mockResolvedValue(mockFiles);
      (readFile as any).mockResolvedValue("---\ninvalid: yaml\n---\n# Test");
      (matter as any).mockReturnValue({
        data: { invalid: "yaml" },
        content: "# Test",
      });

      // Mock validation to return invalid for this test
      mockValidateRuleComprehensive.mockReturnValueOnce({
        isValid: false,
        errors: ["Invalid rule metadata"],
        warnings: [],
      });

      const result = await loadAllRules(mockConfig);

      expect(result).toHaveLength(0); // Should skip invalid rules
    });
  });
});
