/**
 * Index generator module
 * Generates index.md file for the .cursor/rules directory
 */

import { writeFile } from "fs/promises";
import { join } from "path";
import type { RuleContent, RuleSelection } from "../types/rule.types";
import type { CLIConfig } from "../types/config.types";
import {
  createSpinner,
  stopSpinnerSuccess,
  stopSpinnerError,
} from "../ui/spinner";
// import { createSuccessMessage, createErrorMessage } from "../ui/formatters";

/**
 * Generates the index.md file
 */
export const generateIndexFile = async (
  rules: readonly RuleContent[],
  selections: readonly RuleSelection[],
  outputPath: string,
  config: CLIConfig,
  dryRun: boolean = false
): Promise<{
  readonly success: boolean;
  readonly filePath?: string;
  readonly error?: string;
}> => {
  const spinner = createSpinner("Generating index file...");

  try {
    spinner.start();

    const indexContent = createIndexContent(rules, selections);
    const filePath = join(outputPath, config.output.rulesDirectory, "index.md");

    if (dryRun) {
      console.log(`[DRY RUN] Would generate index: ${filePath}`);
      stopSpinnerSuccess(spinner, "Index file generated (dry run)");
      return { success: true, filePath };
    }

    await writeFile(filePath, indexContent, "utf8");

    stopSpinnerSuccess(spinner, "Index file generated");
    return { success: true, filePath };
  } catch (error) {
    stopSpinnerError(spinner, `Failed to generate index: ${error}`);
    return {
      success: false,
      error: `Failed to generate index: ${error}`,
    };
  }
};

/**
 * Creates the content for the index.md file
 */
const createIndexContent = (
  rules: readonly RuleContent[],
  selections: readonly RuleSelection[]
  // config: CLIConfig
): string => {
  const selectedRules = selections
    .filter((selection) => selection.selected)
    .map((selection) =>
      rules.find((rule) => rule.metadata.id === selection.ruleId)
    )
    .filter((rule): rule is RuleContent => rule !== undefined);

  const categories = groupRulesByCategory(selectedRules);
  const generationDate = new Date().toISOString();

  let content = `# Cursor AI Rules\n\n`;
  content += `Generated on: ${generationDate}\n`;
  content += `Total rules: ${selectedRules.length}\n`;
  content += `Categories: ${categories.size}\n\n`;

  content += `## Overview\n\n`;
  content += `This directory contains AI rules for Cursor, organized by category. `;
  content += `Each rule file (.mdc) contains metadata and guidelines for AI assistants.\n\n`;

  content += `## Rules by Category\n\n`;

  // Generate category sections
  for (const [category, categoryRules] of categories) {
    content += `### ${category}\n\n`;

    for (const rule of categoryRules) {
      content += `- **[${rule.metadata.title}](${rule.fileName}.mdc)**`;
      content += ` (${rule.metadata.id})`;

      if (rule.metadata.description) {
        content += ` - ${rule.metadata.description}`;
      }

      if (rule.metadata.maturity) {
        content += ` [${rule.metadata.maturity}]`;
      }

      content += `\n`;
    }

    content += `\n`;
  }

  content += `## Rule Details\n\n`;

  // Generate detailed rule information
  for (const rule of selectedRules) {
    content += `### ${rule.metadata.title}\n\n`;
    content += `**ID:** \`${rule.metadata.id}\`\n`;
    content += `**Version:** ${rule.metadata.version}\n`;
    content += `**Category:** ${rule.metadata.category}\n`;

    if (rule.metadata.description) {
      content += `**Description:** ${rule.metadata.description}\n`;
    }

    if (rule.metadata.scope) {
      content += `**Scope:** ${rule.metadata.scope.join(", ")}\n`;
    }

    if (rule.metadata.language) {
      content += `**Language:** ${rule.metadata.language}\n`;
    }

    if (rule.metadata.frameworks) {
      content += `**Frameworks:** ${rule.metadata.frameworks.join(", ")}\n`;
    }

    if (rule.metadata.tooling) {
      content += `**Tooling:** ${rule.metadata.tooling.join(", ")}\n`;
    }

    if (rule.metadata.lifecycle) {
      content += `**Lifecycle:** ${rule.metadata.lifecycle}\n`;
    }

    if (rule.metadata.maturity) {
      content += `**Maturity:** ${rule.metadata.maturity}\n`;
    }

    if (rule.metadata.stability) {
      content += `**Stability:** ${rule.metadata.stability}\n`;
    }

    if (rule.metadata.audience) {
      content += `**Audience:** ${rule.metadata.audience.join(", ")}\n`;
    }

    if (rule.metadata.severity) {
      content += `**Severity:** ${rule.metadata.severity}\n`;
    }

    if (rule.metadata.requires) {
      content += `**Requires:** ${rule.metadata.requires.join(", ")}\n`;
    }

    if (rule.metadata.conflicts) {
      content += `**Conflicts:** ${rule.metadata.conflicts.join(", ")}\n`;
    }

    if (rule.metadata.supersedes) {
      content += `**Supersedes:** ${rule.metadata.supersedes.join(", ")}\n`;
    }

    if (rule.metadata.bundles) {
      content += `**Bundles:** ${rule.metadata.bundles.join(", ")}\n`;
    }

    if (rule.metadata.files) {
      content += `**Files:** ${rule.metadata.files.join(", ")}\n`;
    }

    if (rule.metadata.enforcement) {
      content += `**Enforcement:**\n`;
      content += `  - Lint: ${rule.metadata.enforcement.lint}\n`;
      content += `  - CI: ${rule.metadata.enforcement.ci}\n`;
      content += `  - Scaffold: ${rule.metadata.enforcement.scaffold}\n`;
    }

    if (rule.metadata.order !== undefined) {
      content += `**Order:** ${rule.metadata.order}\n`;
    }

    if (rule.metadata.tags) {
      content += `**Tags:** ${rule.metadata.tags.join(", ")}\n`;
    }

    if (rule.metadata.owner) {
      content += `**Owner:** ${rule.metadata.owner}\n`;
    }

    if (rule.metadata.review) {
      content += `**Review:**\n`;
      content += `  - Last reviewed: ${rule.metadata.review.lastReviewed}\n`;
      content += `  - Review cycle: ${rule.metadata.review.reviewCycleDays} days\n`;
    }

    if (rule.metadata.license) {
      content += `**License:** ${rule.metadata.license}\n`;
    }

    if (rule.metadata.links) {
      content += `**Links:**\n`;
      for (const link of rule.metadata.links) {
        content += `  - [${link.rel}](${link.href})\n`;
      }
    }

    content += `\n`;
  }

  content += `## Usage\n\n`;
  content += `These rules are automatically loaded by Cursor when present in the \`.cursor/rules\` directory.\n\n`;
  content += `For more information about AI rules in Cursor, see the [official documentation](https://cursor.sh/docs).\n\n`;
  content += `---\n\n`;
  content += `*Generated by AI Rules CLI v1.0.0*\n`;

  return content;
};

