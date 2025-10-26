import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock rule-loader module
vi.mock("../rule-loader", () => ({
  loadAllRules: vi.fn(),
  getAvailableRuleIds: vi.fn(),
}));

// Import the module under test
import {
  resolveDependencies,
  detectConflicts,
  resolveAllDependencies,
  createRuleSelections,
  validateRuleAvailability,
  sortRulesByOrder,
  getSupersedingRules,
  removeSupersededRules,
  resolveComprehensive,
} from "../dependency-resolver";

import { loadAllRules, getAvailableRuleIds } from "../rule-loader";
import type {
  RuleContent,
  RuleMetadata,
} from "../../types/rule.types";
import type { CLIConfig } from "../../types/config.types";

const mockLoadAllRules = vi.mocked(loadAllRules);
const mockGetAvailableRuleIds = vi.mocked(getAvailableRuleIds);

describe("dependency-resolver", () => {
  let mockConfig: CLIConfig;
  let mockRules: RuleContent[];
  let mockRuleMetadata: RuleMetadata;

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

    mockRuleMetadata = {
      id: "foundation.test",
      version: "1.0.0",
      title: "Test Rule",
      category: "foundation",
      tags: ["topic:test"],
      order: 100,
    };

    mockRules = [
      {
        metadata: mockRuleMetadata,
        content: "# Test Rule",
        fileName: "foundation.test",
        filePath: "/test/rules/foundation.test.mdx",
      },
      {
        metadata: {
          ...mockRuleMetadata,
          id: "typescript.conventions",
          category: "typescript",
          requires: ["foundation.test"],
        },
        content: "# TypeScript Conventions",
        fileName: "typescript.conventions",
        filePath: "/test/rules/typescript.conventions.mdx",
      },
      {
        metadata: {
          ...mockRuleMetadata,
          id: "conflicting.rule",
          category: "conflict",
          conflicts: ["foundation.test"],
        },
        content: "# Conflicting Rule",
        fileName: "conflicting.rule",
        filePath: "/test/rules/conflicting.rule.mdx",
      },
    ];

    mockLoadAllRules.mockResolvedValue(mockRules);
    mockGetAvailableRuleIds.mockResolvedValue([
      "foundation.test",
      "typescript.conventions",
      "conflicting.rule",
    ]);
  });

  describe("resolveDependencies", () => {
    it("should resolve dependencies for rules with requirements", async () => {
      const result = await resolveDependencies(
        ["typescript.conventions"],
        mockConfig
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ruleId: "typescript.conventions",
        missingDependencies: [],
        addedDependencies: ["foundation.test"],
      });
    });

    it("should handle missing dependencies", async () => {
      mockGetAvailableRuleIds.mockResolvedValueOnce(["typescript.conventions"]);

      const result = await resolveDependencies(
        ["typescript.conventions"],
        mockConfig
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ruleId: "typescript.conventions",
        missingDependencies: ["foundation.test"],
        addedDependencies: [],
      });
    });

    it("should handle rules without dependencies", async () => {
      const result = await resolveDependencies(["foundation.test"], mockConfig);

      expect(result).toHaveLength(0);
    });

    it("should handle empty selection", async () => {
      const result = await resolveDependencies([], mockConfig);

      expect(result).toHaveLength(0);
    });
  });

  describe("detectConflicts", () => {
    it("should detect conflicts between rules", async () => {
      const result = await detectConflicts(
        ["foundation.test", "conflicting.rule"],
        mockConfig
      );

      expect(result).toHaveLength(2); // Bidirectional conflicts
      expect(result[0]).toEqual({
        ruleId1: "foundation.test",
        ruleId2: "conflicting.rule",
        reason: "Rule 'conflicting.rule' conflicts with rule 'foundation.test'",
      });
    });

    it("should handle rules without conflicts", async () => {
      const result = await detectConflicts(
        ["foundation.test", "typescript.conventions"],
        mockConfig
      );

      expect(result).toHaveLength(0);
    });

    it("should handle empty selection", async () => {
      const result = await detectConflicts([], mockConfig);

      expect(result).toHaveLength(0);
    });
  });

  describe("resolveAllDependencies", () => {
    it("should resolve dependencies and conflicts together", async () => {
      const result = await resolveAllDependencies(
        ["typescript.conventions"],
        mockConfig
      );

      expect(result.dependencies).toHaveLength(1);
      expect(result.conflicts).toHaveLength(0);
      expect(result.finalRuleIds).toContain("typescript.conventions");
      expect(result.finalRuleIds).toContain("foundation.test");
    });

    it("should handle conflicts in final rule IDs", async () => {
      const result = await resolveAllDependencies(
        ["foundation.test", "conflicting.rule"],
        mockConfig
      );

      expect(result.conflicts).toHaveLength(2); // Bidirectional conflicts
      expect(result.finalRuleIds).toContain("foundation.test");
      expect(result.finalRuleIds).toContain("conflicting.rule");
    });
  });

  describe("createRuleSelections", () => {
    it("should create rule selections from rule IDs", () => {
      const result = createRuleSelections(
        ["foundation.test", "typescript.conventions"],
        mockRules
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ruleId: "foundation.test",
        selected: true,
        reason: "manually selected",
      });
      expect(result[1]).toEqual({
        ruleId: "typescript.conventions",
        selected: true,
        reason: "manually selected",
      });
    });

    it("should mark missing rules as dependencies", () => {
      const result = createRuleSelections(["missing.rule"], mockRules);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ruleId: "missing.rule",
        selected: true,
        reason: "dependency",
      });
    });
  });

  describe("validateRuleAvailability", () => {
    it("should validate available and missing rules", async () => {
      const result = await validateRuleAvailability(
        ["foundation.test", "missing.rule"],
        mockConfig
      );

      expect(result.available).toEqual(["foundation.test"]);
      expect(result.missing).toEqual(["missing.rule"]);
    });

    it("should handle all available rules", async () => {
      const result = await validateRuleAvailability(
        ["foundation.test", "typescript.conventions"],
        mockConfig
      );

      expect(result.available).toEqual([
        "foundation.test",
        "typescript.conventions",
      ]);
      expect(result.missing).toHaveLength(0);
    });
  });

  describe("sortRulesByOrder", () => {
    it("should sort rules by order field", () => {
      const rulesWithOrder = [
        { ...mockRules[0], metadata: { ...mockRules[0].metadata, order: 200 } },
        { ...mockRules[1], metadata: { ...mockRules[1].metadata, order: 100 } },
        { ...mockRules[2], metadata: { ...mockRules[2].metadata, order: 150 } },
      ];

      const result = sortRulesByOrder(rulesWithOrder);

      expect(result[0].metadata.order).toBe(100);
      expect(result[1].metadata.order).toBe(150);
      expect(result[2].metadata.order).toBe(200);
    });

    it("should handle rules without order field", () => {
      const rulesWithoutOrder = [
        {
          ...mockRules[0],
          metadata: { ...mockRules[0].metadata, order: undefined },
        },
        { ...mockRules[1], metadata: { ...mockRules[1].metadata, order: 100 } },
      ];

      const result = sortRulesByOrder(rulesWithoutOrder);

      expect(result[0].metadata.order).toBe(100);
      expect(result[1].metadata.order).toBeUndefined();
    });
  });

  describe("getSupersedingRules", () => {
    it("should find rules that supersede others", async () => {
      const supersedingRule = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          id: "new.foundation.rule",
          supersedes: ["foundation.test"],
        },
      };

      mockLoadAllRules.mockResolvedValueOnce([...mockRules, supersedingRule]);

      const result = await getSupersedingRules(
        ["foundation.test", "new.foundation.rule"],
        mockConfig
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        superseded: "foundation.test",
        superseding: "new.foundation.rule",
      });
    });

    it("should handle rules without superseding", async () => {
      const result = await getSupersedingRules(
        ["foundation.test", "typescript.conventions"],
        mockConfig
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("removeSupersededRules", () => {
    it("should remove superseded rules from selection", async () => {
      const supersedingRule = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          id: "new.foundation.rule",
          supersedes: ["foundation.test"],
        },
      };

      mockLoadAllRules.mockResolvedValueOnce([...mockRules, supersedingRule]);

      const result = await removeSupersededRules(
        ["foundation.test", "new.foundation.rule"],
        mockConfig
      );

      expect(result).toEqual(["new.foundation.rule"]);
    });

    it("should return original selection when no superseding", async () => {
      const result = await removeSupersededRules(
        ["foundation.test", "typescript.conventions"],
        mockConfig
      );

      expect(result).toEqual(["foundation.test", "typescript.conventions"]);
    });
  });

  describe("resolveComprehensive", () => {
    it("should perform comprehensive resolution", async () => {
      const result = await resolveComprehensive(
        ["typescript.conventions"],
        mockConfig
      );

      expect(result.finalSelections).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.superseding).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it("should include warnings for missing rules", async () => {
      const result = await resolveComprehensive(["missing.rule"], mockConfig);

      expect(result.warnings).toContain("Missing rules: missing.rule");
    });

    it("should include warnings for missing dependencies", async () => {
      // Create a rule that requires a missing dependency
      const ruleWithMissingDep = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          id: "rule.with.missing.dep",
          requires: ["missing.dependency"],
        },
      };

      mockLoadAllRules.mockResolvedValueOnce([ruleWithMissingDep]);
      mockGetAvailableRuleIds.mockResolvedValueOnce(["rule.with.missing.dep"]);

      const result = await resolveComprehensive(
        ["rule.with.missing.dep"],
        mockConfig
      );

      expect(result.warnings).toContain(
        "Rule 'rule.with.missing.dep' has missing dependencies: missing.dependency"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle circular dependencies", async () => {
      const circularRule1 = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          id: "circular.rule1",
          requires: ["circular.rule2"],
        },
      };
      const circularRule2 = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          id: "circular.rule2",
          requires: ["circular.rule1"],
        },
      };

      mockLoadAllRules.mockResolvedValueOnce([circularRule1, circularRule2]);
      mockGetAvailableRuleIds.mockResolvedValueOnce([
        "circular.rule1",
        "circular.rule2",
      ]);

      const result = await resolveDependencies(["circular.rule1"], mockConfig);

      expect(result).toHaveLength(1);
      expect(result[0].ruleId).toBe("circular.rule1");
    });

    it("should handle rules with multiple conflicts", async () => {
      const multiConflictRule = {
        ...mockRules[0],
        metadata: {
          ...mockRules[0].metadata,
          id: "multi.conflict.rule",
          conflicts: ["foundation.test", "typescript.conventions"],
        },
      };

      mockLoadAllRules.mockResolvedValueOnce([...mockRules, multiConflictRule]);

      const result = await detectConflicts(
        ["foundation.test", "typescript.conventions", "multi.conflict.rule"],
        mockConfig
      );

      expect(result.length).toBeGreaterThanOrEqual(2); // Multiple conflicts expected
    });
  });
});
