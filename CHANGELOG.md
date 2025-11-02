## Changelog

### v1.1.0

- **Claude AI Integration**: Added automatic generation of `claude.md` file for Claude AI integration
  - The CLI now generates a comprehensive `claude.md` file alongside `index.md` when running `init` or `generate` commands
  - The file provides structured guidelines for Claude AI to reference `.cursor/rules` directory and maintain consistency with Cursor IDE
  - Includes documentation on how Claude can benefit from rules, usage examples, and best practices
  - Generation failures are handled gracefully with warnings, not blocking the overall operation
- **Frontmatter Minification**: Expanded minification options for rule file frontmatter
  - Added new "all" mode to retain all metadata fields without minification
  - Enhanced user prompts to configure minification settings during wizard flow
  - Added `--keep` option to specify comma-separated optional fields to retain when minifying
  - Improved documentation with examples of minimal and extended frontmatter formats
- **Refactoring**: Improved spinner management for claude.md generation
  - Moved spinner creation and management inside `generateClaudeMd` function for better encapsulation
  - Removed external spinner handling from wizard, simplifying code flow
  - Error handling now warns without interrupting the wizard operation

### v1.0.3

- Adjusted schema resolution to prioritize the CLI-bundled `mdc.schema.json` and avoid requiring a duplicate in downstream repositories

### v1.0.2

- **Package Management**: Updated version to 1.0.2 and included mdc.schema.json in files list for better package distribution
- **Build Process**: Streamlined .npmignore for cleaner package and improved build process
  - Simplified .npmignore by removing unnecessary entries and adding relevant patterns for test files and source maps
  - Updated package.json to include a clean script before the build process, ensuring a fresh build environment
  - Adjusted tsconfig.json to disable declaration and source maps for a more efficient build
  - Enhanced error messaging in src/index.ts for clearer repository path guidance
- **Configuration**: Enhanced configuration handling with DeepPartial type and improved test exclusions

  - Updated the createConfig and getConfigFromEnv functions to utilize DeepPartial for better type safety
  - Refactored configuration merging logic for repository, output, and UI properties
  - Expanded tsconfig.json exclusions to include test files for cleaner builds

- **Testing**: Cleaned up type imports and enhanced test structure
  - Removed unused type imports from dependency-resolver.test.ts for clarity
  - Updated config.test.ts to include additional properties in the custom repository object for improved test coverage
  - Adjusted logger.test.ts to safely access mock console log calls, preventing potential runtime errors
- **Documentation**: Enhanced documentation with structured sections and visual elements
  - Added a banner image and centered title for improved presentation
  - Expanded the overview section to clarify the tool's purpose and features
  - Organized installation, configuration, usage, rule schema, output structure, development, architecture, error handling, contributing, and support sections with clear headings and icons
  - Updated the license section for better visibility and clarity
  - Added CodeRabbit badge and quick rules setup instructions
- **Schema Validation**: Expanded the MDC schema, introduced AJV-based validation, and aligned rule metadata to cover additional categories and stability signals
- **Utilities**: Added comprehensive file utilities with safe read/write helpers and standardized path resolution for repository assets
- **Scripts**: Adjusted vitest test commands to use 'run' for single execution and default for watch mode
- **Bug Fixes**: Improved path resolution by using isAbsolute for clarity in file-utils

### v1.0.0

- Initial release
- Interactive wizard
- Dependency resolution
- Conflict detection
- Schema validation
- Professional UI
- Multiple commands
