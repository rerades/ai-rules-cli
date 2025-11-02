import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { homedir } from "os";
import { join } from "path";

// Mock fs before importing the module under test
vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

// Import the module under test
import {
  createConfig,
  getRulesDirectoryPath,
  getSchemaPath,
  getRuleFilePath,
  validateRepositoryConfig,
  getConfigFromEnv,
} from "../config";

import { existsSync } from "fs";
import type { CLIConfig } from "../../types/config.types";

describe("config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createConfig", () => {
    it("should create config with default values", () => {
      const config = createConfig();

      expect(config.repository.path).toBe(join(homedir(), "ai-rules")); // Tilde is expanded
      expect(config.repository.rulesDirectory).toBe("rules");
      expect(config.repository.schemaPath).toBe("mdc.schema.json");
      expect(config.output.defaultDirectory).toBe(".cursor");
      expect(config.output.rulesDirectory).toBe(".cursor/rules");
      expect(config.ui.colors).toBe(true);
      expect(config.ui.verbose).toBe(false);
    });

    it("should create config with custom repository path", () => {
      const customRepo = {
        repository: {
          path: "/custom/path",
          rulesDirectory: "rules",
          schemaPath: "mdc.schema.json",
        },
      };
      const config = createConfig(customRepo);

      expect(config.repository.path).toBe("/custom/path");
      expect(config.repository.rulesDirectory).toBe("rules");
      expect(config.repository.schemaPath).toBe("mdc.schema.json");
    });

    it("should create config with custom output settings", () => {
      const customRepo = {
        repository: {
          path: "/custom/path",
          rulesDirectory: "rules",
          schemaPath: "mdc.schema.json",
        },
      };
      const customOutput = {
        output: {
          defaultDirectory: "/custom/output",
          rulesDirectory: "rules",
        },
      };
      const config = createConfig({ ...customRepo, ...customOutput });

      expect(config.output.defaultDirectory).toBe("/custom/output");
      expect(config.output.rulesDirectory).toBe("rules");
    });

    it("should create config with custom UI settings", () => {
      const customRepo = {
        repository: {
          path: "/custom/path",
          rulesDirectory: "rules",
          schemaPath: "mdc.schema.json",
        },
      };
      const customOutput = { output: { defaultDirectory: "/custom/output" } };
      const customUI = { ui: { colors: false, verbose: true } };
      const config = createConfig({
        ...customRepo,
        ...customOutput,
        ...customUI,
      });

      expect(config.ui.colors).toBe(false);
      expect(config.ui.verbose).toBe(true);
    });
  });

  describe("getRulesDirectoryPath", () => {
    it("should return path for expanded tilde", () => {
      const config: CLIConfig = {
        repository: {
          path: join(homedir(), "ai-rules"),
          rulesDirectory: "rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = getRulesDirectoryPath(config);

      expect(result).toBe(join(homedir(), "ai-rules", "rules"));
    });

    it("should return absolute path unchanged", () => {
      const config: CLIConfig = {
        repository: {
          path: "/absolute/path",
          rulesDirectory: "rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = getRulesDirectoryPath(config);

      expect(result).toBe("/absolute/path/rules");
    });

    it("should handle custom rules directory", () => {
      const config: CLIConfig = {
        repository: {
          path: join(homedir(), "ai-rules"),
          rulesDirectory: "custom-rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = getRulesDirectoryPath(config);

      expect(result).toBe(join(homedir(), "ai-rules", "custom-rules"));
    });
  });

  describe("getSchemaPath", () => {
    it("should return repository schema when available", () => {
      const config: CLIConfig = {
        repository: {
          path: join(homedir(), "ai-rules"),
          rulesDirectory: "rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const repositorySchemaPath = join(homedir(), "ai-rules", "schema.json");

      (existsSync as any).mockImplementation(
        (path: string) => path === repositorySchemaPath
      );

      const result = getSchemaPath(config);

      expect(result).toBe(repositorySchemaPath);
    });

    it("should return absolute schema path unchanged", () => {
      const config: CLIConfig = {
        repository: {
          path: "/absolute/path",
          rulesDirectory: "rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const repositorySchemaPath = "/absolute/path/schema.json";

      (existsSync as any).mockImplementation(
        (path: string) => path === repositorySchemaPath
      );

      const result = getSchemaPath(config);

      expect(result).toBe(repositorySchemaPath);
    });

    it("should handle custom repository schema path", () => {
      const config: CLIConfig = {
        repository: {
          path: join(homedir(), "ai-rules"),
          rulesDirectory: "rules",
          schemaPath: "custom-schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const repositorySchemaPath = join(
        homedir(),
        "ai-rules",
        "custom-schema.json"
      );

      (existsSync as any).mockImplementation(
        (path: string) => path === repositorySchemaPath
      );

      const result = getSchemaPath(config);

      expect(result).toBe(repositorySchemaPath);
    });

    it("should fall back to CLI bundled schema when repository schema is missing", () => {
      const config: CLIConfig = {
        repository: {
          path: "/absolute/path",
          rulesDirectory: "rules",
          schemaPath: "mdc.schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const repositorySchemaPath = join(
        config.repository.path,
        config.repository.schemaPath
      );

      const observedPaths: string[] = [];
      (existsSync as any).mockImplementation((path: string) => {
        observedPaths.push(path);
        return path !== repositorySchemaPath;
      });

      const result = getSchemaPath(config);

      expect(result).not.toBe(repositorySchemaPath);
      expect(observedPaths).toContain(result);
    });
  });

  describe("getRuleFilePath", () => {
    it("should return path for expanded tilde", () => {
      const config: CLIConfig = {
        repository: {
          path: join(homedir(), "ai-rules"),
          rulesDirectory: "rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = getRuleFilePath(config, "foundation.test");

      expect(result).toBe(
        join(homedir(), "ai-rules", "rules", "foundation.test")
      );
    });

    it("should return absolute path unchanged", () => {
      const config: CLIConfig = {
        repository: {
          path: "/absolute/path",
          rulesDirectory: "rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = getRuleFilePath(config, "foundation.test");

      expect(result).toBe("/absolute/path/rules/foundation.test");
    });

    it("should handle custom rules directory", () => {
      const config: CLIConfig = {
        repository: {
          path: join(homedir(), "ai-rules"),
          rulesDirectory: "custom-rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = getRuleFilePath(config, "foundation.test");

      expect(result).toBe(
        join(homedir(), "ai-rules", "custom-rules", "foundation.test")
      );
    });
  });

  describe("validateRepositoryConfig", () => {
    it("should return false when repository does not exist", () => {
      (existsSync as any).mockReturnValue(false);

      const config: CLIConfig = {
        repository: {
          path: join(homedir(), "ai-rules"),
          rulesDirectory: "rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = validateRepositoryConfig(config);

      expect(result).toBe(false);
    });

    it("should return true when CLI schema exists even if repository schema is missing", () => {
      const repositoryPath = "/absolute/path";
      const rulesDirectory = "rules";
      const schemaFileName = "mdc.schema.json";
      const cliSchemaPath = join(__dirname, "../../../mdc.schema.json");
      const repositorySchemaPath = join(repositoryPath, schemaFileName);
      const rulesPath = join(repositoryPath, rulesDirectory);

      (existsSync as any).mockImplementation((path: string) => {
        if (path === repositoryPath) {
          return true;
        }
        if (path === rulesPath) {
          return true;
        }
        if (path === cliSchemaPath) {
          return true;
        }

        return false;
      });

      const config: CLIConfig = {
        repository: {
          path: repositoryPath,
          rulesDirectory,
          schemaPath: schemaFileName,
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = validateRepositoryConfig(config);

      expect(result).toBe(true);
      expect(existsSync as any).toHaveBeenCalledWith(cliSchemaPath);
      expect(existsSync as any).not.toHaveBeenCalledWith(repositorySchemaPath);
    });

    it("should handle validation errors gracefully", () => {
      // Test that the function doesn't throw errors
      const config: CLIConfig = {
        repository: {
          path: "/nonexistent/path",
          rulesDirectory: "rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = validateRepositoryConfig(config);

      expect(result).toBe(false);
    });
  });

  describe("getConfigFromEnv", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return empty config when no env vars are set", () => {
      const result = getConfigFromEnv();

      expect(result).toEqual({});
    });

    it("should use AI_RULES_REPO_PATH from environment", () => {
      process.env.AI_RULES_REPO_PATH = "/custom/repo";

      const result = getConfigFromEnv();

      expect(result.repository?.path).toBe("/custom/repo");
    });

    it("should use AI_RULES_OUTPUT_PATH from environment", () => {
      process.env.AI_RULES_OUTPUT_PATH = "/custom/output";

      const result = getConfigFromEnv();

      expect(result.output?.defaultDirectory).toBe("/custom/output");
    });

    it("should use AI_RULES_VERBOSE from environment", () => {
      process.env.AI_RULES_VERBOSE = "true";

      const result = getConfigFromEnv();

      expect(result.ui?.verbose).toBe(true);
    });

    it("should handle multiple environment variables", () => {
      process.env.AI_RULES_REPO_PATH = "/custom/repo";
      process.env.AI_RULES_OUTPUT_PATH = "/custom/output";
      process.env.AI_RULES_VERBOSE = "true";

      const result = getConfigFromEnv();

      expect(result.repository?.path).toBe("/custom/repo");
      expect(result.output?.defaultDirectory).toBe("/custom/output");
      expect(result.ui?.verbose).toBe(true);
    });

    it("should handle invalid boolean values", () => {
      process.env.AI_RULES_VERBOSE = "invalid";

      const result = getConfigFromEnv();

      expect(result.ui?.verbose).toBe(false); // Should default to false
    });
  });

  describe("edge cases", () => {
    it("should handle empty string paths", () => {
      const config: CLIConfig = {
        repository: { path: "", rulesDirectory: "", schemaPath: "" },
        output: { defaultDirectory: "", rulesDirectory: "" },
        ui: { colors: true, verbose: false },
      };

      const rulesPath = getRulesDirectoryPath(config);
      const schemaPath = getSchemaPath(config);
      const rulePath = getRuleFilePath(config, "test");

      expect(rulesPath).toBe(join("", ""));
      expect(schemaPath).toBe(join("", ""));
      expect(rulePath).toBe(join("", "", "test"));
    });

    it("should handle paths with special characters", () => {
      const config: CLIConfig = {
        repository: {
          path: join(homedir(), "path with spaces"),
          rulesDirectory: "rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = getRulesDirectoryPath(config);

      expect(result).toBe(join(homedir(), "path with spaces", "rules"));
    });

    it("should handle nested directory structures", () => {
      const config: CLIConfig = {
        repository: {
          path: join(homedir(), "nested", "deep", "path"),
          rulesDirectory: "rules",
          schemaPath: "schema.json",
        },
        output: { defaultDirectory: ".cursor", rulesDirectory: "rules" },
        ui: { colors: true, verbose: false },
      };

      const result = getRulesDirectoryPath(config);

      expect(result).toBe(join(homedir(), "nested", "deep", "path", "rules"));
    });
  });
});
