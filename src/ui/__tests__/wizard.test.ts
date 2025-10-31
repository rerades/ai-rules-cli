import { describe, it, expect, vi, beforeEach } from "vitest";
import { runWizard } from "../wizard";
import type { CLIConfig } from "../../types/config.types";
import {
  RECOMMENDED_FIELDS,
  getAvailableMetadataFields,
} from "../../utils/meta-normalizer";

// Mock all dependencies
vi.mock("../prompts", () => ({
  createWelcomePrompt: vi.fn().mockResolvedValue(true),
  createCategorySelectionPrompt: vi.fn().mockResolvedValue(["foundation"]),
  createRuleSelectionPrompt: vi.fn().mockResolvedValue(["foundation.test"]),
  createOutputPathPrompt: vi.fn().mockResolvedValue("./output"),
  createReviewPrompt: vi.fn().mockResolvedValue(true),
  createConflictResolutionPrompt: vi.fn(),
  createGenerationConfirmationPrompt: vi.fn().mockResolvedValue(true),
  createMinificationPrompt: vi.fn(),
  createMinificationModePrompt: vi.fn(),
  createFieldSelectionPrompt: vi.fn(),
}));

vi.mock("../formatters", () => ({
  createWelcomeBanner: vi.fn().mockReturnValue("Welcome"),
  createSelectionSummary: vi.fn().mockReturnValue("Summary"),
  createSuccessMessage: vi.fn().mockReturnValue("Success"),
  createErrorMessage: vi.fn().mockReturnValue("Error"),
}));

vi.mock("../spinner", () => ({
  createLoadingSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
  createDependencySpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
  })),
  createConflictSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
  })),
  createGenerationSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
  createIndexSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
}));

vi.mock("../../core/rule-loader", () => ({
  loadAllRules: vi.fn().mockResolvedValue([
    {
      metadata: {
        id: "foundation.test",
        version: "1.0.0",
        title: "Test Rule",
        category: "foundation",
      },
      content: "# Test Rule",
      fileName: "foundation.test",
      filePath: "/test/foundation.test.mdx",
    },
  ]),
  getAvailableCategories: vi.fn().mockResolvedValue(["foundation"]),
}));

vi.mock("../../core/dependency-resolver", () => ({
  resolveComprehensive: vi.fn().mockResolvedValue({
    dependencies: [],
    conflicts: [],
    finalSelections: [
      {
        ruleId: "foundation.test",
        selected: true,
      },
    ],
  }),
}));

vi.mock("../../generators/output-generator", () => ({
  generateRuleFiles: vi.fn().mockResolvedValue({
    success: true,
    generatedFiles: ["./output/rules/foundation.test.mdc"],
    errors: [],
  }),
}));

vi.mock("../../generators/index-generator", () => ({
  generateIndexFile: vi.fn().mockResolvedValue({
    success: true,
  }),
}));

import * as promptsModule from "../prompts";
import * as outputGeneratorModule from "../../generators/output-generator";

const mockCreateMinificationPrompt = vi.mocked(
  promptsModule.createMinificationPrompt
);
const mockCreateMinificationModePrompt = vi.mocked(
  promptsModule.createMinificationModePrompt
);
const mockCreateFieldSelectionPrompt = vi.mocked(
  promptsModule.createFieldSelectionPrompt
);
const mockGenerateRuleFiles = vi.mocked(
  outputGeneratorModule.generateRuleFiles
);

