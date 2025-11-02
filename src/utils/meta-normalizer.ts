/**
 * Metadata normalizer utilities
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { RuleMetadata } from "../types/rule.types";

export type NormalizeOptions = {
  readonly minify?: boolean;
  readonly keepFields?: readonly string[];
};

export type MinificationMode = "minimal" | "recommended" | "select" | "all";

/**
 * Recommended fields for Cursor AI to understand and follow rules effectively.
 * These fields provide essential context without administrative noise.
 */
export const RECOMMENDED_FIELDS: readonly string[] = [
  "description", // Context of the rule
  "scope", // Where it applies
  "globs", // File patterns affected
  "language", // Target language
  "enforcement", // How it's applied (lint, ci, scaffold)
  "audience", // Target audience
  "severity", // Importance level
  "tags", // Categorization
  "links", // External references
  "order", // Relative priority
] as const;

/**
 * Required fields that should always be excluded from optional field lists
 */
const REQUIRED_FIELDS: readonly string[] = [
  "id",
  "version",
  "title",
  "category",
] as const;

/**
 * Gets available metadata fields from the schema JSON.
 * Excludes required fields (id, version, title, category).
 * @returns Array of field names that can be selected for minification
 */
export const getAvailableMetadataFields = (): readonly string[] => {
  try {
    // Get the schema file path relative to the project root
    // In development: src/utils/meta-normalizer.ts -> ../../mdc.schema.json
    // In build: dist/utils/meta-normalizer.js -> ../../mdc.schema.json
    const schemaPath = join(__dirname, "../../mdc.schema.json");
    const schemaContent = readFileSync(schemaPath, "utf8");
    const schema = JSON.parse(schemaContent) as {
      readonly properties: Record<string, unknown>;
      readonly required?: readonly string[];
    };

    const requiredSet = new Set(REQUIRED_FIELDS);
    const availableFields = Object.keys(schema.properties || {}).filter(
      (field) => !requiredSet.has(field)
    );

    // Sort alphabetically for consistent display
    return availableFields.sort();
  } catch (error) {
    // Fallback to a hardcoded list if schema can't be read
    console.warn(
      `Warning: Could not read schema file. Using fallback field list. ${error}`
    );
    return [
      "alwaysApply",
      "audience",
      "bundles",
      "conflicts",
      "description",
      "enforcement",
      "files",
      "frameworks",
      "globs",
      "i18n",
      "inputs",
      "language",
      "license",
      "lifecycle",
      "links",
      "maturity",
      "order",
      "owner",
      "requires",
      "review",
      "scope",
      "severity",
      "stability",
      "supersedes",
      "tags",
      "tooling",
    ];
  }
};

const isEmptyArray = (value: unknown): boolean =>
  Array.isArray(value) && value.length === 0;

/**
 * Removes default-valued and empty properties to reduce noise.
 */
export const stripDefaults = (meta: RuleMetadata): RuleMetadata => {
  const clone: Record<string, unknown> = { ...meta };

  // Keep alwaysApply regardless of its value
  // Remove empty arrays on common optional properties
  const arrayProps = [
    "globs",
    "frameworks",
    "tooling",
    "scope",
    "audience",
    "requires",
    "conflicts",
    "supersedes",
    "bundles",
    "files",
    "tags",
    "links",
  ] as const;

  for (const key of arrayProps) {
    if (isEmptyArray((clone as any)[key])) {
      delete (clone as any)[key];
    }
  }

  return clone as unknown as RuleMetadata;
};

/**
 * Keeps only essential fields and an allowlist of optional ones.
 */
export const pickEssential = (
  meta: RuleMetadata,
  keep: readonly string[] = []
): RuleMetadata => {
  const base: Record<string, unknown> = {
    id: meta.id,
    version: meta.version,
    title: meta.title,
    category: meta.category,
  };

  const allow = new Set(keep);

  // Always keep alwaysApply if present (regardless of keepFields)
  if (meta.alwaysApply !== undefined && meta.alwaysApply !== null) {
    base.alwaysApply = meta.alwaysApply;
  }

  const maybeCopy = (field: keyof RuleMetadata) => {
    const value = meta[field];
    if (value === undefined || value === null) return;
    if (allow.has(field as string)) {
      (base as any)[field] = value;
    }
  };

  // Commonly useful optional fields
  maybeCopy("description");
  maybeCopy("scope");
  maybeCopy("globs");
  maybeCopy("language");
  maybeCopy("enforcement");
  maybeCopy("audience");
  maybeCopy("severity");
  maybeCopy("order");
  maybeCopy("inputs");
  maybeCopy("tags");
  maybeCopy("links");

  return base as unknown as RuleMetadata;
};

/**
 * Normalizes rule metadata based on options.
 */
export const normalizeRuleMeta = (
  meta: RuleMetadata,
  options: NormalizeOptions = {}
): RuleMetadata => {
  const stripped = stripDefaults(meta);
  if (!options.minify) {
    return stripped;
  }
  return pickEssential(stripped, options.keepFields ?? []);
};
