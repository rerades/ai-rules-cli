/**
 * Dependency resolver module
 * Resolves rule dependencies and detects conflicts
 */

import type {
  RuleContent,
  DependencyInfo,
  ConflictInfo,
  RuleSelection,
} from "../types/rule.types";
import type { CLIConfig } from "../types/config.types";
import { loadAllRules, getAvailableRuleIds } from "./rule-loader";

/**
 * Resolves dependencies for selected rules
 */
export const resolveDependencies = async (
  selectedRuleIds: readonly string[],
  config: CLIConfig
): Promise<readonly DependencyInfo[]> => {
  const allRules = await loadAllRules(config);
  const availableRuleIds = await getAvailableRuleIds(config);
  const dependencies: DependencyInfo[] = [];
  const processed = new Set<string>();
  const toProcess = [...selectedRuleIds];

  // Process rules until no new dependencies are found
  while (toProcess.length > 0) {
    const currentId = toProcess.shift()!;

    if (processed.has(currentId)) {
      continue;
    }

    processed.add(currentId);
    const rule = allRules.find((r) => r.metadata.id === currentId);

    if (!rule) {
      continue;
    }

    const missingDependencies: string[] = [];
    const addedDependencies: string[] = [];

    // Check required dependencies
    if (rule.metadata.requires) {
      for (const requiredId of rule.metadata.requires) {
        if (!availableRuleIds.includes(requiredId)) {
          missingDependencies.push(requiredId);
        } else if (
          !processed.has(requiredId) &&
          !selectedRuleIds.includes(requiredId)
        ) {
          addedDependencies.push(requiredId);
          toProcess.push(requiredId);
        }
      }
    }

    if (missingDependencies.length > 0 || addedDependencies.length > 0) {
      dependencies.push({
        ruleId: currentId,
        missingDependencies,
        addedDependencies,
      });
    }
  }

  return dependencies;
};

/**
 * Detects conflicts between selected rules
 */
export const detectConflicts = async (
  selectedRuleIds: readonly string[],
  config: CLIConfig
): Promise<readonly ConflictInfo[]> => {
  const allRules = await loadAllRules(config);
  const conflicts: ConflictInfo[] = [];

  for (let i = 0; i < selectedRuleIds.length; i++) {
    const ruleId1 = selectedRuleIds[i];
    if (!ruleId1) {
      continue;
    }

    const rule1 = allRules.find((r) => r.metadata.id === ruleId1);

    if (!rule1) {
      continue;
    }

    // Check if this rule conflicts with any other selected rule
    if (rule1.metadata.conflicts) {
      for (const conflictingId of rule1.metadata.conflicts) {
        if (selectedRuleIds.includes(conflictingId)) {
          conflicts.push({
            ruleId1,
            ruleId2: conflictingId,
            reason: `Rule '${ruleId1}' conflicts with rule '${conflictingId}'`,
          });
        }
      }
    }

    // Check if any other selected rule conflicts with this rule
    for (let j = i + 1; j < selectedRuleIds.length; j++) {
      const ruleId2 = selectedRuleIds[j];
      if (!ruleId2) {
        continue;
      }

      const rule2 = allRules.find((r) => r.metadata.id === ruleId2);

      if (rule2?.metadata.conflicts?.includes(ruleId1)) {
        conflicts.push({
          ruleId1,
          ruleId2,
          reason: `Rule '${ruleId2}' conflicts with rule '${ruleId1}'`,
        });
      }
    }
  }

  return conflicts;
};

/**
 * Resolves all dependencies and conflicts for a selection
 */
export const resolveAllDependencies = async (
  selectedRuleIds: readonly string[],
  config: CLIConfig
): Promise<{
  readonly dependencies: readonly DependencyInfo[];
  readonly conflicts: readonly ConflictInfo[];
  readonly finalRuleIds: readonly string[];
}> => {
  const dependencies = await resolveDependencies(selectedRuleIds, config);
  const conflicts = await detectConflicts(selectedRuleIds, config);

  // Collect all rule IDs including dependencies
  const allRuleIds = new Set(selectedRuleIds);
  for (const dep of dependencies) {
    for (const addedId of dep.addedDependencies) {
      allRuleIds.add(addedId);
    }
  }

  const finalRuleIds = Array.from(allRuleIds);

  return {
    dependencies,
    conflicts,
    finalRuleIds,
  };
};

