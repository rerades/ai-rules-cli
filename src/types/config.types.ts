/**
 * Configuration types for AI Rules CLI
 */

export interface RuleRepositoryConfig {
  readonly path: string;
  readonly rulesDirectory: string;
  readonly schemaPath: string;
}

export interface CLIConfig {
  readonly repository: RuleRepositoryConfig;
  readonly output: {
    readonly defaultDirectory: string;
    readonly rulesDirectory: string;
  };
  readonly ui: {
    readonly colors: boolean;
    readonly verbose: boolean;
  };
}

// Default configuration
export const DEFAULT_CONFIG: CLIConfig = {
  repository: {
    path: "~/ai-rules",
    rulesDirectory: "rules",
    schemaPath: "mdc.schema.json",
  },
  output: {
    defaultDirectory: ".cursor",
    rulesDirectory: "rules",
  },
  ui: {
    colors: true,
    verbose: false,
  },
} as const;
