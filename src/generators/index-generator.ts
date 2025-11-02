/**
 * Index generator module
 * Generates index.md file for the .cursor/rules directory
 * and claude.md file for Claude AI integration
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
 * Generates the claude.md file for Claude AI integration
 */
export const generateClaudeMd = async (
  rules: readonly RuleContent[],
  selections: readonly RuleSelection[],
  outputPath: string,
  dryRun: boolean = false
): Promise<{
  readonly success: boolean;
  readonly filePath?: string;
  readonly error?: string;
}> => {
  const spinner = createSpinner("Generating claude.md file...");

  try {
    spinner.start();

    const claudeContent = createClaudeMdContent(rules, selections);
    const filePath = join(outputPath, "claude.md");

    if (dryRun) {
      console.log(`[DRY RUN] Would generate claude.md: ${filePath}`);
      stopSpinnerSuccess(spinner, "claude.md file generated (dry run)");
      return { success: true, filePath };
    }

    await writeFile(filePath, claudeContent, "utf8");

    stopSpinnerSuccess(spinner, "claude.md file generated");
    return { success: true, filePath };
  } catch (error) {
    stopSpinnerError(spinner, `Failed to generate claude.md: ${error}`);
    return {
      success: false,
      error: `Failed to generate claude.md: ${error}`,
    };
  }
};

/**
 * Creates the content for the claude.md file
 */
