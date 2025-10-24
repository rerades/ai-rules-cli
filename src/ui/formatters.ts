/**
 * UI formatters module
 * Provides visual formatting utilities with chalk and boxen
 */

import chalk from "chalk";
import boxen from "boxen";

/**
 * Color scheme for the CLI
 */
export const colors = {
  primary: chalk.cyan,
  secondary: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.gray,
  highlight: chalk.magenta,
  muted: chalk.dim,
} as const;

/**
 * Creates a welcome banner
 */
export const createWelcomeBanner = (): string => {
  const title = colors.primary.bold("AI Rules CLI");
  const subtitle = colors.info(
    "Manage Cursor AI rules with dependency resolution"
  );
  const version = colors.muted("v1.0.0");

  const content = `${title}\n${subtitle}\n${version}`;

  return boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "cyan",
    backgroundColor: "black",
  });
};

/**
 * Creates a success message
 */
export const createSuccessMessage = (message: string): string => {
  return `${colors.success("✓")} ${colors.success(message)}`;
};

/**
 * Creates a warning message
 */
export const createWarningMessage = (message: string): string => {
  return `${colors.warning("⚠")} ${colors.warning(message)}`;
};

/**
 * Creates an error message
 */
export const createErrorMessage = (message: string): string => {
  return `${colors.error("✗")} ${colors.error(message)}`;
};

/**
 * Creates an info message
 */
export const createInfoMessage = (message: string): string => {
  return `${colors.info("ℹ")} ${colors.info(message)}`;
};

/**
 * Formats a rule for display
 */
export const formatRule = (rule: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly category: string;
  readonly maturity?: string;
}): string => {
  const title = colors.primary.bold(rule.title);
  const id = colors.muted(`(${rule.id})`);
  const category = colors.secondary(`[${rule.category}]`);
  const maturity = rule.maturity ? colors.warning(`[${rule.maturity}]`) : "";
  const description = rule.description
    ? colors.info(`\n    ${rule.description}`)
    : "";

  return `${title} ${id} ${category} ${maturity}${description}`;
};

/**
 * Formats a category group
 */
export const formatCategoryGroup = (
  category: string,
  count: number,
  total: number
): string => {
  const categoryName = colors.primary.bold(category);
  const countText = colors.highlight(`${count}/${total}`);

  return `${categoryName} ${colors.muted("(")}${countText}${colors.muted(")")}`;
};

/**
 * Formats a dependency info
 */
export const formatDependency = (dep: {
  readonly ruleId: string;
  readonly missingDependencies: readonly string[];
  readonly addedDependencies: readonly string[];
}): string => {
  const ruleId = colors.primary(dep.ruleId);
  let result = `Rule ${ruleId}:`;

  if (dep.missingDependencies.length > 0) {
    const missing = colors.error(dep.missingDependencies.join(", "));
    result += `\n  Missing: ${missing}`;
  }

  if (dep.addedDependencies.length > 0) {
    const added = colors.success(dep.addedDependencies.join(", "));
    result += `\n  Added: ${added}`;
  }

  return result;
};

/**
 * Formats a conflict info
 */
export const formatConflict = (conflict: {
  readonly ruleId1: string;
  readonly ruleId2: string;
  readonly reason: string;
}): string => {
  const rule1 = colors.error(conflict.ruleId1);
  const rule2 = colors.error(conflict.ruleId2);
  const reason = colors.warning(conflict.reason);

  return `${rule1} ↔ ${rule2}\n  ${reason}`;
};

/**
 * Creates a selection summary box
 */
export const createSelectionSummary = (summary: {
  readonly totalRules: number;
  readonly selectedRules: number;
  readonly categories: readonly {
    category: string;
    selectedCount: number;
    totalCount: number;
  }[];
  readonly dependencies: readonly {
    ruleId: string;
    addedDependencies: readonly string[];
  }[];
  readonly conflicts: readonly { ruleId1: string; ruleId2: string }[];
}): string => {
  const title = colors.primary.bold("Selection Summary");
  const total = colors.highlight(summary.totalRules.toString());
  const selected = colors.success(summary.selectedRules.toString());

  let content = `${title}\n\n`;
  content += `Total rules: ${total}\n`;
  content += `Selected rules: ${selected}\n\n`;

  if (summary.categories.length > 0) {
    content += colors.secondary("Categories:\n");
    for (const cat of summary.categories) {
      const categoryName = colors.primary(cat.category);
      const count = colors.highlight(`${cat.selectedCount}/${cat.totalCount}`);
      content += `  ${categoryName}: ${count}\n`;
    }
    content += "\n";
  }

  if (summary.dependencies.length > 0) {
    content += colors.secondary("Dependencies added:\n");
    for (const dep of summary.dependencies) {
      if (dep.addedDependencies.length > 0) {
        const ruleId = colors.primary(dep.ruleId);
        const added = colors.success(dep.addedDependencies.join(", "));
        content += `  ${ruleId}: ${added}\n`;
      }
    }
    content += "\n";
  }

  if (summary.conflicts.length > 0) {
    content += colors.warning("Conflicts detected:\n");
    for (const conflict of summary.conflicts) {
      const rule1 = colors.error(conflict.ruleId1);
      const rule2 = colors.error(conflict.ruleId2);
      content += `  ${rule1} ↔ ${rule2}\n`;
    }
    content += "\n";
  }

  return boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "blue",
    backgroundColor: "black",
  });
};

/**
 * Creates a progress indicator
 */
export const createProgressBar = (
  current: number,
  total: number,
  label: string
): string => {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 20);
  const empty = 20 - filled;

  const bar =
    colors.success("█".repeat(filled)) + colors.muted("░".repeat(empty));
  const percent = colors.highlight(`${percentage}%`);
  const labelText = colors.info(label);

  return `${labelText} [${bar}] ${percent} (${current}/${total})`;
};

/**
 * Formats a file path for display
 */
export const formatFilePath = (path: string): string => {
  return colors.muted(path);
};

/**
 * Formats a file size for display
 */
export const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Creates a confirmation prompt
 */
export const createConfirmationPrompt = (message: string): string => {
  return `${colors.warning("?")} ${colors.primary(message)}`;
};

/**
 * Creates a list item with checkbox
 */
export const createCheckboxItem = (checked: boolean, text: string): string => {
  const checkbox = checked ? colors.success("✓") : colors.muted("○");
  return `${checkbox} ${text}`;
};

/**
 * Creates a section header
 */
export const createSectionHeader = (title: string): string => {
  const line = colors.muted("─".repeat(title.length + 4));
  return `\n${line}\n${colors.primary.bold(title)}\n${line}`;
};

/**
 * Creates a table row
 */
export const createTableRow = (
  columns: readonly string[],
  widths: readonly number[]
): string => {
  return columns
    .map((col, index) => col.padEnd(widths[index] || 0))
    .join(" │ ");
};

/**
 * Creates a table header
 */
export const createTableHeader = (
  headers: readonly string[],
  widths: readonly number[]
): string => {
  const headerRow = createTableRow(headers, widths);
  const separator = widths.map((w) => "─".repeat(w)).join("─┼─");

  return `${colors.primary.bold(headerRow)}\n${colors.muted(separator)}`;
};

/**
 * Truncates text to a maximum length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + colors.muted("...");
};

/**
 * Highlights text within a string
 */
export const highlightText = (text: string, highlight: string): string => {
  const regex = new RegExp(`(${highlight})`, "gi");
  return text.replace(regex, colors.highlight("$1"));
};