/**
 * Creates rule selections from rule IDs
 */
export const createRuleSelections = (
  ruleIds: readonly string[],
  allRules: readonly RuleContent[]
): readonly RuleSelection[] => {
  return ruleIds.map((ruleId) => {
    const rule = allRules.find((r) => r.metadata.id === ruleId);
    return {
      ruleId,
      selected: true,
      reason: rule ? "manually selected" : "dependency",
    };
  });
};

/**
 * Validates that all required rules are available
 */
export const validateRuleAvailability = async (
  ruleIds: readonly string[],
  config: CLIConfig
): Promise<{
  readonly available: readonly string[];
  readonly missing: readonly string[];
}> => {
  const availableRuleIds = await getAvailableRuleIds(config);
  const available: string[] = [];
  const missing: string[] = [];

  for (const ruleId of ruleIds) {
    if (availableRuleIds.includes(ruleId)) {
      available.push(ruleId);
    } else {
      missing.push(ruleId);
    }
  }

  return { available, missing };
};

/**
 * Sorts rules by their order field
 */
export const sortRulesByOrder = (
  rules: readonly RuleContent[]
): readonly RuleContent[] => {
  return [...rules].sort((a, b) => {
    const orderA = a.metadata.order ?? 1000;
    const orderB = b.metadata.order ?? 1000;
    return orderA - orderB;
  });
};

/**
 * Gets rules that supersede other rules
 */
export const getSupersedingRules = async (
  ruleIds: readonly string[],
  config: CLIConfig
): Promise<readonly { superseded: string; superseding: string }[]> => {
  const allRules = await loadAllRules(config);
  const superseding: { superseded: string; superseding: string }[] = [];

  for (const ruleId of ruleIds) {
    const rule = allRules.find((r) => r.metadata.id === ruleId);

    if (rule?.metadata.supersedes) {
      for (const supersededId of rule.metadata.supersedes) {
        if (ruleIds.includes(supersededId)) {
          superseding.push({
            superseded: supersededId,
            superseding: ruleId,
          });
        }
      }
    }
  }

  return superseding;
};

/**
 * Removes superseded rules from selection
 */
export const removeSupersededRules = async (
  ruleIds: readonly string[],
  config: CLIConfig
): Promise<readonly string[]> => {
  const superseding = await getSupersedingRules(ruleIds, config);
  const supersededIds = new Set(superseding.map((s) => s.superseded));

  return ruleIds.filter((ruleId) => !supersededIds.has(ruleId));
};

/**
 * Comprehensive dependency and conflict resolution
 */
export const resolveComprehensive = async (
  selectedRuleIds: readonly string[],
  config: CLIConfig
): Promise<{
  readonly finalSelections: readonly RuleSelection[];
  readonly dependencies: readonly DependencyInfo[];
  readonly conflicts: readonly ConflictInfo[];
  readonly superseding: readonly { superseded: string; superseding: string }[];
  readonly warnings: readonly string[];
}> => {
  const warnings: string[] = [];

  // Validate availability
  const availability = await validateRuleAvailability(selectedRuleIds, config);
  if (availability.missing.length > 0) {
    warnings.push(`Missing rules: ${availability.missing.join(", ")}`);
  }

  // Resolve dependencies
  const { dependencies, conflicts, finalRuleIds } =
    await resolveAllDependencies(availability.available, config);

  // Handle superseding
  const superseding = await getSupersedingRules(finalRuleIds, config);
  const finalIds = await removeSupersededRules(finalRuleIds, config);

  // Create final selections
  const allRules = await loadAllRules(config);
  const finalSelections = createRuleSelections(finalIds, allRules);

  // Add warnings for missing dependencies
  for (const dep of dependencies) {
    if (dep.missingDependencies.length > 0) {
      warnings.push(
        `Rule '${
          dep.ruleId
        }' has missing dependencies: ${dep.missingDependencies.join(", ")}`
      );
    }
  }

  return {
    finalSelections,
    dependencies,
    conflicts,
    superseding,
    warnings,
  };
};
