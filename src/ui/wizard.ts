/**
 * Wizard module
 * Main interactive wizard for rule selection and generation
 */

import type {
  RuleContent,
  RuleSelection,
  WizardContext,
  WizardStep,
} from "../types/wizard.types";
import type { CLIConfig } from "../types/config.types";
import { loadAllRules, getAvailableCategories } from "../core/rule-loader";
import { resolveComprehensive } from "../core/dependency-resolver";
import { generateRuleFiles } from "../generators/output-generator";
import {
  generateIndexFile,
  generateClaudeMd,
} from "../generators/index-generator";
import {
  createWelcomeBanner,
  createSelectionSummary,
  createSuccessMessage,
  createErrorMessage,
} from "./formatters";
import {
  createLoadingSpinner,
  // createValidationSpinner,
  createDependencySpinner,
  createConflictSpinner,
  createGenerationSpinner,
  createIndexSpinner,
} from "./spinner";
import {
  createWelcomePrompt,
  createCategorySelectionPrompt,
  createRuleSelectionPrompt,
  createOutputPathPrompt,
  createReviewPrompt,
  createConflictResolutionPrompt,
  createGenerationConfirmationPrompt,
  createMinificationModePrompt,
  createFieldSelectionPrompt,
} from "./prompts";
import {
  RECOMMENDED_FIELDS,
  getAvailableMetadataFields,
  type NormalizeOptions,
} from "../utils/meta-normalizer";

/**
 * Main wizard function
 */
export const runWizard = async (
  config: CLIConfig
): Promise<{
  readonly success: boolean;
  readonly outputPath?: string;
  readonly generatedFiles?: readonly string[];
  readonly errors?: readonly string[];
}> => {
  try {
    // Show welcome banner
    console.log(createWelcomeBanner());

    // Welcome prompt
    const proceed = await createWelcomePrompt();
    if (!proceed) {
      return { success: false, errors: ["User cancelled"] };
    }

    // Load all rules
    const loadingSpinner = createLoadingSpinner();
    loadingSpinner.start();

    const allRules = await loadAllRules(config);
    loadingSpinner.succeed(`Loaded ${allRules.length} rules from repository`);

    if (allRules.length === 0) {
      return { success: false, errors: ["No rules found in repository"] };
    }

    // Get available categories
    const categories = await getAvailableCategories(config);

    // Category selection
    const selectedCategories = await createCategorySelectionPrompt(
      categories.map((cat) => ({
        category: cat,
        rules: allRules.filter((rule) => rule.metadata.category === cat),
        selectedCount: 0,
        totalCount: allRules.filter((rule) => rule.metadata.category === cat)
          .length,
      }))
    );

    if (selectedCategories.length === 0) {
      return { success: false, errors: ["No categories selected"] };
    }

    // Rule selection for each category
    const selectedRuleIds: string[] = [];

    for (const category of selectedCategories) {
      const categoryRules = allRules.filter(
        (rule) => rule.metadata.category === category
      );
      const categorySelectedRules = await createRuleSelectionPrompt(
        category,
        categoryRules
      );
      selectedRuleIds.push(...categorySelectedRules);
    }

    if (selectedRuleIds.length === 0) {
      return { success: false, errors: ["No rules selected"] };
    }

    // Output path selection
    const outputPath = await createOutputPathPrompt();

    // Minification configuration - default to recommended mode
    const minificationMode = await createMinificationModePrompt();
    let normalizeOptions: NormalizeOptions = { minify: false };

    switch (minificationMode) {
      case "minimal":
        normalizeOptions = { minify: true, keepFields: [] };
        break;
      case "recommended":
        normalizeOptions = {
          minify: true,
          keepFields: RECOMMENDED_FIELDS,
        };
        break;
      case "select": {
        const availableFields = getAvailableMetadataFields();
        const selectedFields = await createFieldSelectionPrompt(
          availableFields
        );
        normalizeOptions = {
          minify: true,
          keepFields: selectedFields,
        };
        break;
      }
      case "all":
        // Keep all metadata fields (no minification)
        normalizeOptions = { minify: false };
        break;
    }

    // Resolve dependencies and conflicts
    const dependencySpinner = createDependencySpinner();
    dependencySpinner.start();

    const resolution = await resolveComprehensive(selectedRuleIds, config);
    dependencySpinner.succeed(
      `Resolved ${resolution.dependencies.length} dependencies`
    );

    // Handle conflicts
    let finalSelections = resolution.finalSelections;
    if (resolution.conflicts.length > 0) {
      const conflictSpinner = createConflictSpinner();
      conflictSpinner.start();

      for (const conflict of resolution.conflicts) {
        const resolutionChoice = await createConflictResolutionPrompt(conflict);

        switch (resolutionChoice) {
          case "exclude1":
            // Remove rule1 from selection
            const index1 = finalSelections.findIndex(
              (s) => s.ruleId === conflict.ruleId1
            );
            if (index1 >= 0) {
              finalSelections = finalSelections.filter((_, i) => i !== index1);
            }
            break;
          case "exclude2":
            // Remove rule2 from selection
            const index2 = finalSelections.findIndex(
              (s) => s.ruleId === conflict.ruleId2
            );
            if (index2 >= 0) {
              finalSelections = finalSelections.filter((_, i) => i !== index2);
            }
            break;
          case "ignore":
            // Continue with conflict (already handled)
            break;
        }
      }

      conflictSpinner.succeed(
        `Resolved ${resolution.conflicts.length} conflicts`
      );
    }

    // Show selection summary
    const summary = {
      totalRules: allRules.length,
      selectedRules: finalSelections.length,
      categories: selectedCategories.map((cat) => ({
        category: cat,
        selectedCount: finalSelections.filter(
          (s) =>
            allRules.find((r) => r.metadata.id === s.ruleId)?.metadata
              .category === cat
        ).length,
        totalCount: allRules.filter((rule) => rule.metadata.category === cat)
          .length,
      })),
      dependencies: resolution.dependencies,
      conflicts: resolution.conflicts,
    };

    console.log(createSelectionSummary(summary));

    // Review prompt
    const reviewProceed = await createReviewPrompt();
    if (!reviewProceed) {
      return { success: false, errors: ["User cancelled during review"] };
    }

    // Generation confirmation
    const generationConfirm = await createGenerationConfirmationPrompt({
      totalRules: allRules.length,
      selectedRules: finalSelections.length,
      outputPath,
    });

    if (!generationConfirm) {
      return { success: false, errors: ["User cancelled generation"] };
    }

    // Generate rule files
    const generationSpinner = createGenerationSpinner();
    generationSpinner.start();

    const generationResult = await generateRuleFiles(
      allRules,
      finalSelections,
      outputPath,
      config,
      false, // dryRun
      normalizeOptions
    );

    if (!generationResult.success) {
      generationSpinner.fail("Generation failed");
      return {
        success: false,
        errors: generationResult.errors,
      };
    }

    generationSpinner.succeed(
      `Generated ${generationResult.generatedFiles.length} rule files`
    );

    // Generate index file
    const indexSpinner = createIndexSpinner();
    indexSpinner.start();

    const indexResult = await generateIndexFile(
      allRules,
      finalSelections,
      outputPath,
      config,
      false // dryRun
    );

    if (!indexResult.success) {
      indexSpinner.fail("Index generation failed");
      return {
        success: false,
        errors: [indexResult.error || "Index generation failed"],
      };
    }

    indexSpinner.succeed("Index file generated");

    // Generate claude.md file
    const claudeResult = await generateClaudeMd(
      allRules,
      finalSelections,
      outputPath,
      false // dryRun
    );

    if (!claudeResult.success) {
      // Don't fail the entire operation, just warn
      console.warn("Warning: Failed to generate claude.md file");
    }

    // Success message
    console.log(
      createSuccessMessage(
        `Successfully generated ${generationResult.generatedFiles.length} rule files in ${outputPath}`
      )
    );

    return {
      success: true,
      outputPath,
      generatedFiles: generationResult.generatedFiles,
    };
  } catch (error) {
    console.error(createErrorMessage(`Wizard failed: ${error}`));
    return {
      success: false,
      errors: [`Wizard failed: ${error}`],
    };
  }
};

