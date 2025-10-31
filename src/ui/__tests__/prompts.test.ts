import { describe, it, expect, vi, beforeEach } from "vitest";
import inquirer from "inquirer";
import {
  createMinificationPrompt,
  createMinificationModePrompt,
  createFieldSelectionPrompt,
} from "../prompts";

vi.mock("inquirer");

const mockInquirer = vi.mocked(inquirer);

describe("Minification prompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMinificationPrompt", () => {
    it("should return true when user selects to minify", async () => {
      // Use 'mockImplementation' to only override prompt and avoid type error
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ minify: true })
      );

      const result = await createMinificationPrompt();

      expect(result).toBe(true);
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1);
    });

    it("should return false when user does not want to minify", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ minify: false })
      );

      const result = await createMinificationPrompt();

      expect(result).toBe(false);
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1);
    });

    it("should return 'minimal' when selected", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ mode: "minimal" })
      );

      const result = await createMinificationModePrompt();

      expect(result).toBe("minimal");
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1);
    });

    it("should return 'recommended' when selected", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ mode: "recommended" })
      );

      const result = await createMinificationModePrompt();

      expect(result).toBe("recommended");
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1);
    });

    it("should return 'select' when selected", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ mode: "select" })
      );

      const result = await createMinificationModePrompt();

      expect(result).toBe("select");
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1);
    });

    it("should have all three mode options", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ mode: "recommended" })
      );

      await createMinificationModePrompt();

      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1);
    });

    it("should use correct prompt configuration", async () => {
      // Use mockImplementation to override only the prompt method, in order to avoid type errors
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ minify: true })
      );

      await createMinificationPrompt();

      const callArgs = mockInquirer.prompt.mock.calls[0];
      expect(callArgs?.[0]).toHaveLength(1);
      const promptConfig = callArgs?.[0]?.[0];
      expect(promptConfig?.type).toBe("confirm");
      expect(promptConfig?.name).toBe("minify");
      expect(promptConfig?.default).toBe(false);
      expect(promptConfig?.message).toContain("minify");
    });
  });

  describe("createMinificationModePrompt", () => {
    it("should return 'minimal' when selected", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ mode: "minimal" })
      );

      const result = await createMinificationModePrompt();

      expect(result).toBe("minimal");
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1);
    });

    it("should return 'recommended' when selected", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ mode: "recommended" })
      );

      const result = await createMinificationModePrompt();

      expect(result).toBe("recommended");
    });

    it("should return 'select' when selected", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ mode: "select" })
      );

      const result = await createMinificationModePrompt();

      expect(result).toBe("select");
    });

    it("should have all three mode options", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ mode: "recommended" })
      );

      await createMinificationModePrompt();

      const callArgs = mockInquirer.prompt.mock.calls[0];
      const promptConfig = callArgs?.[0]?.[0];
      expect(promptConfig?.type).toBe("list");
      expect(promptConfig?.name).toBe("mode");
      expect(promptConfig?.choices).toHaveLength(3);
      expect(promptConfig?.default).toBe("recommended");

      const choices = promptConfig?.choices as Array<{
        name: string;
        value: string;
      }>;
      const values = choices?.map((c) => c.value) || [];
      expect(values).toContain("minimal");
      expect(values).toContain("recommended");
      expect(values).toContain("select");
    });

    it("should have descriptive choice names", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({ mode: "recommended" })
      );

      await createMinificationModePrompt();

      const callArgs = mockInquirer.prompt.mock.calls[0];
      const promptConfig = callArgs?.[0]?.[0];
      const choices = promptConfig?.choices as Array<{
        name: string;
        value: string;
      }>;

      const minimalChoice = choices?.find((c) => c.value === "minimal");
      expect(minimalChoice?.name).toContain("Minimal");
      expect(minimalChoice?.name).toContain("essential fields");

      const recommendedChoice = choices?.find((c) => c.value === "recommended");
      expect(recommendedChoice?.name).toContain("Recommended");
      expect(recommendedChoice?.name).toContain("Cursor AI");

      const selectionChoice = choices?.find((c) => c.value === "select");
      expect(selectionChoice?.name).toContain("Select");
      expect(selectionChoice?.name).toContain("Custom");
    });
  });

  describe("createFieldSelectionPrompt", () => {
    const mockFields = [
      "alwaysApply",
      "description",
      "enforcement",
      "globs",
      "language",
      "scope",
      "tags",
    ];

    it("should return selected fields", async () => {
      const selectedFields = ["description", "scope", "tags"];
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({
          selectedFields,
        })
      );

      const result = await createFieldSelectionPrompt(mockFields);

      expect(result).toEqual(selectedFields);
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1);
    });

    it("should create choices from available fields", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({
          selectedFields: ["description"],
        })
      );

      await createFieldSelectionPrompt(mockFields);

      const callArgs = mockInquirer.prompt.mock.calls[0];
      const promptConfig = callArgs?.[0]?.[0];
      expect(promptConfig?.type).toBe("checkbox");
      expect(promptConfig?.name).toBe("selectedFields");

      const choices = promptConfig?.choices as Array<{
        name: string;
        value: string;
        checked?: boolean;
      }>;
      expect(choices).toHaveLength(mockFields.length);

      for (const field of mockFields) {
        const choice = choices?.find((c) => c.value === field);
        expect(choice).toBeDefined();
        expect(choice?.name).toBe(field);
        expect(choice?.checked).toBe(false);
      }
    });

    it("should validate that at least one field is selected", async () => {
      const validateFn = vi.fn();
      mockInquirer.prompt.mockImplementation((prompts) => {
        const prompt = Array.isArray(prompts) ? prompts[0] : prompts;
        if (prompt.validate) {
          const validationResult = prompt.validate([]);
          validateFn(validationResult);
          if (validationResult !== true) {
            // Simulate user fixing the validation
            return Promise.resolve({ selectedFields: ["description"] });
          }
        }
        return Promise.resolve({ selectedFields: [] });
      });

      await createFieldSelectionPrompt(mockFields);

      const callArgs = mockInquirer.prompt.mock.calls[0];
      const promptConfig = callArgs?.[0]?.[0];
      const validate = promptConfig?.validate;

      if (validate) {
        const result = validate([]);
        expect(result).toBe("Please select at least one field");
        expect(validate(["description"])).toBe(true);
      }
    });

    it("should handle empty field list", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({
          selectedFields: [],
        })
      );

      const result = await createFieldSelectionPrompt([]);

      expect(result).toEqual([]);
      const callArgs = mockInquirer.prompt.mock.calls[0];
      const promptConfig = callArgs?.[0]?.[0];
      const choices = promptConfig?.choices as unknown[];
      expect(choices).toHaveLength(0);
    });

    it("should use appropriate page size", async () => {
      mockInquirer.prompt.mockImplementation(() =>
        Promise.resolve({
          selectedFields: ["description"],
        })
      );

      await createFieldSelectionPrompt(mockFields);

      const callArgs = mockInquirer.prompt.mock.calls[0];
      const promptConfig = callArgs?.[0]?.[0];
      expect(promptConfig?.pageSize).toBe(15);
    });
  });
});
