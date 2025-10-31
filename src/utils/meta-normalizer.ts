/**
 * Metadata normalizer utilities
 */

import type { RuleMetadata } from "../types/rule.types";

export type NormalizeOptions = {
  readonly minify?: boolean;
  readonly keepFields?: readonly string[];
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

  return clone as RuleMetadata;
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

  return base as RuleMetadata;
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
