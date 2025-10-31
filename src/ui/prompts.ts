/**
 * Prompts module for Inquirer.js integration
 * Provides reusable prompt configurations
 */

import inquirer from "inquirer";
import type { RuleContent, CategoryGroup } from "../types/wizard.types";
import type { MinificationMode } from "../utils/meta-normalizer";
import {
  colors,
  formatRule,
  formatCategoryGroup,
  // createCheckboxItem,
} from "./formatters";

/**
 * Creates a welcome prompt
 */
export const createWelcomePrompt = async (): Promise<boolean> => {
  const { proceed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message: "Welcome to AI Rules CLI! Ready to set up your Cursor rules?",
      default: true,
    },
  ]);

  return proceed;
};

/**
 * Creates a category selection prompt
 */
export const createCategorySelectionPrompt = async (
  categories: readonly CategoryGroup[]
): Promise<readonly string[]> => {
  const choices = categories.map((cat) => ({
    name: formatCategoryGroup(cat.category, cat.selectedCount, cat.totalCount),
    value: cat.category,
    checked: cat.selectedCount > 0,
  }));

  const { selectedCategories } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedCategories",
      message: "Select rule categories to include:",
      choices,
      validate: (input: string[]) => {
        if (input.length === 0) {
          return "Please select at least one category";
        }
        return true;
      },
    },
  ]);

  return selectedCategories;
};

/**
 * Creates a rule selection prompt for a specific category
 */
export const createRuleSelectionPrompt = async (
  category: string,
  rules: readonly RuleContent[]
): Promise<readonly string[]> => {
  const choices = rules.map((rule) => ({
    name: formatRule({
      id: rule.metadata.id,
      title: rule.metadata.title,
      description: rule.metadata.description || "",
      category: rule.metadata.category,
      maturity: rule.metadata.maturity || "",
    }),
    value: rule.metadata.id,
    checked: false,
  }));

  const { selectedRules } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedRules",
      message: `Select rules for ${colors.primary(category)} category:`,
      choices,
      pageSize: 10,
    },
  ]);

  return selectedRules;
};

/**
 * Creates an output path prompt
 */
export const createOutputPathPrompt = async (
  defaultPath: string = "./"
): Promise<string> => {
  const { outputPath } = await inquirer.prompt([
    {
      type: "input",
      name: "outputPath",
      message: "Enter the output directory path:",
      default: defaultPath,
      validate: (input: string) => {
        if (!input.trim()) {
          return "Please enter a valid path";
        }
        return true;
      },
    },
  ]);

  return outputPath;
};

/**
 * Creates a review prompt
 */
export const createReviewPrompt = async (): Promise<boolean> => {
  const { proceed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message: "Review your selection and proceed with generation?",
      default: true,
    },
  ]);

  return proceed;
};

/**
 * Creates a conflict resolution prompt
 */
export const createConflictResolutionPrompt = async (conflict: {
  readonly ruleId1: string;
  readonly ruleId2: string;
  readonly reason: string;
}): Promise<"exclude1" | "exclude2" | "ignore"> => {
  const { resolution } = await inquirer.prompt([
    {
      type: "list",
      name: "resolution",
      message: `Conflict detected: ${colors.error(
        conflict.ruleId1
      )} ↔ ${colors.error(conflict.ruleId2)}\n${colors.warning(
        conflict.reason
      )}\nHow would you like to resolve this conflict?`,
      choices: [
        {
          name: `Exclude ${conflict.ruleId1}`,
          value: "exclude1",
        },
        {
          name: `Exclude ${conflict.ruleId2}`,
          value: "exclude2",
        },
        {
          name: "Ignore conflict and continue",
          value: "ignore",
        },
      ],
    },
  ]);

  return resolution;
};

/**
 * Creates a confirmation prompt for generation
 */
