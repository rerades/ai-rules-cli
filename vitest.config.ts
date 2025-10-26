import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [],
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["node_modules", "dist", "**/*.d.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/__tests__/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": "/Users/rerades/_DEV/AI/_RERADES/ai-rules-cli/src",
    },
  },
});
