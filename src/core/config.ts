/**
 * Configuration module for AI Rules CLI
 * Manages repository paths and CLI settings
 */

import { join } from "path";
import type { CLIConfig } from "../types/config.types";
import { DEFAULT_CONFIG } from "../types/config.types";
import { resolvePath as resolvePathUtil } from "../utils/file-utils";

/**
 * Creates a configuration object with resolved paths
 */
export const createConfig = (overrides: Partial<CLIConfig> = {}): CLIConfig => {
  const config = { ...DEFAULT_CONFIG, ...overrides };

  return {
    ...config,
    repository: {
      path: resolvePathUtil(config.repository.path),
      rulesDirectory: config.repository.rulesDirectory,
      schemaPath: config.repository.schemaPath,
    },
    output: {
      defaultDirectory: config.output.defaultDirectory,
      rulesDirectory: config.output.rulesDirectory,
    },
    ui: {
      verbose: config.ui.verbose,
      colors: config.ui.colors,
    },
  };
};

/**
 * Gets the full path to the rules directory
 */
export const getRulesDirectoryPath = (config: CLIConfig): string => {
  return join(config.repository.path, config.repository.rulesDirectory);
};

/**
 * Gets the full path to the schema file
 */
export const getSchemaPath = (config: CLIConfig): string => {
  return join(config.repository.path, config.repository.schemaPath);
};

/**
 * Gets the full path to a specific rule file
 */
export const getRuleFilePath = (
  config: CLIConfig,
  fileName: string
): string => {
  return join(getRulesDirectoryPath(config), fileName);
};

/**
 * Validates that the repository configuration is valid
 */
export const validateRepositoryConfig = (config: CLIConfig): boolean => {
  const { repository } = config;

  // Check if repository path exists
  try {
    const { existsSync } = require("fs");

    if (!existsSync(repository.path)) {
      return false;
    }

    // Check if rules directory exists
    const rulesPath = join(repository.path, repository.rulesDirectory);
    if (!existsSync(rulesPath)) {
      return false;
    }

    // Check if schema file exists
    const schemaPath = join(repository.path, repository.schemaPath);
    if (!existsSync(schemaPath)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Gets configuration from environment variables
 */
export const getConfigFromEnv = (): Partial<CLIConfig> => {
  const envConfig: Partial<CLIConfig> = {};

  if (process.env.AI_RULES_REPO_PATH) {
    (envConfig as any).repository = {
      path: process.env.AI_RULES_REPO_PATH,
      rulesDirectory: DEFAULT_CONFIG.repository.rulesDirectory,
      schemaPath: DEFAULT_CONFIG.repository.schemaPath,
    };
  }

  if (process.env.AI_RULES_OUTPUT_PATH) {
    (envConfig as any).output = {
      defaultDirectory: process.env.AI_RULES_OUTPUT_PATH,
      rulesDirectory: DEFAULT_CONFIG.output.rulesDirectory,
    };
  }

  if (process.env.AI_RULES_VERBOSE) {
    (envConfig as any).ui = {
      verbose: process.env.AI_RULES_VERBOSE === "true",
      colors: DEFAULT_CONFIG.ui.colors,
    };
  }

  return envConfig;
};

/**
 * Default configuration instance
 */
export const defaultConfig = createConfig(getConfigFromEnv());
