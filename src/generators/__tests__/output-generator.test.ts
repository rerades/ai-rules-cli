import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock fs/promises before importing the module under test
vi.mock("fs/promises", () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
}));

// Mock fs
vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

// Mock UI modules
vi.mock("../../ui/spinner", () => ({
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  })),
  updateSpinnerProgress: vi.fn(),
  stopSpinnerSuccess: vi.fn(),
  stopSpinnerError: vi.fn(),
}));

vi.mock("../../ui/formatters", () => ({
  formatFilePath: vi.fn((path) => path),
}));

// Import the module under test
import {
  generateRuleFiles,
  validateOutputPath,
  getRulesOutputPath,
  checkOutputDirectoryWritable,
  getFileStats,
} from "../output-generator";

import { writeFile, mkdir, stat, unlink } from "fs/promises";
import { existsSync } from "fs";
import type { RuleContent, RuleSelection } from "../../types/rule.types";
import type { CLIConfig } from "../../types/config.types";

const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);
const mockStat = vi.mocked(stat);
const mockUnlink = vi.mocked(unlink);
const mockExistsSync = vi.mocked(existsSync);

describe("output-generator", () => {
  let mockConfig: CLIConfig;
  let mockRules: RuleContent[];
  let mockSelections: RuleSelection[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfig = {
      repository: {
        path: "/test",
        rulesDirectory: "rules",
        schemaPath: "schema.json",
      },
      output: { defaultDirectory: ".cursor", rulesDirectory: ".cursor/rules" },
      ui: { colors: true, verbose: false },
    };

    mockRules = [
      {
        metadata: {
          id: "foundation.test",
          version: "1.0.0",
          title: "Test Rule",
          category: "foundation",
          tags: ["topic:test"],
          order: 100,
        },
        content: "# Test Rule\n\nThis is a test rule.",
        fileName: "foundation.test",
        filePath: "/test/rules/foundation.test.mdx",
      },
      {
        metadata: {
          id: "typescript.conventions",
          version: "1.0.0",
          title: "TypeScript Conventions",
          category: "typescript",
          tags: ["language:typescript"],
          order: 200,
        },
        content: "# TypeScript Conventions\n\nFollow these conventions.",
        fileName: "typescript.conventions",
        filePath: "/test/rules/typescript.conventions.mdx",
      },
    ];

    mockSelections = [
      {
        ruleId: "foundation.test",
        selected: true,
        reason: "manually selected",
      },
      {
        ruleId: "typescript.conventions",
        selected: true,
        reason: "manually selected",
      },
    ];

    // Default mocks
    mockExistsSync.mockReturnValue(false);
    mockWriteFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({ size: 1024 } as any);
    mockUnlink.mockResolvedValue(undefined);
  });

  describe("generateRuleFiles", () => {
    it("should generate rule files successfully", async () => {
      const result = await generateRuleFiles(
        mockRules,
        mockSelections,
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      expect(result.generatedFiles).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
    });

    it("should handle dry run mode", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = await generateRuleFiles(
        mockRules,
        mockSelections,
        "/output",
        mockConfig,
        true
      );

      expect(result.success).toBe(true);
      expect(result.generatedFiles).toHaveLength(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[DRY RUN]")
      );
      expect(mockWriteFile).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle missing rules", async () => {
      const invalidSelections = [
        { ruleId: "missing.rule", selected: true, reason: "manually selected" },
      ];

      const result = await generateRuleFiles(
        mockRules,
        invalidSelections,
        "/output",
        mockConfig
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Rule not found: missing.rule");
    });

    it("should handle file write errors", async () => {
      mockWriteFile.mockRejectedValueOnce(new Error("Write failed"));

      const result = await generateRuleFiles(
        mockRules,
        mockSelections,
        "/output",
        mockConfig
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Failed to generate");
    });

    it("should handle directory creation errors", async () => {
      mockMkdir.mockRejectedValueOnce(new Error("Directory creation failed"));

      const result = await generateRuleFiles(
        mockRules,
        mockSelections,
        "/output",
        mockConfig
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("validateOutputPath", () => {
    it("should validate valid output paths", () => {
      const result = validateOutputPath("/valid/path");

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty paths", () => {
      const result = validateOutputPath("");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Output path cannot be empty");
    });

    it("should reject paths with parent directory references", () => {
      const result = validateOutputPath("/path/../other");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Output path cannot contain parent directory references"
      );
    });

    it("should reject paths with multiple parent directory references", () => {
      const result = validateOutputPath("/path/../../other");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Output path cannot contain parent directory references"
      );
    });
  });

  describe("getRulesOutputPath", () => {
    it("should construct correct rules output path", () => {
      const result = getRulesOutputPath("/output", mockConfig);

      expect(result).toBe("/output/.cursor/rules");
    });

    it("should handle different config rules directory", () => {
      const customConfig = {
        ...mockConfig,
        output: { ...mockConfig.output, rulesDirectory: "custom-rules" },
      };

      const result = getRulesOutputPath("/output", customConfig);

      expect(result).toBe("/output/custom-rules");
    });

    it("should use .cursor/rules as default subdirectory", () => {
      const result = getRulesOutputPath("./", mockConfig);

      // join normalizes paths, so "./.cursor/rules" becomes ".cursor/rules"
      expect(result).toBe(".cursor/rules");
    });
  });

  describe("checkOutputDirectoryWritable", () => {
    it("should return true for writable directory", async () => {
      const result = await checkOutputDirectoryWritable("/writable/path");

      expect(result).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        "/writable/path/.ai-rules-test",
        "test"
      );
      expect(mockUnlink).toHaveBeenCalledWith("/writable/path/.ai-rules-test");
    });

    it("should return false for non-writable directory", async () => {
      mockWriteFile.mockRejectedValueOnce(new Error("Permission denied"));

      const result = await checkOutputDirectoryWritable("/readonly/path");

      expect(result).toBe(false);
    });

    it("should return false when cleanup fails", async () => {
      mockUnlink.mockRejectedValueOnce(new Error("Cleanup failed"));

      const result = await checkOutputDirectoryWritable("/writable/path");

      // The function catches all errors and returns false
      expect(result).toBe(false);
    });
  });

  describe("getFileStats", () => {
    it("should calculate file statistics", async () => {
      mockStat
        .mockResolvedValueOnce({ size: 1024 } as any)
        .mockResolvedValueOnce({ size: 2048 } as any);

      const result = await getFileStats(["/file1", "/file2"]);

      expect(result.totalFiles).toBe(2);
      expect(result.totalSize).toBe(3072);
      expect(result.averageSize).toBe(1536);
    });

    it("should handle missing files", async () => {
      mockStat
        .mockResolvedValueOnce({ size: 1024 } as any)
        .mockRejectedValueOnce(new Error("File not found"));

      const result = await getFileStats(["/file1", "/missing"]);

      expect(result.totalFiles).toBe(2);
      expect(result.totalSize).toBe(1024);
      expect(result.averageSize).toBe(512);
    });

    it("should handle empty file list", async () => {
      const result = await getFileStats([]);

      expect(result.totalFiles).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.averageSize).toBe(0);
    });
  });

  describe("frontmatter generation", () => {
    it("should generate proper frontmatter for rule files", async () => {
      const result = await generateRuleFiles(
        mockRules,
        mockSelections,
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledTimes(2);

      // Check that the first call contains the foundation rule
      const firstCall = (mockWriteFile as any).mock.calls[0];
      expect(firstCall[0]).toContain("foundation.test.mdc");
      expect(firstCall[1]).toContain('id: "foundation.test"');
    });

    it("should handle rules with complex metadata", async () => {
      const complexRule = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          requires: ["other.rule"],
          conflicts: ["conflicting.rule"],
          tags: ["tag1", "tag2"],
          order: 50,
        },
      };

      const result = await generateRuleFiles(
        [complexRule],
        [mockSelections[0]],
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledTimes(1);

      // Check that the call contains the requires field
      const call = (mockWriteFile as any).mock.calls[0];
      expect(call[1]).toContain("requires:");
    });
  });

  describe("edge cases", () => {
    it("should handle empty selections", async () => {
      const result = await generateRuleFiles(
        mockRules,
        [],
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      expect(result.generatedFiles).toHaveLength(0);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it("should handle rules with undefined metadata fields", async () => {
      const ruleWithUndefined = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          description: "Original description",
          order: 100,
        },
      };

      // Now set them to undefined
      ruleWithUndefined.metadata.description = undefined;
      ruleWithUndefined.metadata.order = undefined;

      const result = await generateRuleFiles(
        [ruleWithUndefined],
        [mockSelections[0]],
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledTimes(1);

      // Check that the call contains the foundation rule but not description
      const call = (mockWriteFile as any).mock.calls[0];
      expect(call[1]).toContain('id: "foundation.test"');
      expect(call[1]).not.toContain("description:");
    });

    it("should handle directory that already exists", async () => {
      mockExistsSync.mockReturnValue(true);

      const result = await generateRuleFiles(
        mockRules,
        mockSelections,
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      expect(mockMkdir).not.toHaveBeenCalled();
    });
  });

  describe("normalization options", () => {
    it("should strip defaults when no options provided", async () => {
      const ruleWithDefaults = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          alwaysApply: true,
          globs: [],
          frameworks: [],
        },
      };

      const result = await generateRuleFiles(
        [ruleWithDefaults],
        [mockSelections[0]],
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      const call = (mockWriteFile as any).mock.calls[0];
      // alwaysApply is always kept now
      expect(call[1]).toContain("alwaysApply:");
      expect(call[1]).not.toContain("globs:");
      expect(call[1]).not.toContain("frameworks:");
    });

    it("should minify frontmatter when minify option is enabled", async () => {
      const ruleWithExtras = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          description: "Test description",
          scope: ["global"],
          language: "ts",
          order: 100,
          maturity: "stable",
        },
      };

      const result = await generateRuleFiles(
        [ruleWithExtras],
        [mockSelections[0]],
        "/output",
        mockConfig,
        false,
        { minify: true }
      );

      expect(result.success).toBe(true);
      const call = (mockWriteFile as any).mock.calls[0];
      const content = call[1];

      // Should have required fields
      expect(content).toContain('id: "foundation.test"');
      expect(content).toContain('version: "1.0.0"');
      expect(content).toContain('title: "Test Rule"');
      expect(content).toContain('category: "foundation"');

      // Should not have optional fields not in keepFields
      expect(content).not.toContain("description:");
      expect(content).not.toContain("scope:");
      expect(content).not.toContain("language:");
      expect(content).not.toContain("order:");
      expect(content).not.toContain("maturity:");
    });

    it("should keep specified fields when keepFields is provided", async () => {
      const ruleWithExtras = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          description: "Test description",
          scope: ["global"],
          language: "ts",
          enforcement: {
            lint: "warn",
            ci: "allow",
            scaffold: "none",
          },
          order: 100,
        },
      };

      const result = await generateRuleFiles(
        [ruleWithExtras],
        [mockSelections[0]],
        "/output",
        mockConfig,
        false,
        {
          minify: true,
          keepFields: ["description", "scope", "enforcement"],
        }
      );

      expect(result.success).toBe(true);
      const call = (mockWriteFile as any).mock.calls[0];
      const content = call[1];

      // Should have required fields
      expect(content).toContain('id: "foundation.test"');
      expect(content).toContain('version: "1.0.0"');
      expect(content).toContain('title: "Test Rule"');
      expect(content).toContain('category: "foundation"');

      // Should have kept fields
      expect(content).toContain("description:");
      expect(content).toContain("scope:");
      expect(content).toContain("enforcement:");

      // Should not have fields not in keepFields
      expect(content).not.toContain("language:");
      expect(content).not.toContain("order:");
    });

    it("should maintain stable key ordering in frontmatter", async () => {
      const ruleWithManyFields = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          description: "Description",
          scope: ["global"],
          language: "ts",
          order: 50,
        },
      };

      const result = await generateRuleFiles(
        [ruleWithManyFields],
        [mockSelections[0]],
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      const call = (mockWriteFile as any).mock.calls[0];
      const content = call[1];

      // Extract frontmatter section
      const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).not.toBeNull();

      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const lines = frontmatter
          .split("\n")
          .filter((line: string) => line.trim());

        // Required fields should be first
        expect(lines[0]).toContain("id:");
        expect(lines[1]).toContain("version:");
        expect(lines[2]).toContain("title:");
        expect(lines[3]).toContain("category:");
      }
    });

    it("should remove empty arrays even when not minifying", async () => {
      const ruleWithEmptyArrays = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          globs: [],
          frameworks: [],
          requires: [],
          tags: [],
        },
      };

      const result = await generateRuleFiles(
        [ruleWithEmptyArrays],
        [mockSelections[0]],
        "/output",
        mockConfig,
        false,
        { minify: false }
      );

      expect(result.success).toBe(true);
      const call = (mockWriteFile as any).mock.calls[0];
      const content = call[1];

      expect(content).not.toContain("globs:");
      expect(content).not.toContain("frameworks:");
      expect(content).not.toContain("requires:");
      expect(content).not.toContain("tags:");
    });
  });
});
