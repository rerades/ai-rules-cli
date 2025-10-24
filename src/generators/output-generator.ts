/**
 * Output generator module
 * Generates .mdc files in .cursor/rules directory
 */

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
// import { dirname } from "path";
import { existsSync } from "fs";
import type { RuleContent, RuleSelection } from "../types/rule.types";
import type { CLIConfig } from "../types/config.types";
import {
  createSpinner,
  updateSpinnerProgress,
  stopSpinnerSuccess,
  stopSpinnerError,
} from "../ui/spinner";
import {
  // createSuccessMessage,
  // createErrorMessage,
  formatFilePath,
} from "../ui/formatters";
import type { GenerationProgress } from "../types/wizard.types";

/**
 * Generates rule files in the output directory
 */
export const generateRuleFiles = async (
  rules: readonly RuleContent[],
  selections: readonly RuleSelection[],
  outputPath: string,
  config: CLIConfig,
  dryRun: boolean = false
): Promise<{
  readonly success: boolean;
  readonly generatedFiles: readonly string[];
  readonly errors: readonly string[];
}> => {
  const spinner = createSpinner("Generating rule files...");
  const generatedFiles: string[] = [];
  const errors: string[] = [];

  try {
    spinner.start();

    // Create output directory structure
    const rulesDir = join(outputPath, config.output.rulesDirectory);

    if (!dryRun) {
      await ensureDirectoryExists(rulesDir);
    }

    // Generate each rule file
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      if (!selection) {
        continue;
      }

      const rule = rules.find((r) => r.metadata.id === selection.ruleId);

      if (!rule) {
        errors.push(`Rule not found: ${selection.ruleId}`);
        continue;
      }

      const progress: GenerationProgress = {
        current: i + 1,
        total: selections.length,
        currentFile: rule.fileName,
        stage: "generating",
      };

      updateSpinnerProgress(spinner, progress);

      try {
        const filePath = await generateSingleRuleFile(rule, rulesDir, dryRun);
        if (filePath) {
          generatedFiles.push(filePath);
        }
      } catch (error) {
        const errorMsg = `Failed to generate ${rule.fileName}: ${error}`;
        errors.push(errorMsg);
      }
    }

    if (errors.length === 0) {
      stopSpinnerSuccess(
        spinner,
        `Generated ${generatedFiles.length} rule files`
      );
    } else {
      stopSpinnerError(
        spinner,
        `Generated ${generatedFiles.length} files with ${errors.length} errors`
      );
    }

    return {
      success: errors.length === 0,
      generatedFiles,
      errors,
    };
  } catch (error) {
    stopSpinnerError(spinner, `Generation failed: ${error}`);
    return {
      success: false,
      generatedFiles,
      errors: [`Generation failed: ${error}`],
    };
  }
};

/**
 * Generates a single rule file
 */
const generateSingleRuleFile = async (
  rule: RuleContent,
  outputDir: string,
  dryRun: boolean
): Promise<string | null> => {
  const fileName = `${rule.fileName}.mdc`;
  const filePath = join(outputDir, fileName);

  if (dryRun) {
    console.log(`[DRY RUN] Would generate: ${formatFilePath(filePath)}`);
    return filePath;
  }

  // Create the .mdc content with frontmatter
  const frontmatter = createFrontmatter(rule.metadata);
  const content = `${frontmatter}\n\n${rule.content}`;

  await writeFile(filePath, content, "utf8");

  return filePath;
};

/**
 * Creates YAML frontmatter from rule metadata
 */