/**
 * Groups rules by category
 */
const groupRulesByCategory = (
  rules: readonly RuleContent[]
): Map<string, RuleContent[]> => {
  const categories = new Map<string, RuleContent[]>();

  for (const rule of rules) {
    const category = rule.metadata.category;
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(rule);
  }

  // Sort rules within each category by order
  for (const [, categoryRules] of categories) {
    categoryRules.sort((a, b) => {
      const orderA = a.metadata.order ?? 1000;
      const orderB = b.metadata.order ?? 1000;
      return orderA - orderB;
    });
  }

  return categories;
};

/**
 * Creates a summary table for the index
 */
// const createSummaryTable = (rules: readonly RuleContent[]): string => {
//   const categories = groupRulesByCategory(rules);

//   let table = `| Category | Rules | Maturity | Stability |\n`;
//   table += `|----------|-------|----------|----------|\n`;

//   for (const [category, categoryRules] of categories) {
//     const maturity = categoryRules[0]?.metadata.maturity || "unknown";
//     const stability = categoryRules[0]?.metadata.stability || "unknown";
//     const ruleCount = categoryRules.length;

//     table += `| ${category} | ${ruleCount} | ${maturity} | ${stability} |\n`;
//   }

//   return table;
// };

/**
 * Creates a quick reference section
 */
// const createQuickReference = (rules: readonly RuleContent[]): string => {
//   let content = `## Quick Reference\n\n`;

//   // Group by category
//   const categories = groupRulesByCategory(rules);

//   for (const [category, categoryRules] of categories) {
//     content += `### ${category}\n\n`;

//     for (const rule of categoryRules) {
//       content += `- \`${rule.metadata.id}\` - ${rule.metadata.title}\n`;
//     }

//     content += `\n`;
//   }

//   return content;
// };
