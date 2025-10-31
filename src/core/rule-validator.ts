/**
 * Rule validator module
 * Validates rule metadata against mdc.schema.json
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "fs";
import { join } from "path";
import type { RuleMetadata, ValidationResult } from "../types/rule.types";
import type { CLIConfig } from "../types/config.types";
import type { NormalizeOptions } from "../utils/meta-normalizer";

// AJV instance for validation
let ajvInstance: Ajv | null = null;

/**
 * Initializes the AJV validator with the schema
 */
const initializeValidator = (): Ajv => {
  if (ajvInstance) {
    return ajvInstance;
  }

  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
  });

  addFormats(ajv);

  // Load and compile the schema from the CLI directory
  const schemaPath = join(__dirname, "../../mdc.schema.json");
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

  ajv.addSchema(schema, "mdc-rule");
  ajvInstance = ajv;

  return ajv;
};

/**
 * Validates a single rule against the schema
 */
export const validateRule = (
  rule: RuleMetadata,
  _config: CLIConfig
): ValidationResult => {
  try {
    const ajv = initializeValidator();
    const validate = ajv.getSchema("mdc-rule");

    if (!validate) {
      return {
        isValid: false,
        errors: ["Schema not found: mdc-rule"],
        warnings: [],
      };
    }

    const isValid = validate(rule);

    if (isValid) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const errors =
      validate.errors?.map((error) => {
        const path = error.instancePath || error.schemaPath || "";
        return `${path}: ${error.message}`;
      }) || [];

    return {
      isValid: false,
      errors,
      warnings: [],
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ],
      warnings: [],
    };
  }
};

/**
 * Validates multiple rules and returns results
 */
export const validateRules = (
  rules: readonly RuleMetadata[],
  config: CLIConfig
): {
  readonly validRules: readonly RuleMetadata[];
  readonly invalidRules: readonly {
    rule: RuleMetadata;
    result: ValidationResult;
  }[];
} => {
  const validRules: RuleMetadata[] = [];
  const invalidRules: { rule: RuleMetadata; result: ValidationResult }[] = [];

  for (const rule of rules) {
    const result = validateRule(rule, config);

    if (result.isValid) {
      validRules.push(rule);
    } else {
      invalidRules.push({ rule, result });
    }
  }

  return {
    validRules,
    invalidRules,
  };
};

/**
 * Validates rule ID format
 */
export const validateRuleId = (id: string): boolean => {
  const pattern = /^[a-z0-9]+(\.[a-z0-9-]+)+$/;
  return pattern.test(id);
};

/**
 * Validates version format (SemVer)
 */
export const validateVersion = (version: string): boolean => {
  const pattern =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
  return pattern.test(version);
};

/**
 * Validates tag format
 */
export const validateTag = (tag: string): boolean => {
  const pattern = /^(topic|lint|test|perf|a11y|sec):[a-z0-9-\.]+$/;
  return pattern.test(tag);
};

/**
 * Validates bundle path format
 */
export const validateBundlePath = (bundle: string): boolean => {
  const pattern = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;
  return pattern.test(bundle);
};

/**
 * Validates all custom fields in a rule
 */
export const validateCustomFields = (rule: RuleMetadata): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate rule ID
  if (!validateRuleId(rule.id)) {
    errors.push(`Invalid rule ID format: ${rule.id}`);
  }

  // Validate version
  if (!validateVersion(rule.version)) {
    errors.push(`Invalid version format: ${rule.version}`);
  }

  // Validate tags
  if (rule.tags) {
    for (const tag of rule.tags) {
      if (!validateTag(tag)) {
        errors.push(`Invalid tag format: ${tag}`);
      }
    }
  }

  // Validate bundles
  if (rule.bundles) {
    for (const bundle of rule.bundles) {
      if (!validateBundlePath(bundle)) {
        errors.push(`Invalid bundle path format: ${bundle}`);
      }
    }
  }

  // Validate order range
  if (rule.order !== undefined && (rule.order < 0 || rule.order > 1000)) {
    errors.push(`Order must be between 0 and 1000, got: ${rule.order}`);
  }

  // Validate review cycle
  if (rule.review?.reviewCycleDays) {
    const days = rule.review.reviewCycleDays;
    if (days < 7 || days > 365) {
      errors.push(`Review cycle must be between 7 and 365 days, got: ${days}`);
    }
  }

  // Validate tags count
  if (rule.tags && rule.tags.length > 5) {
    warnings.push(`Rule has more than 5 tags: ${rule.tags.length}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Comprehensive validation of a rule
 */
export const validateRuleComprehensive = (
  rule: RuleMetadata,
  config: CLIConfig,
  options?: NormalizeOptions
): ValidationResult => {
  const schemaResult = validateRule(rule, config);
  const customResult = validateCustomFields(rule);

  const warnings = [...schemaResult.warnings, ...customResult.warnings];

  // When minify is requested, warn about non-essential fields present
  if (options?.minify) {
    const essential = new Set<string>(["id", "version", "title", "category"]);
    const keep = new Set<string>(options.keepFields ?? []);
    for (const key of Object.keys(rule as Record<string, unknown>)) {
      if (!essential.has(key) && !keep.has(key)) {
        warnings.push(`Optional field present under minify: ${key}`);
      }
    }
  }

  return {
    isValid: schemaResult.isValid && customResult.isValid,
    errors: [...schemaResult.errors, ...customResult.errors],
    warnings,
  };
};
