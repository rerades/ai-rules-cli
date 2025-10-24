/**
 * Wizard-specific types for AI Rules CLI
 */

import type {
  RuleContent,
  RuleSelection,
  DependencyInfo,
  ConflictInfo,
} from "./rule.types";

// Re-export types that are used in wizard
export type {
  RuleContent,
  RuleSelection,
  DependencyInfo,
  ConflictInfo,
} from "./rule.types";

// Wizard step types
export type WizardStep =
  | "welcome"
  | "category-selection"
  | "rule-selection"
  | "output-config"
  | "review"
  | "conflict-resolution"
  | "confirmation"
  | "generation"
  | "complete";

// Category grouping for wizard
export interface CategoryGroup {
  readonly category: string;
  readonly rules: readonly RuleContent[];
  readonly selectedCount: number;
  readonly totalCount: number;
}

// Selection summary
export interface SelectionSummary {
  readonly totalRules: number;
  readonly selectedRules: number;
  readonly categories: readonly CategoryGroup[];
  readonly dependencies: readonly DependencyInfo[];
  readonly conflicts: readonly ConflictInfo[];
}

// Wizard prompts
export interface WizardPrompt {
  readonly type: "confirm" | "input" | "checkbox" | "list" | "rawlist";
  readonly name: string;
  readonly message: string;
  readonly choices?: readonly string[];
  readonly default?: unknown;
  readonly validate?: (input: unknown) => boolean | string;
}

// Wizard context
export interface WizardContext {
  readonly step: WizardStep;
  readonly allRules: readonly RuleContent[];
  readonly selectedRules: readonly RuleSelection[];
  readonly outputPath: string;
  readonly dryRun: boolean;
  readonly verbose: boolean;
}

// Progress tracking
export interface GenerationProgress {
  readonly current: number;
  readonly total: number;
  readonly currentFile: string;
  readonly stage:
    | "loading"
    | "validating"
    | "generating"
    | "indexing"
    | "complete";
}