describe("wizard minification integration", () => {
  const mockConfig: CLIConfig = {
    repository: {
      path: "/test",
      rulesDirectory: "rules",
      schemaPath: "schema.json",
    },
    output: {
      defaultDirectory: ".cursor",
      rulesDirectory: "rules",
    },
    ui: {
      colors: true,
      verbose: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mocks
    mockCreateMinificationPrompt.mockResolvedValue(false);
  });

  it("should pass normalizeOptions with minify: false when user does not want to minify", async () => {
    mockCreateMinificationPrompt.mockResolvedValue(false);

    await runWizard(mockConfig);

    expect(mockGenerateRuleFiles).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateRuleFiles.mock.calls[0];
    const normalizeOptions = callArgs?.[5];
    expect(normalizeOptions).toEqual({ minify: false });
  });

  it("should pass normalizeOptions with minimal mode", async () => {
    mockCreateMinificationPrompt.mockResolvedValue(true);
    mockCreateMinificationModePrompt.mockResolvedValue("minimal");

    await runWizard(mockConfig);

    expect(mockCreateMinificationModePrompt).toHaveBeenCalledTimes(1);
    expect(mockGenerateRuleFiles).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateRuleFiles.mock.calls[0];
    const normalizeOptions = callArgs?.[5];
    expect(normalizeOptions).toEqual({
      minify: true,
      keepFields: [],
    });
  });

  it("should pass normalizeOptions with recommended mode", async () => {
    mockCreateMinificationPrompt.mockResolvedValue(true);
    mockCreateMinificationModePrompt.mockResolvedValue("recommended");

    await runWizard(mockConfig);

    expect(mockCreateMinificationModePrompt).toHaveBeenCalledTimes(1);
    expect(mockCreateFieldSelectionPrompt).not.toHaveBeenCalled();
    expect(mockGenerateRuleFiles).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateRuleFiles.mock.calls[0];
    const normalizeOptions = callArgs?.[5];
    expect(normalizeOptions).toEqual({
      minify: true,
      keepFields: RECOMMENDED_FIELDS,
    });
  });

  it("should pass normalizeOptions with select mode and selected fields", async () => {
    const selectedFields = ["description", "scope", "tags"];
    const availableFields = getAvailableMetadataFields();

    mockCreateMinificationPrompt.mockResolvedValue(true);
    mockCreateMinificationModePrompt.mockResolvedValue("select");
    mockCreateFieldSelectionPrompt.mockResolvedValue(selectedFields);

    await runWizard(mockConfig);

    expect(mockCreateMinificationModePrompt).toHaveBeenCalledTimes(1);
    expect(mockCreateFieldSelectionPrompt).toHaveBeenCalledTimes(1);
    expect(mockCreateFieldSelectionPrompt).toHaveBeenCalledWith(
      availableFields
    );
    expect(mockGenerateRuleFiles).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateRuleFiles.mock.calls[0];
    const normalizeOptions = callArgs?.[5];
    expect(normalizeOptions).toEqual({
      minify: true,
      keepFields: selectedFields,
    });
  });

  it("should not call minification mode prompt when user does not want to minify", async () => {
    mockCreateMinificationPrompt.mockResolvedValue(false);

    await runWizard(mockConfig);

    expect(mockCreateMinificationModePrompt).not.toHaveBeenCalled();
    expect(mockCreateFieldSelectionPrompt).not.toHaveBeenCalled();
  });

  it("should handle all three minification modes correctly", async () => {
    const modes: Array<"minimal" | "recommended" | "select"> = [
      "minimal",
      "recommended",
      "select",
    ];

    for (const mode of modes) {
      vi.clearAllMocks();
      mockCreateMinificationPrompt.mockResolvedValue(true);
      mockCreateMinificationModePrompt.mockResolvedValue(mode);

      if (mode === "select") {
        mockCreateFieldSelectionPrompt.mockResolvedValue([
          "description",
          "scope",
        ]);
      }

      await runWizard(mockConfig);

      expect(mockCreateMinificationModePrompt).toHaveBeenCalledTimes(1);
      expect(mockGenerateRuleFiles).toHaveBeenCalledTimes(1);

      const callArgs = mockGenerateRuleFiles.mock.calls[0];
      const normalizeOptions = callArgs?.[5];

      switch (mode) {
        case "minimal":
          expect(normalizeOptions).toEqual({
            minify: true,
            keepFields: [],
          });
          break;
        case "recommended":
          expect(normalizeOptions).toEqual({
            minify: true,
            keepFields: RECOMMENDED_FIELDS,
          });
          break;
        case "select":
          expect(normalizeOptions).toEqual({
            minify: true,
            keepFields: ["description", "scope"],
          });
          break;
      }
    }
  });
});
