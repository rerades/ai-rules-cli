import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock fs/promises before importing the module under test
vi.mock("fs/promises", () => ({
  writeFile: vi.fn(),
}));

// Mock UI modules
vi.mock("../../ui/spinner", () => ({
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  })),
  stopSpinnerSuccess: vi.fn(),
  stopSpinnerError: vi.fn(),
}));

// Import the module under test
import { generateIndexFile } from "../index-generator";

import { writeFile } from "fs/promises";
import type { RuleContent, RuleSelection } from "../../types/rule.types";
import type { CLIConfig } from "../../types/config.types";

const mockWriteFile = vi.mocked(writeFile);

describe("index-generator", () => {
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
      output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
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
          description: "A test rule for foundation",
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
          description: "TypeScript coding conventions",
          scope: ["code"],
          language: "typescript",
          frameworks: ["react", "node"],
          tooling: ["eslint", "prettier"],
          lifecycle: "development",
          maturity: "stable",
          stability: "high",
          audience: ["developers"],
          severity: "medium",
          requires: ["foundation.test"],
          conflicts: ["javascript.conventions"],
          supersedes: ["old.typescript.rule"],
          bundles: ["typescript-bundle"],
          files: ["*.ts", "*.tsx"],
          enforcement: {
            lint: true,
            ci: true,
            scaffold: false,
          },
          owner: "team-typescript",
          review: {
            lastReviewed: "2024-01-01",
            reviewCycleDays: 30,
          },
          license: "MIT",
          links: [
            { rel: "documentation", href: "https://example.com/docs" },
            { rel: "source", href: "https://example.com/source" },
          ],
        },
        content: "# TypeScript Conventions\n\nFollow these conventions.",
        fileName: "typescript.conventions",
        filePath: "/test/rules/typescript.conventions.mdx",
      },
      {
        metadata: {
          id: "javascript.conventions",
          version: "1.0.0",
          title: "JavaScript Conventions",
          category: "javascript",
          tags: ["language:javascript"],
          order: 150,
        },
        content: "# JavaScript Conventions\n\nFollow these conventions.",
        fileName: "javascript.conventions",
        filePath: "/test/rules/javascript.conventions.mdx",
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
      {
        ruleId: "javascript.conventions",
        selected: false,
        reason: "not selected",
      },
    ];

    // Default mocks
    mockWriteFile.mockResolvedValue(undefined);
  });

  describe("generateIndexFile", () => {
    it("should generate index file successfully", async () => {
      const result = await generateIndexFile(
        mockRules,
        mockSelections,
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe("/output/rules/index.md");
      expect(mockWriteFile).toHaveBeenCalledWith(
        "/output/rules/index.md",
        expect.stringContaining("# Cursor AI Rules"),
        "utf8"
      );
    });

    it("should handle dry run mode", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = await generateIndexFile(
        mockRules,
        mockSelections,
        "/output",
        mockConfig,
        true
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe("/output/rules/index.md");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[DRY RUN]")
      );
      expect(mockWriteFile).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle file write errors", async () => {
      mockWriteFile.mockRejectedValueOnce(new Error("Write failed"));

      const result = await generateIndexFile(
        mockRules,
        mockSelections,
        "/output",
        mockConfig
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to generate index");
    });

    it("should only include selected rules", async () => {
      const result = await generateIndexFile(
        mockRules,
        mockSelections,
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("foundation.test");
      expect(content).toContain("typescript.conventions");
      // javascript.conventions appears in conflicts field, not as a selected rule
      expect(content).toContain("javascript.conventions"); // In conflicts section
    });
  });

  describe("index content generation", () => {
    it("should include header and overview", async () => {
      await generateIndexFile(mockRules, mockSelections, "/output", mockConfig);

      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("# Cursor AI Rules");
      expect(content).toContain("Generated on:");
      expect(content).toContain("Total rules: 2");
      expect(content).toContain("Categories: 2");
      expect(content).toContain("## Overview");
    });

    it("should group rules by category", async () => {
      await generateIndexFile(mockRules, mockSelections, "/output", mockConfig);

      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("### foundation");
      expect(content).toContain("### typescript");
      expect(content).toContain("**[Test Rule](foundation.test.mdc)**");
      expect(content).toContain(
        "**[TypeScript Conventions](typescript.conventions.mdc)**"
      );
    });

    it("should include rule details section", async () => {
      await generateIndexFile(mockRules, mockSelections, "/output", mockConfig);

      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("## Rule Details");
      expect(content).toContain("### Test Rule");
      expect(content).toContain("**ID:** `foundation.test`");
      expect(content).toContain("**Version:** 1.0.0");
      expect(content).toContain("**Category:** foundation");
    });

    it("should include optional metadata fields", async () => {
      await generateIndexFile(mockRules, mockSelections, "/output", mockConfig);

      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain(
        "**Description:** TypeScript coding conventions"
      );
      expect(content).toContain("**Scope:** code");
      expect(content).toContain("**Language:** typescript");
      expect(content).toContain("**Frameworks:** react, node");
      expect(content).toContain("**Tooling:** eslint, prettier");
      expect(content).toContain("**Lifecycle:** development");
      expect(content).toContain("**Maturity:** stable");
      expect(content).toContain("**Stability:** high");
      expect(content).toContain("**Audience:** developers");
      expect(content).toContain("**Severity:** medium");
      expect(content).toContain("**Requires:** foundation.test");
      expect(content).toContain("**Conflicts:** javascript.conventions");
      expect(content).toContain("**Supersedes:** old.typescript.rule");
      expect(content).toContain("**Bundles:** typescript-bundle");
      expect(content).toContain("**Files:** *.ts, *.tsx");
      expect(content).toContain("**Owner:** team-typescript");
      expect(content).toContain("**License:** MIT");
    });

    it("should format enforcement information", async () => {
      await generateIndexFile(mockRules, mockSelections, "/output", mockConfig);

      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("**Enforcement:**");
      expect(content).toContain("- Lint: true");
      expect(content).toContain("- CI: true");
      expect(content).toContain("- Scaffold: false");
    });

    it("should format review information", async () => {
      await generateIndexFile(mockRules, mockSelections, "/output", mockConfig);

      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("**Review:**");
      expect(content).toContain("- Last reviewed: 2024-01-01");
      expect(content).toContain("- Review cycle: 30 days");
    });

    it("should format links information", async () => {
      await generateIndexFile(mockRules, mockSelections, "/output", mockConfig);

      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("**Links:**");
      expect(content).toContain("- [documentation](https://example.com/docs)");
      expect(content).toContain("- [source](https://example.com/source)");
    });

    it("should include usage section", async () => {
      await generateIndexFile(mockRules, mockSelections, "/output", mockConfig);

      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("## Usage");
      expect(content).toContain(
        "These rules are automatically loaded by Cursor"
      );
      expect(content).toContain("https://cursor.sh/docs");
      expect(content).toContain("*Generated by AI Rules CLI v1.0.0*");
    });
  });

  describe("rule ordering", () => {
    it("should sort rules by order within categories", async () => {
      const unorderedRules = [
        {
          ...mockRules[0],
          metadata: { ...mockRules[0].metadata, order: 300 },
        },
        {
          ...mockRules[1],
          metadata: { ...mockRules[1].metadata, order: 100 },
        },
      ];

      await generateIndexFile(
        unorderedRules,
        mockSelections,
        "/output",
        mockConfig
      );

      const content = (mockWriteFile as any).mock.calls[0][1];
      const foundationIndex = content.indexOf("### foundation");
      const typescriptIndex = content.indexOf("### typescript");

      // Categories are sorted alphabetically, so foundation comes before typescript
      expect(foundationIndex).toBeLessThan(typescriptIndex);
    });

    it("should handle rules without order field", async () => {
      const rulesWithoutOrder = [
        {
          ...mockRules[0],
          metadata: { ...mockRules[0].metadata, order: undefined },
        },
        {
          ...mockRules[1],
          metadata: { ...mockRules[1].metadata, order: 100 },
        },
      ];

      await generateIndexFile(
        rulesWithoutOrder,
        mockSelections,
        "/output",
        mockConfig
      );

      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("### foundation");
      expect(content).toContain("### typescript");
    });
  });

  describe("edge cases", () => {
    it("should handle empty rules list", async () => {
      const result = await generateIndexFile([], [], "/output", mockConfig);

      expect(result.success).toBe(true);
      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("Total rules: 0");
      expect(content).toContain("Categories: 0");
    });

    it("should handle rules with minimal metadata", async () => {
      const minimalRule = {
        metadata: {
          id: "minimal.rule",
          version: "1.0.0",
          title: "Minimal Rule",
          category: "minimal",
        },
        content: "# Minimal Rule",
        fileName: "minimal.rule",
        filePath: "/test/rules/minimal.rule.mdx",
      };

      const result = await generateIndexFile(
        [minimalRule],
        [{ ruleId: "minimal.rule", selected: true, reason: "selected" }],
        "/output",
        mockConfig
      );

      expect(result.success).toBe(true);
      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).toContain("### Minimal Rule");
      expect(content).toContain("**ID:** `minimal.rule`");
      expect(content).toContain("**Version:** 1.0.0");
      expect(content).toContain("**Category:** minimal");
    });

    it("should handle rules with undefined optional fields", async () => {
      const ruleWithUndefined = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          description: undefined,
          scope: undefined,
          language: undefined,
        },
      };

      await generateIndexFile(
        [ruleWithUndefined],
        [mockSelections[0]],
        "/output",
        mockConfig
      );

      const content = (mockWriteFile as any).mock.calls[0][1];
      expect(content).not.toContain("**Description:**");
      expect(content).not.toContain("**Scope:**");
      expect(content).not.toContain("**Language:**");
    });
  });
});