export const createGenerationConfirmationPrompt = async (summary: {
  readonly totalRules: number;
  readonly selectedRules: number;
  readonly outputPath: string;
}): Promise<boolean> => {
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Generate ${colors.success(
        summary.selectedRules.toString()
      )} rules in ${colors.primary(summary.outputPath)}?`,
      default: true,
    },
  ]);

  return confirm;
};

/**
 * Creates a dry run confirmation prompt
 */
export const createDryRunPrompt = async (): Promise<boolean> => {
  const { dryRun } = await inquirer.prompt([
    {
      type: "confirm",
      name: "dryRun",
      message: "Run in dry-run mode (simulate without creating files)?",
      default: false,
    },
  ]);

  return dryRun;
};

/**
 * Creates a verbose mode prompt
 */
export const createVerbosePrompt = async (): Promise<boolean> => {
  const { verbose } = await inquirer.prompt([
    {
      type: "confirm",
      name: "verbose",
      message: "Enable verbose output?",
      default: false,
    },
  ]);

  return verbose;
};

/**
 * Creates a retry prompt for failed operations
 */
export const createRetryPrompt = async (error: string): Promise<boolean> => {
  const { retry } = await inquirer.prompt([
    {
      type: "confirm",
      name: "retry",
      message: `Operation failed: ${colors.error(
        error
      )}\nWould you like to retry?`,
      default: false,
    },
  ]);

  return retry;
};

/**
 * Creates a custom input prompt
 */
export const createInputPrompt = async (
  message: string,
  defaultValue?: string,
  validate?: (input: string) => boolean | string
): Promise<string> => {
  const { value } = await inquirer.prompt([
    {
      type: "input",
      name: "value",
      message,
      default: defaultValue,
      validate,
    },
  ]);

  return value;
};

/**
 * Creates a custom list prompt
 */
export const createListPrompt = async (
  message: string,
  choices: readonly string[]
): Promise<string> => {
  const { value } = await inquirer.prompt([
    {
      type: "list",
      name: "value",
      message,
      choices,
    },
  ]);

  return value;
};

/**
 * Creates a custom checkbox prompt
 */
export const createCheckboxPrompt = async (
  message: string,
  choices: readonly { name: string; value: string; checked?: boolean }[]
): Promise<readonly string[]> => {
  const { values } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "values",
      message,
      choices,
    },
  ]);

  return values;
};

/**
 * Creates a custom confirm prompt
 */
export const createConfirmPrompt = async (
  message: string,
  defaultValue: boolean = true
): Promise<boolean> => {
  const { value } = await inquirer.prompt([
    {
      type: "confirm",
      name: "value",
      message,
      default: defaultValue,
    },
  ]);

  return value;
};

/**
 * Creates a prompt asking if the user wants to minify metadata
 */
export const createMinificationPrompt = async (): Promise<boolean> => {
  const { minify } = await inquirer.prompt([
    {
      type: "confirm",
      name: "minify",
      message: "Do you want to minify the metadata (reduce frontmatter size)?",
      default: false,
    },
  ]);

  return minify;
};

/**
 * Creates a prompt to select minification mode
 */
export const createMinificationModePrompt =
  async (): Promise<MinificationMode> => {
    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: "Select minification mode:",
        choices: [
          {
            name: "Minimal - Only essential fields (id, version, title, category)",
            value: "minimal",
          },
          {
            name: "Recommended - Recommended fields for Cursor AI",
            value: "recommended",
          },
          {
            name: "Select - Custom field selection",
            value: "select",
          },
        ],
        default: "recommended",
      },
    ]);

    return mode;
  };

/**
 * Creates a prompt to select which metadata fields to keep
 * @param availableFields - Array of available field names from the schema
 * @returns Array of selected field names
 */
export const createFieldSelectionPrompt = async (
  availableFields: readonly string[]
): Promise<readonly string[]> => {
  const choices = availableFields.map((field) => ({
    name: field,
    value: field,
    checked: false,
  }));

  const { selectedFields } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedFields",
      message: "Select metadata fields to keep:",
      choices,
      pageSize: 15,
      validate: (input: string[]) => {
        if (input.length === 0) {
          return "Please select at least one field";
        }
        return true;
      },
    },
  ]);

  return selectedFields;
};