/**
 * Creates a wizard context
 */
export const createWizardContext = (
  step: WizardStep,
  allRules: readonly RuleContent[],
  selectedRules: readonly RuleSelection[],
  outputPath: string,
  dryRun: boolean,
  verbose: boolean
): WizardContext => {
  return {
    step,
    allRules,
    selectedRules,
    outputPath,
    dryRun,
    verbose,
  };
};

/**
 * Validates wizard context
 */
export const validateWizardContext = (
  context: WizardContext
): {
  readonly isValid: boolean;
  readonly errors: readonly string[];
} => {
  const errors: string[] = [];

  if (!context.allRules || context.allRules.length === 0) {
    errors.push("No rules loaded");
  }

  if (!context.outputPath || context.outputPath.trim() === "") {
    errors.push("Output path is required");
  }

  if (context.selectedRules && context.selectedRules.length === 0) {
    errors.push("No rules selected");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Gets wizard progress
 */
export const getWizardProgress = (
  context: WizardContext
): {
  readonly currentStep: WizardStep;
  readonly totalSteps: number;
  readonly progress: number;
} => {
  const steps: readonly WizardStep[] = [
    "welcome",
    "category-selection",
    "rule-selection",
    "output-config",
    "review",
    "conflict-resolution",
    "confirmation",
    "generation",
    "complete",
  ];

  const currentIndex = steps.indexOf(context.step);
  const totalSteps = steps.length;
  const progress = Math.round((currentIndex / totalSteps) * 100);

  return {
    currentStep: context.step,
    totalSteps,
    progress,
  };
};
