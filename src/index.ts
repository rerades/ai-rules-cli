#!/usr/bin/env node

/**
 * AI Rules CLI - Entry point
 * Professional CLI for managing Cursor AI rules with dependency resolution
 */

import { Command } from "commander";
import { runWizard } from "./ui/wizard";
import { defaultConfig, validateRepositoryConfig } from "./core/config";
import {
  createWelcomeBanner,
  createErrorMessage,
  createSuccessMessage,
} from "./ui/formatters";
import { loadAllRules } from "./core/rule-loader";
import { validateRules } from "./core/rule-validator";
import { resolveComprehensive } from "./core/dependency-resolver";
import { generateRuleFiles } from "./generators/output-generator";
import { generateIndexFile } from "./generators/index-generator";
// import type { CLIOptions } from "./types/rule.types";

/**
 * Main CLI program
 */
const program = new Command();

program
  .name("ai-rules")
  .description("CLI for managing Cursor AI rules with dependency resolution")
  .version("1.0.0");

/**
 * Init command - Main wizard
 */
program
  .command("init")
  .description("Initialize a new project with Cursor AI rules")
  .option("-o, --output <path>", "Output directory path")
  .option("--dry-run", "Simulate without creating files")
  .option("-v, --verbose", "Enable verbose output")
  .action(async (/* options: CLIOptions */) => {
    try {
      // Validate repository configuration
      if (!validateRepositoryConfig(defaultConfig)) {
        console.error(
          createErrorMessage("Repository configuration is invalid")
        );
        console.error(
          "Please check that the AI rules repository exists and is accessible"
        );
        process.exit(1);
      }

      // Run the wizard
      const result = await runWizard(defaultConfig);

      if (result.success) {
        console.log(createSuccessMessage("Project initialized successfully!"));
        if (result.outputPath) {
          console.log(`Rules generated in: ${result.outputPath}`);
        }
        if (result.generatedFiles) {
          console.log(`Generated ${result.generatedFiles.length} rule files`);
        }
      } else {
        console.error(createErrorMessage("Initialization failed"));
        if (result.errors) {
          for (const error of result.errors) {
            console.error(`  - ${error}`);
          }
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(createErrorMessage(`Unexpected error: ${error}`));
      process.exit(1);
    }
  });

/**
 * List command - List available rules
 */
program
  .command("list [query]")
  .description("List all available rules")
  .option("-c, --category <category>", "Filter by category")
  .option("-s, --search <query>", "Search rules by title or description")
  .option("-v, --verbose", "Show detailed information")
  .action(
    async (
      query: string,
      options: {
        category?: string;
        search?: string;
        verbose?: boolean;
      }
    ) => {
      try {
        console.log(createWelcomeBanner());

        const allRules = await loadAllRules(defaultConfig);

        let filteredRules = allRules;

        if (options.category) {
          filteredRules = filteredRules.filter(
            (rule) => rule.metadata.category === options.category
          );
        }

        const searchQuery = options.search || query;
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          filteredRules = filteredRules.filter(
            (rule) =>
              rule.metadata.title.toLowerCase().includes(lowerQuery) ||
              rule.metadata.description?.toLowerCase().includes(lowerQuery)
          );
        }

        console.log(`\nFound ${filteredRules.length} rules:\n`);

        for (const rule of filteredRules) {
          console.log(`• ${rule.metadata.title} (${rule.metadata.id})`);
          console.log(`  Category: ${rule.metadata.category}`);
          if (rule.metadata.description) {
            console.log(`  Description: ${rule.metadata.description}`);
          }
          if (options.verbose) {
            console.log(`  Version: ${rule.metadata.version}`);
            console.log(`  Maturity: ${rule.metadata.maturity || "unknown"}`);
            console.log(`  Stability: ${rule.metadata.stability || "unknown"}`);
          }
          console.log("");
        }
      } catch (error) {
        console.error(createErrorMessage(`Failed to list rules: ${error}`));
        process.exit(1);
      }
    }
  );

/**
 * Validate command - Validate rules
 */
program
  .command("validate")
  .description("Validate all rules against the schema")
  .option("-v, --verbose", "Show detailed validation results")
  .action(async (options: { verbose?: boolean }) => {
    try {
      console.log(createWelcomeBanner());

      const allRules = await loadAllRules(defaultConfig);
      const validation = validateRules(
        allRules.map((rule) => rule.metadata),
        defaultConfig
      );

      console.log(`\nValidation Results:`);
      console.log(`Valid rules: ${validation.validRules.length}`);
      console.log(`Invalid rules: ${validation.invalidRules.length}`);

      if (validation.invalidRules.length > 0) {
        console.log("\nInvalid rules:");
        for (const { rule, result } of validation.invalidRules) {
          console.log(`• ${rule.title} (${rule.id})`);
          for (const error of result.errors) {
            console.log(`  - ${error}`);
          }
        }
      }

      if (validation.validRules.length > 0 && options.verbose) {
        console.log("\nValid rules:");
        for (const rule of validation.validRules) {
          console.log(`• ${rule.title} (${rule.id})`);
        }
      }
    } catch (error) {
      console.error(createErrorMessage(`Validation failed: ${error}`));
      process.exit(1);
    }
  });

/**
 * Check command - Check dependencies and conflicts
 */
program
  .command("check")
  .description("Check dependencies and conflicts for selected rules")
  .argument("<rule-ids...>", "Rule IDs to check")
  .option("-v, --verbose", "Show detailed information")
  .action(async (ruleIds: string[] /* options: { verbose?: boolean } */) => {
    try {
      console.log(createWelcomeBanner());

      const resolution = await resolveComprehensive(ruleIds, defaultConfig);

      console.log(`\nDependency and Conflict Analysis:`);
      console.log(`Selected rules: ${ruleIds.length}`);
      console.log(`Final rules: ${resolution.finalSelections.length}`);
      console.log(`Dependencies: ${resolution.dependencies.length}`);
      console.log(`Conflicts: ${resolution.conflicts.length}`);
      console.log(`Superseding: ${resolution.superseding.length}`);

      if (resolution.dependencies.length > 0) {
        console.log("\nDependencies:");
        for (const dep of resolution.dependencies) {
          console.log(`• ${dep.ruleId}`);
          if (dep.missingDependencies.length > 0) {
            console.log(`  Missing: ${dep.missingDependencies.join(", ")}`);
          }
          if (dep.addedDependencies.length > 0) {
            console.log(`  Added: ${dep.addedDependencies.join(", ")}`);
          }
        }
      }

      if (resolution.conflicts.length > 0) {
        console.log("\nConflicts:");
        for (const conflict of resolution.conflicts) {
          console.log(`• ${conflict.ruleId1} ↔ ${conflict.ruleId2}`);
          console.log(`  ${conflict.reason}`);
        }
      }

      if (resolution.warnings.length > 0) {
        console.log("\nWarnings:");
        for (const warning of resolution.warnings) {
          console.log(`• ${warning}`);
        }
      }
    } catch (error) {
      console.error(createErrorMessage(`Check failed: ${error}`));
      process.exit(1);
    }
  });

/**
 * Generate command - Generate rules directly
 */
program
  .command("generate")
  .description("Generate rules directly without wizard")
  .argument("<rule-ids...>", "Rule IDs to generate")
  .option("-o, --output <path>", "Output directory path", "./")
  .option("--dry-run", "Simulate without creating files")
  .option("-v, --verbose", "Enable verbose output")
  .action(
    async (
      ruleIds: string[],
      options: { output: string; dryRun?: boolean; verbose?: boolean }
    ) => {
      try {
        console.log(createWelcomeBanner());

        const allRules = await loadAllRules(defaultConfig);
        const resolution = await resolveComprehensive(ruleIds, defaultConfig);

        if (resolution.conflicts.length > 0) {
          console.log(
            createErrorMessage(
              "Conflicts detected. Use the wizard to resolve them."
            )
          );
          process.exit(1);
        }

        const generationResult = await generateRuleFiles(
          allRules,
          resolution.finalSelections,
          options.output,
          defaultConfig,
          options.dryRun
        );

        if (!generationResult.success) {
          console.error(createErrorMessage("Generation failed"));
          for (const error of generationResult.errors) {
            console.error(`  - ${error}`);
          }
          process.exit(1);
        }

        const indexResult = await generateIndexFile(
          allRules,
          resolution.finalSelections,
          options.output,
          defaultConfig,
          options.dryRun
        );

        if (!indexResult.success) {
          console.error(createErrorMessage("Index generation failed"));
          process.exit(1);
        }

        console.log(
          createSuccessMessage(
            `Generated ${generationResult.generatedFiles.length} rule files`
          )
        );
      } catch (error) {
        console.error(createErrorMessage(`Generation failed: ${error}`));
        process.exit(1);
      }
    }
  );

/**
 * Error handling
 */
program.on("command:*", () => {
  console.error(
    createErrorMessage("Invalid command. Use --help for available commands.")
  );
  process.exit(1);
});

/**
 * Parse command line arguments
 */
program.parse();

/**
 * Handle uncaught exceptions
 */
process.on("uncaughtException", (error) => {
  console.error(createErrorMessage(`Uncaught exception: ${error.message}`));
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(createErrorMessage(`Unhandled rejection: ${reason}`));
  process.exit(1);
});
