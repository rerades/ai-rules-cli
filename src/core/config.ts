/**
 * Configuration module for AI Rules CLI
 * Manages repository paths and CLI settings
 */

import { existsSync } from "fs";
import { join, isAbsolute } from "path";
import type { CLIConfig, DeepPartial } from "../types/config.types";
import { DEFAULT_CONFIG } from "../types/config.types";
import { resolvePath as resolvePathUtil } from "../utils/file-utils";

/**
 * Resolves potential schema locations, preferring the CLI's bundled schema
 * and falling back to the rules repository if needed.
 */
const getSchemaCandidates = (
  schemaPath: string,
  repositoryPath: string
): readonly string[] => {
  if (isAbsolute(schemaPath)) {
    return [schemaPath];
  }

  const cliSchemaPath = join(__dirname, "../../", schemaPath);
  const repositorySchemaPath = join(repositoryPath, schemaPath);

  if (cliSchemaPath === repositorySchemaPath) {
    return [cliSchemaPath];
  }

  return [cliSchemaPath, repositorySchemaPath];
};

/**
 * Creates a configuration object with resolved paths
 */
export const createConfig = (overrides: DeepPartial<CLIConfig> = {}): CLIConfig => {
  const mergedRepository = {
    ...DEFAULT_CONFIG.repository,
    ...(overrides.repository ?? {}),
  } as typeof DEFAULT_CONFIG.repository;

  const mergedOutput = {
    ...DEFAULT_CONFIG.output,
    ...(overrides.output ?? {}),
  } as typeof DEFAULT_CONFIG.output;

  const mergedUI = {
    ...DEFAULT_CONFIG.ui,
    ...(overrides.ui ?? {}),
  } as typeof DEFAULT_CONFIG.ui;

  const resolvedRepositoryPath = resolvePathUtil(mergedRepository.path);

  return {
    repository: {
      path: resolvedRepositoryPath,
      rulesDirectory: mergedRepository.rulesDirectory,
      schemaPath: mergedRepository.schemaPath,
    },
    output: {
      defaultDirectory: mergedOutput.defaultDirectory,
      rulesDirectory: mergedOutput.rulesDirectory,
    },
    ui: {
      verbose: mergedUI.verbose,
      colors: mergedUI.colors,
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
  if (!config.repository.schemaPath) {
    return join(config.repository.path, config.repository.schemaPath);
  }

  const candidates = getSchemaCandidates(
    config.repository.schemaPath,
    config.repository.path
  );

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return (
    candidates[0] ?? join(config.repository.path, config.repository.schemaPath)
  );
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
    if (!existsSync(repository.path)) {
      return false;
    }

    // Check if rules directory exists
    const rulesPath = join(repository.path, repository.rulesDirectory);
    if (!existsSync(rulesPath)) {
      return false;
    }

    // Check if schema file exists either in the CLI bundle or the repository
    const schemaExists = getSchemaCandidates(
      repository.schemaPath,
      repository.path
    ).some((candidate) => existsSync(candidate));

    if (!schemaExists) {
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
export const getConfigFromEnv = (): DeepPartial<CLIConfig> => {
  const envConfig: DeepPartial<CLIConfig> = {};

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
