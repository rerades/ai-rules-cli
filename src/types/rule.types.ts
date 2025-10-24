/**
 * TypeScript types for AI Rules CLI
 * Generated from mdc.schema.json
 */

// Base types from schema
export type Category =
  | "foundation"
  | "language"
  | "framework"
  | "tooling"
  | "qa"
  | "security"
  | "accessibility"
  | "performance"
  | "architecture"
  | "docs";

export type Scope =
  | "global"
  | "repo"
  | "package"
  | "workspace"
  | "app"
  | "component"
  | "page"
  | "route"
  | "api"
  | "ci"
  | "cd";

export type Language =
  | "js"
  | "ts"
  | "python"
  | "java"
  | "go"
  | "rust"
  | "html"
  | "css"
  | "shell"
  | "none";

export type Framework =
  | "react"
  | "astro"
  | "svelte"
  | "vue"
  | "angular"
  | "lit"
  | "next"
  | "remix"
  | "node"
  | "express"
  | "fastify"
  | "none";

export type Tooling =
  | "eslint"
  | "prettier"
  | "vitest"
  | "jest"
  | "playwright"
  | "wdio"
  | "cypress"
  | "lighthouse"
  | "axe"
  | "pa11y"
  | "msw"
  | "pact"
  | "snyk"
  | "osv"
  | "husky"
  | "lint-staged"
  | "turbo"
  | "vite"
  | "webpack"
  | "rollup"
  | "parcel"
  | "pnpm"
  | "npm"
  | "yarn";

export type Lifecycle = "advisory" | "recommended" | "enforced";

export type Maturity = "draft" | "beta" | "stable" | "deprecated";

export type Stability = "experimental" | "evolving" | "locked";

export type Audience =
  | "frontend"
  | "backend"
  | "fullstack"
  | "qa"
  | "a11y"
  | "sec"
  | "devops"
  | "docs";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type LintLevel = "off" | "warn" | "error";

export type CILevel = "allow" | "block";

export type ScaffoldLevel = "none" | "add" | "update";

export type InputType = "string" | "number" | "boolean" | "enum";

export type LinkRel = "docs" | "adr" | "source" | "issue" | "playbook";

// Complex types
export interface Enforcement {
  readonly lint: LintLevel;
  readonly ci: CILevel;
  readonly scaffold: ScaffoldLevel;
}

export interface InputDefinition {
  readonly type: InputType;
  readonly description?: string;
  readonly default?: unknown;
  readonly enum?: readonly unknown[];
}

export interface Review {
  readonly lastReviewed: string; // ISO date
  readonly reviewCycleDays: number; // 7-365
}

export interface Link {
  readonly rel: LinkRel;
  readonly href: string;
}

export interface I18nContent {
  readonly title?: string;
  readonly summary?: string;
}

// Main rule metadata interface
export interface RuleMetadata {
  readonly id: string; // Pattern: ^[a-z0-9]+(\.[a-z0-9-]+)+$
  readonly version: string; // SemVer pattern
  readonly title: string; // minLength: 3
  readonly summary?: string;
  readonly category: Category;
  readonly scope?: readonly Scope[];
  readonly language?: Language;
  readonly frameworks?: readonly Framework[];
  readonly tooling?: readonly Tooling[];
  readonly lifecycle?: Lifecycle;
  readonly maturity?: Maturity;
  readonly stability?: Stability;
  readonly audience?: readonly Audience[];
  readonly severity?: Severity;
  readonly requires?: readonly string[]; // Rule IDs
  readonly conflicts?: readonly string[]; // Rule IDs
  readonly supersedes?: readonly string[]; // Rule IDs
  readonly bundles?: readonly string[]; // Bundle paths
  readonly files?: readonly string[]; // File globs
  readonly enforcement?: Enforcement;
  readonly order?: number; // 0-1000
  readonly inputs?: Record<string, InputDefinition>;
  readonly tags?: readonly string[]; // Pattern: ^(topic|lint|test|perf|a11y|sec):[a-z0-9-\.]+$
  readonly owner?: string;
  readonly review?: Review;
  readonly license?: string;
  readonly links?: readonly Link[];
  readonly i18n?: Record<string, I18nContent>;
}

// Rule content structure
export interface RuleContent {
  readonly metadata: RuleMetadata;
  readonly content: string; // Markdown content
  readonly filePath: string; // Original file path
  readonly fileName: string; // Original file name
}

// Validation result
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

// Dependency resolution
export interface DependencyInfo {
  readonly ruleId: string;
  readonly missingDependencies: readonly string[];
  readonly addedDependencies: readonly string[];
}

// Conflict detection
export interface ConflictInfo {
  readonly ruleId1: string;
  readonly ruleId2: string;
  readonly reason: string;
}

// Selection state for wizard
export interface RuleSelection {
  readonly ruleId: string;
  readonly selected: boolean;
  readonly reason?: string; // Why it was selected (manual, dependency, etc.)
}

// Wizard state
export interface WizardState {
  readonly selectedRules: readonly RuleSelection[];
  readonly dependencies: readonly DependencyInfo[];
  readonly conflicts: readonly ConflictInfo[];
  readonly outputPath: string;
  readonly dryRun: boolean;
}

// CLI options
export interface CLIOptions {
  readonly output?: string;
  readonly dryRun?: boolean;
  readonly verbose?: boolean;
  readonly help?: boolean;
  readonly version?: boolean;
}