const createFrontmatter = (metadata: RuleContent["metadata"]): string => {
  const frontmatter: Record<string, unknown> = {
    id: metadata.id,
    version: metadata.version,
    title: metadata.title,
  };

  // Add optional fields
  if (metadata.summary) frontmatter.summary = metadata.summary;
  if (metadata.category) frontmatter.category = metadata.category;
  if (metadata.scope) frontmatter.scope = metadata.scope;
  if (metadata.language) frontmatter.language = metadata.language;
  if (metadata.frameworks) frontmatter.frameworks = metadata.frameworks;
  if (metadata.tooling) frontmatter.tooling = metadata.tooling;
  if (metadata.lifecycle) frontmatter.lifecycle = metadata.lifecycle;
  if (metadata.maturity) frontmatter.maturity = metadata.maturity;
  if (metadata.stability) frontmatter.stability = metadata.stability;
  if (metadata.audience) frontmatter.audience = metadata.audience;
  if (metadata.severity) frontmatter.severity = metadata.severity;
  if (metadata.requires) frontmatter.requires = metadata.requires;
  if (metadata.conflicts) frontmatter.conflicts = metadata.conflicts;
  if (metadata.supersedes) frontmatter.supersedes = metadata.supersedes;
  if (metadata.bundles) frontmatter.bundles = metadata.bundles;
  if (metadata.files) frontmatter.files = metadata.files;
  if (metadata.enforcement) frontmatter.enforcement = metadata.enforcement;
  if (metadata.order !== undefined) frontmatter.order = metadata.order;
  if (metadata.inputs) frontmatter.inputs = metadata.inputs;
  if (metadata.tags) frontmatter.tags = metadata.tags;
  if (metadata.owner) frontmatter.owner = metadata.owner;
  if (metadata.review) frontmatter.review = metadata.review;
  if (metadata.license) frontmatter.license = metadata.license;
  if (metadata.links) frontmatter.links = metadata.links;
  if (metadata.i18n) frontmatter.i18n = metadata.i18n;

  // Convert to YAML format
  const yamlLines = ["---"];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined && value !== null) {
      if (typeof value === "string") {
        yamlLines.push(`${key}: "${value}"`);
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          yamlLines.push(`${key}: []`);
        } else {
          yamlLines.push(`${key}:`);
          for (const item of value) {
            yamlLines.push(`  - "${item}"`);
          }
        }
      } else if (typeof value === "object") {
        yamlLines.push(`${key}:`);
        for (const [subKey, subValue] of Object.entries(
          value as Record<string, unknown>
        )) {
          yamlLines.push(`  ${subKey}: "${subValue}"`);
        }
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    }
  }

  yamlLines.push("---");

  return yamlLines.join("\n");
};

/**
 * Ensures a directory exists, creating it if necessary
 */
const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
};

/**
 * Validates output path
 */
export const validateOutputPath = (
  outputPath: string
): {
  readonly isValid: boolean;
  readonly error?: string;
} => {
  if (!outputPath.trim()) {
    return {
      isValid: false,
      error: "Output path cannot be empty",
    };
  }

  if (outputPath.includes("..")) {
    return {
      isValid: false,
      error: "Output path cannot contain parent directory references",
    };
  }

  return {
    isValid: true,
  };
};

/**
 * Gets the full output path for rules
 */
export const getRulesOutputPath = (
  outputPath: string,
  config: CLIConfig
): string => {
  return join(outputPath, config.output.rulesDirectory);
};

/**
 * Checks if output directory is writable
 */
export const checkOutputDirectoryWritable = async (
  outputPath: string
): Promise<boolean> => {
  try {
    const testFile = join(outputPath, ".ai-rules-test");
    await writeFile(testFile, "test");
    await import("fs/promises").then((fs) => fs.unlink(testFile));
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets file statistics for generated files
 */
export const getFileStats = async (
  filePaths: readonly string[]
): Promise<{
  readonly totalFiles: number;
  readonly totalSize: number;
  readonly averageSize: number;
}> => {
  let totalSize = 0;

  for (const filePath of filePaths) {
    try {
      const stats = await import("fs/promises").then((fs) => fs.stat(filePath));
      totalSize += stats.size;
    } catch {
      // Ignore errors for individual files
    }
  }

  return {
    totalFiles: filePaths.length,
    totalSize,
    averageSize: filePaths.length > 0 ? totalSize / filePaths.length : 0,
  };
};
