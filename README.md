# AI Rules CLI

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/rerades/ai-rules-cli?utm_source=oss&utm_medium=github&utm_campaign=rerades%2Fai-rules-cli&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

A CLI tool for managing Cursor AI rules with dependency resolution and conflict detection.

## Features

- **Interactive Wizard**: Step-by-step rule selection with visual feedback
- **Dependency Resolution**: Automatically resolves rule dependencies
- **Conflict Detection**: Identifies and helps resolve rule conflicts
- **Schema Validation**: Validates rules against the MDC schema
- **Multiple Commands**: List, validate, check, and generate rules
- **TypeScript**: Fully typed with strict mode

## Installation

### Global Installation

```bash
npm install -g ai-rules-cli
```

### Using npx (Recommended)

```bash
npx ai-rules-cli init
```

### Local Development

```bash
git clone https://github.com/rerades/ai-rules-cli.git
cd ai-rules-cli
npm install
npm run build
npm link
```

## Configuration

### QUICK RULES SETUP

**Note:** This CLI do not have any predefine rules so in order to use your rules you must tell the cli were to find your stored rules, by default the cli will try to fin the rules under your user directory `~/ai-rules` (you can change the path with environment variables)

Any new rule that you define _must follow_ [the predefined schema](./mdc.schema.json) created in this repository.

For a quick rules setup , I also maintain a [repo with rules](https://github.com/rerades/ai-rules) , you can fork it to create your own sets of rules.

You can install copy the rules to the default repository path `~/ai-rules` that uses this cli in order to quick star

The CLI uses the following default configuration:

- **Repository Path**: `~/ai-rules` This is were your rules are saved
- **Rules Directory**: `rules`
- **Schema File**: `mdc.schema.json`
- **Output Directory**: `.cursor/rules`

You can override these settings using environment variables:

```bash
export AI_RULES_REPO_PATH="/path/to/your/rules/repo"
export AI_RULES_OUTPUT_PATH="/path/to/output"
export AI_RULES_VERBOSE=true
```

## Usage

### Initialize a new project

```bash
ai-rules init
```

This will launch the interactive wizard to:

1. Select rule categories
2. Choose specific rules
3. Configure output directory
4. Resolve dependencies and conflicts
5. Generate rule files

### List available rules

```bash
ai-rules list
```

Options:

- `-c, --category <category>` - Filter by category
- `-s, --search <query>` - Search rules by title or summary
- `-v, --verbose` - Show detailed information

### Validate rules

```bash
ai-rules validate
```

Options:

- `-v, --verbose` - Show detailed validation results

### Check dependencies and conflicts

```bash
ai-rules check <rule-ids...>
```

Options:

- `-v, --verbose` - Show detailed information

### Generate rules directly

```bash
ai-rules generate <rule-ids...> -o <output-path>
```

Options:

- `-o, --output <path>` - Output directory path
- `--dry-run` - Simulate without creating files
- `-v, --verbose` - Enable verbose output

## Rule Schema

Rules must follow the MDC (Markdown with frontmatter) schema defined in `mdc.schema.json`. Each rule file should have:

- **Frontmatter**: YAML metadata with rule information
- **Content**: Markdown content with the actual rule

Example rule structure:

```yaml
---
id: "foundation.code-guidelines"
version: "1.0.0"
title: "Code Guidelines"
summary: "Basic coding standards and best practices"
category: "foundation"
scope: ["global"]
language: "ts"
lifecycle: "recommended"
maturity: "stable"
order: 10
---
# Code Guidelines

This rule defines basic coding standards...
```

## Output Structure

The CLI generates the following structure:

```
.cursor/
└── rules/
    ├── index.md
    ├── foundation.code-guidelines.mdc
    ├── typescript.conventions.mdc
    └── ...
```

### Index File

The `index.md` file contains:

- Overview of all rules
- Categorization
- Rule metadata
- Usage instructions

### Rule Files

Each rule file (`.mdc`) contains:

- YAML frontmatter with metadata
- Markdown content with the actual rule

## Development

### Prerequisites

- Node.js 18+
- TypeScript 5+
- npm or yarn

### Setup

```bash
git clone <repository-url>
cd ai-rules-cli
npm install
```

### Build

```bash
npm run build
```

### Development

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Architecture

The CLI is built with a modular architecture:

```
src/
├── core/           # Core business logic
│   ├── config.ts   # Configuration management
│   ├── rule-loader.ts      # Rule loading and parsing
│   ├── rule-validator.ts   # Schema validation
│   └── dependency-resolver.ts # Dependency resolution
├── ui/             # User interface
│   ├── wizard.ts   # Interactive wizard
│   ├── prompts.ts  # Inquirer prompts
│   ├── formatters.ts # Visual formatting
│   └── spinner.ts  # Loading indicators
├── generators/     # File generation
│   ├── output-generator.ts # Rule file generation
│   └── index-generator.ts  # Index file generation
├── utils/          # Utilities
│   ├── logger.ts   # Logging
│   └── file-utils.ts # File operations
├── types/          # TypeScript types
│   ├── rule.types.ts
│   ├── config.types.ts
│   └── wizard.types.ts
└── index.ts        # CLI entry point
```

## Error Handling

The CLI provides comprehensive error handling:

- **Validation Errors**: Clear messages for schema violations
- **Dependency Errors**: Missing dependencies are reported
- **Conflict Errors**: Rule conflicts are identified and resolved
- **File Errors**: File system operations are handled gracefully
- **User Errors**: Invalid inputs are caught and reported

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

- Create an issue on GitHub
- Check the documentation
- Review the examples

## Changelog

### v1.0.0

- Initial release
- Interactive wizard
- Dependency resolution
- Conflict detection
- Schema validation
- Professional UI
- Multiple commands
