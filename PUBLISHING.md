# Publishing Guide

This guide explains how to publish the AI Rules CLI to npm for public use.

## Prerequisites

1. **Node.js 18+** installed
2. **npm account** - Create one at [npmjs.com](https://npmjs.com)
3. **Git repository** - Ensure your code is in a Git repository

## Pre-Publication Checklist

### 1. Verify Package Configuration

Check that your `package.json` has the correct configuration:

```json
{
  "name": "ai-rules-cli",
  "version": "1.0.0",
  "description": "CLI for managing Cursor AI rules with dependency resolution and conflict detection",
  "main": "dist/index.js",
  "bin": {
    "ai-rules": "./dist/index.js"
  },
  "files": ["dist/**/*", "README.md", "LICENSE"],
  "repository": {
    "type": "git",
    "url": "https://github.com/rerades/ai-rules-cli.git"
  },
  "homepage": "https://github.com/rerades/ai-rules-cli#readme",
  "bugs": {
    "url": "https://github.com/rerades/ai-rules-cli/issues"
  }
}
```

### 2. Build and Test

```bash
# Build the project
npm run build

# Run tests
npm test

# Test the CLI locally
node dist/index.js --help
```

### 3. Check Package Contents

```bash
# See what will be included in the package
npm pack --dry-run
```

## Publishing Steps

### Method 1: Using the Publish Script (Recommended)

```bash
# Run the automated publish script
npm run publish:script
```

This script will:

- Build the project
- Run tests
- Check if the package name is available
- Show a dry run preview
- Ask for confirmation before publishing

### Method 2: Manual Publishing

```bash
# 1. Login to npm (if not already logged in)
npm login

# 2. Build the project
npm run build

# 3. Test the build
node dist/index.js --help

# 4. Check what will be published
npm pack --dry-run

# 5. Publish to npm
npm publish
```

## Post-Publication

### 1. Verify Installation

Test that users can install and use your package:

```bash
# Test global installation
npm install -g ai-rules-cli
ai-rules --help

# Test npx usage
npx ai-rules-cli --help
```

### 2. Update Documentation

- Update the README with the correct installation instructions
- Add any new features or changes to the changelog
- Update the repository with the latest changes

### 3. Create a Release

Create a Git tag for the version:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Version Management

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (1.1.0): New features, backward compatible
- **PATCH** (1.0.1): Bug fixes, backward compatible

### Updating Versions

```bash
# Update version in package.json
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0

# This automatically:
# - Updates package.json version
# - Creates a Git tag
# - Commits the changes
```

## Troubleshooting

### Common Issues

1. **Package name already exists**

   - Choose a different name
   - Use a scoped package: `@your-username/ai-rules-cli`

2. **Build fails**

   - Check TypeScript errors: `npm run build`
   - Fix linting issues: `npm run lint:fix`

3. **Permission denied**

   - Ensure you're logged in: `npm whoami`
   - Check npm permissions for the package

4. **Package too large**
   - Review `.npmignore` file
   - Remove unnecessary files from `files` array

### Getting Help

- Check npm documentation: [docs.npmjs.com](https://docs.npmjs.com)
- npm CLI help: `npm help publish`
- Package troubleshooting: `npm help package`

## Security Considerations

- Never commit `.npmrc` with sensitive tokens
- Use `npm login` for authentication
- Consider using 2FA for your npm account
- Review package contents before publishing

## Best Practices

1. **Test thoroughly** before publishing
2. **Use semantic versioning** consistently
3. **Write clear documentation** and changelog
4. **Keep dependencies up to date**
5. **Monitor package downloads** and issues
6. **Respond to user feedback** promptly

## Usage After Publishing

Once published, users can install and use your CLI:

```bash
# Global installation
npm install -g ai-rules-cli
ai-rules init

# Using npx (no installation required)
npx ai-rules-cli init

# Check version
ai-rules --version
```

## Maintenance

- Monitor for security vulnerabilities: `npm audit`
- Update dependencies regularly: `npm update`
- Respond to issues and feature requests
- Plan for future versions and breaking changes
