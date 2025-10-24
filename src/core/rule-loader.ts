/**
 * Rule loader module
 * Loads and parses rules from the repository
 */

import { readdir, readFile } from "fs/promises";
import { join, extname, basename } from "path";
import matter from "gray-matter";
import type { RuleContent, RuleMetadata } from "../types/rule.types";
import type { CLIConfig } from "../types/config.types";
import { getRulesDirectoryPath } from "./config";
import { validateRuleComprehensive } from "./rule-validator";

// Cache for loaded rules
const rulesCache = new Map<string, RuleContent[]>();

/**
 * Loads all rules from the repository
 */
export const loadAllRules = async (
  config: CLIConfig
): Promise<readonly RuleContent[]> => {
  const cacheKey = config.repository.path;

  // Return cached rules if available
  if (rulesCache.has(cacheKey)) {
    return rulesCache.get(cacheKey)!;
  }

  const rulesDirectory = getRulesDirectoryPath(config);
  const rules: RuleContent[] = [];

  try {
    const files = await readdir(rulesDirectory);
    const mdxFiles = files.filter((file) => extname(file) === ".mdx");

    for (const file of mdxFiles) {
      try {
        const rule = await loadRuleFromFile(config, file);
        if (rule) {
          rules.push(rule);
        }
      } catch (error) {
        console.warn(`Failed to load rule from ${file}:`, error);
      }
    }

    // Cache the loaded rules
    rulesCache.set(cacheKey, rules);

    return rules;
  } catch (error) {
    throw new Error(`Failed to load rules from ${rulesDirectory}: ${error}`);
  }
};

/**
 * Loads a single rule from a file
 */
export const loadRuleFromFile = async (
  config: CLIConfig,
  fileName: string
): Promise<RuleContent | null> => {
  const rulesDirectory = getRulesDirectoryPath(config);
  const filePath = join(rulesDirectory, fileName);

  try {
    const fileContent = await readFile(filePath, "utf8");
    const parsed = matter(fileContent);

    // Validate that frontmatter exists
    if (!parsed.data || Object.keys(parsed.data).length === 0) {
      console.warn(`No frontmatter found in ${fileName}`);
      return null;
    }

    // Parse and validate metadata
    const metadata = parsed.data as RuleMetadata;
    const validation = validateRuleComprehensive(metadata, config);

    if (!validation.isValid) {
      console.warn(`Invalid rule metadata in ${fileName}:`, validation.errors);
      return null;
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn(`Rule warnings in ${fileName}:`, validation.warnings);
    }

    return {
      metadata,
      content: parsed.content,
      filePath,
      fileName: basename(fileName, ".mdx"),
    };
  } catch (error) {
    console.warn(`Failed to parse rule from ${fileName}:`, error);
    return null;
  }
};

/**
 * Loads a specific rule by ID
 */
export const loadRuleById = async (
  config: CLIConfig,
  ruleId: string
): Promise<RuleContent | null> => {
  const allRules = await loadAllRules(config);
  return allRules.find((rule) => rule.metadata.id === ruleId) || null;
};

/**
 * Loads rules by category
 */
export const loadRulesByCategory = async (
  config: CLIConfig,
  category: string
): Promise<readonly RuleContent[]> => {
  const allRules = await loadAllRules(config);
  return allRules.filter((rule) => rule.metadata.category === category);
};

/**
 * Loads rules by multiple categories
 */
export const loadRulesByCategories = async (
  config: CLIConfig,
  categories: readonly string[]
): Promise<readonly RuleContent[]> => {
  const allRules = await loadAllRules(config);
  return allRules.filter((rule) => categories.includes(rule.metadata.category));
};

/**
 * Gets all available categories
 */
export const getAvailableCategories = async (
  config: CLIConfig
): Promise<readonly string[]> => {
  const allRules = await loadAllRules(config);
  const categories = new Set(allRules.map((rule) => rule.metadata.category));
  return Array.from(categories).sort();
};

/**
 * Gets all available rule IDs
 */
export const getAvailableRuleIds = async (
  config: CLIConfig
): Promise<readonly string[]> => {
  const allRules = await loadAllRules(config);
  return allRules.map((rule) => rule.metadata.id);
};

/**
 * Searches rules by text in title or summary
 */
export const searchRules = async (
  config: CLIConfig,
  query: string
): Promise<readonly RuleContent[]> => {
  const allRules = await loadAllRules(config);
  const lowerQuery = query.toLowerCase();

  return allRules.filter((rule) => {
    const title = rule.metadata.title.toLowerCase();
    const summary = rule.metadata.summary?.toLowerCase() || "";

    return title.includes(lowerQuery) || summary.includes(lowerQuery);
  });
};

/**
 * Gets rules that require a specific rule
 */
export const getRulesRequiring = async (
  config: CLIConfig,
  ruleId: string
): Promise<readonly RuleContent[]> => {
  const allRules = await loadAllRules(config);
  return allRules.filter((rule) => rule.metadata.requires?.includes(ruleId));
};

/**
 * Gets rules that conflict with a specific rule
 */
export const getRulesConflictingWith = async (
  config: CLIConfig,
  ruleId: string
): Promise<readonly RuleContent[]> => {
  const allRules = await loadAllRules(config);
  return allRules.filter((rule) => rule.metadata.conflicts?.includes(ruleId));
};

/**
 * Clears the rules cache
 */
export const clearRulesCache = (): void => {
  rulesCache.clear();
};

/**
 * Gets cache statistics
 */
export const getCacheStats = (): { size: number; keys: readonly string[] } => {
  return {
    size: rulesCache.size,
    keys: Array.from(rulesCache.keys()),
  };
};
