#!/bin/bash

# AI Rules CLI - Publish Script
# This script helps publish the package to npm

set -e

echo "🚀 Publishing AI Rules CLI to npm..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if user is logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Error: Not logged in to npm. Please run 'npm login' first."
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: Build failed. dist/index.js not found."
    exit 1
fi

# Make sure the executable has the right permissions
chmod +x dist/index.js

# Run tests (if any)
echo "🧪 Running tests..."
npm test

# Check if package name is available
PACKAGE_NAME=$(node -p "require('./package.json').name")
echo "📋 Checking if package name '$PACKAGE_NAME' is available..."

if npm view "$PACKAGE_NAME" version > /dev/null 2>&1; then
    echo "⚠️  Warning: Package '$PACKAGE_NAME' already exists on npm."
    echo "   Current version on npm: $(npm view "$PACKAGE_NAME" version)"
    echo "   Local version: $(node -p "require('./package.json').version")"
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Publishing cancelled."
        exit 1
    fi
fi

# Dry run to check what will be published
echo "🔍 Running dry run to check what will be published..."
npm publish --dry-run

echo ""
read -p "Do you want to proceed with publishing? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publishing cancelled."
    exit 1
fi

# Publish to npm
echo "📤 Publishing to npm..."
npm publish

echo "✅ Successfully published $PACKAGE_NAME to npm!"
echo ""
echo "🎉 You can now install it with:"
echo "   npm install -g $PACKAGE_NAME"
echo "   # or"
echo "   npx $PACKAGE_NAME"
echo ""
echo "📖 Usage:"
echo "   $PACKAGE_NAME --help"
echo "   $PACKAGE_NAME init"