const createClaudeMdContent = (
  rules: readonly RuleContent[],
  selections: readonly RuleSelection[]
): string => {
  const selectedRules = selections
    .filter((selection) => selection.selected)
    .map((selection) =>
      rules.find((rule) => rule.metadata.id === selection.ruleId)
    )
    .filter((rule): rule is RuleContent => rule !== undefined);

  const categories = groupRulesByCategory(selectedRules);
  const generationDate = new Date().toISOString();

  let content = `# Claude AI Rules Integration

*Generated on: ${generationDate}*

## Overview

This project uses a shared rules directory (\`.cursor/rules\`) that contains structured guidelines for AI assistants. These rules are automatically loaded by Cursor IDE, and can also be referenced by Claude AI to maintain consistency across different AI tools.

## How the .cursor/rules Directory Works

The \`.cursor/rules\` directory contains individual rule files ('.mdc' format) that define coding standards, best practices, and project-specific guidelines. Each rule file includes:

- **Metadata**: Rule ID, version, category, scope, and other properties
- **Content**: Detailed guidelines and examples in Markdown format
- **Dependencies**: Rules can depend on or conflict with other rules

### Rule File Structure

Each rule file ('.mdc') follows this structure:

\`\`\`yaml
---
id: "category.rule-name"
version: "1.0.0"
title: "Rule Title"
category: "category"
description: "Brief description"
scope: ["global", "repo"]
language: "typescript"
---

# Rule Content

Detailed guidelines and examples...
\`\`\`

## How Claude Can Benefit from These Rules

Claude AI can leverage these rules in several ways:

### 1. **Consistent Code Style**

By referencing the rules in \`.cursor/rules\`, Claude can maintain the same coding standards and conventions that Cursor IDE enforces. This ensures consistency regardless of which AI assistant you're using.

### 2. **Project-Specific Guidelines**

Rules contain project-specific context like preferred libraries, patterns, and architectural decisions. Claude can read these rules to understand your project's unique requirements.

### 3. **Rule Metadata as Context**

Each rule's metadata (category, scope, language, frameworks) helps Claude understand when and how to apply specific guidelines. For example, a rule with \`language: "typescript"\` and \`scope: ["component"]\` should only be applied to TypeScript component files.

### 4. **Dependency Awareness**

Rules can have dependencies and conflicts. Claude can use this information to ensure compatible rule sets are applied together and avoid conflicting guidelines.

### 5. **Versioned Standards**

Each rule has a version number, allowing Claude to track which version of coding standards are being used. This helps maintain consistency as rules evolve over time.

## Using Rules with Claude

### Method 1: Direct Reference

When working with Claude, you can reference specific rules:

\`\`\`
Please follow the guidelines in .cursor/rules/code.functional-approach.mdc
when writing new functions.
\`\`\`

### Method 2: Category-Based Application

Reference all rules in a category:

\`\`\`
Apply all TypeScript conventions from .cursor/rules/typescript.*.mdc files.
\`\`\`

### Method 3: Context-Aware Selection

Claude can automatically select relevant rules based on:

- **File type**: Rules with matching \`files\` patterns
- **Language**: Rules with matching \`language\` field
- **Scope**: Rules with appropriate \`scope\` (global, repo, component, etc.)
- **Frameworks**: Rules relevant to your tech stack

## Available Rules

This project contains **${selectedRules.length} active rules** across **${categories.size} categories**:

`;

  // Generate category summary
  for (const [category, categoryRules] of categories) {
    content += `### ${category.charAt(0).toUpperCase() + category.slice(1)} (${
      categoryRules.length
    } rules)\n\n`;

    for (const rule of categoryRules) {
      content += `- **${rule.metadata.title}** (\`${rule.metadata.id}\`)`;
      if (rule.metadata.description) {
        content += ` - ${rule.metadata.description}`;
      }
      content += `\n`;
      content += `  - File: \`.cursor/rules/${rule.fileName}.mdc\``;
      if (rule.metadata.version) {
        content += ` | Version: ${rule.metadata.version}`;
      }
      if (rule.metadata.maturity) {
        content += ` | Maturity: ${rule.metadata.maturity}`;
      }
      content += `\n`;
    }
    content += `\n`;
  }

  content += `## Rule Categories Explained\n\n`;

  // Category descriptions
  const categoryDescriptions: Record<string, string> = {
    foundation:
      "Core principles and fundamental guidelines that apply broadly across the project",
    code: "Code-level guidelines for writing clean, maintainable code",
    typescript: "TypeScript-specific conventions and best practices",
    security: "Security guidelines and best practices",
    testing: "Testing standards and patterns",
    tooling: "Tool configuration and usage guidelines",
  };

  for (const [category] of categories) {
    const description =
      categoryDescriptions[category] ||
      `Rules related to ${category} in this project`;
    content += `- **${category}**: ${description}\n`;
  }

  content += `\n`;

  content += `## Best Practices for Claude\n\n`;
  content += `1. **Read Rule Files First**: Before making changes, check if relevant rules exist\n`;
  content += `2. **Respect Rule Scope**: Only apply rules when their scope matches the context\n`;
  content += `3. **Check Dependencies**: Ensure required rules are understood before applying dependent rules\n`;
  content += `4. **Use Rule Metadata**: Leverage language, framework, and file pattern filters\n`;
  content += `5. **Reference Rule IDs**: When explaining decisions, reference the specific rule ID\n`;
  content += `6. **Version Awareness**: Be aware of rule versions when suggesting updates\n\n`;

  content += `## Example Usage\n\n`;
  content += `### Example 1: Following Functional Programming Rules\n\n`;
  content += `\`\`\`\n`;
  content += `User: Write a function to filter and transform user data\n\n`;
  content += `Claude: I'll follow the functional programming guidelines from `;
  content += `\`.cursor/rules/code.functional-approach.mdc\`. Here's a pure function `;
  content += `using composition...\n`;
  content += `\`\`\`\n\n`;

  content += `### Example 2: TypeScript Conventions\n\n`;
  content += `\`\`\`\n`;
  content += `User: Create a new TypeScript component\n\n`;
  content += `Claude: Following TypeScript conventions from `;
  content += `\`.cursor/rules/typescript.*.mdc\`, I'll use readonly properties by default `;
  content += `and avoid enums in favor of const objects...\n`;
  content += `\`\`\`\n\n`;

  content += `## Integration with Cursor IDE\n\n`;
  content += `These same rules are automatically loaded by Cursor IDE, ensuring that:\n\n`;
  content += `- Both Cursor and Claude follow the same guidelines\n`;
  content += `- No duplication of rule definitions\n`;
  content += `- Consistent behavior across AI assistants\n`;
  content += `- Single source of truth for project standards\n\n`;

  content += `For more information about how Cursor uses these rules, see `;
  content += `\`.cursor/rules/index.md\`.\n\n`;

  content += `---\n\n`;
  content += `*This file was automatically generated by AI Rules CLI. `;
  content += `To update the rules, run \`ai-rules init\` or \`ai-rules generate\`.*\n`;

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
