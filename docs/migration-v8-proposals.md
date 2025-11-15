# Qooxdoo v8 Migration - Proposals and Analysis

## Overview

This document describes the analysis of the existing migration system and proposals for automatic migration to Qooxdoo v8.

## Analysis of the Existing System

### Migration Architecture

The Qooxdoo migration system is based on three main components:

1. **BaseMigration** (`qx.tool.migration.BaseMigration`):
   - Abstract base class with utility methods
   - `renameFilesUnlessDryRun()` - Rename files
   - `replaceInFilesUnlessDryRun()` - Replace text in files
   - `updateDependencyUnlessDryRun()` - Update dependencies
   - `updateSchemaUnlessDryRun()` - Update JSON schema
   - `upgradePackagesUnlessDryRun()` - Upgrade packages

2. **Runner** (`qx.tool.migration.Runner`):
   - Automatically executes all migration classes
   - Supports `--dry-run` for preview
   - Version detection via class name (e.g., M8_0_0 → 8.0.0)
   - Executes all methods starting with "migrate"

3. **Version-Specific Migrations**:
   - `M6_0_0.js` - Migration from v5 to v6
   - `M7_0_0.js` - Migration from v6 to v7
   - `M7_5_6.js` - Migration to v7.5.6 (Webfonts)
   - **M8_0_0.js** - NEW: Migration to v8 (implemented)

### Typical Migration Tasks

Based on analysis of existing migrations:

1. **Manifest.json Updates**:
   - Update schema version
   - Update dependencies (e.g., @qooxdoo/framework)
   - Remove deprecated properties
   - Add new properties

2. **compile.json Updates**:
   - Update schema version
   - Adjust ESLint configuration
   - Add new compiler options

3. **Source Code Changes**:
   - Rename files
   - Update API calls
   - Replace deprecated code

4. **Package Management**:
   - Upgrade dependencies
   - Update package configuration

## Breaking Changes for v8.0.0_beta

### Documented in CHANGELOG.md:

1. **CLI System Migration (yargs → CLI classes)**
   - **Problem**: Old yargs-based command extensions no longer work
   - **Solution**: New CLI class-based syntax
   - **Migration**: Manual adjustment of compile.js required
   - **Automation**: Warning and migration guide

2. **Properties and Members in Same Namespace**
   - **Problem**: A class can no longer have both a property and member with the same name
   - **Solution**: Resolve conflicts manually
   - **Migration**: Manual code review required
   - **Automation**: Warning

3. **Property Refining Behavior Changed**
   - **Problem**: Property is now added to subclass prototype instead of modified in place
   - **Solution**: Appears twice in the prototype chain
   - **Migration**: Manual review if property refining is used
   - **Automation**: Warning

4. **instance.name No Longer Available**
   - **Problem**: The predefined instance.name variable no longer exists
   - **Solution**: Use instance.classname instead
   - **Migration**: Automatic replacement `.name` → `.classname`
   - **Automation**: Automatic

5. **Property Check as String No Longer Supported**
   - **Problem**: String-based property checks generate errors
   - **Solution**: Use function or class
   - **Migration**: Manual code adjustment
   - **Automation**: Warning only

6. **ESLint 8 → ESLint 9 Migration**
   - **Problem**: Node.js >= 20.0.0 required, new Flat Config format
   - **Solution**: Automatic conversion of eslintConfig in compile.json
   - **Migration**: Plugin names must be complete
   - **Automation**: Automatically converted, warning for Node.js version

7. **qx.locale CLDR → Intl API**
   - **Problem**: Implementation switched from CLDR to native Intl API
   - **Solution**: Minor differences in formatting possible
   - **Migration**: Test locale-specific functionality
   - **Automation**: Warning

8. **qx.ui.table.Table - Model Data During Editing**
   - **Problem**: Setting model data during editing led to invalid edits
   - **Solution**: Now raises an error
   - **Migration**: Manual review required
   - **Automation**: Warning

9. **Appearance and Font Color Behavior**
   - **Problem**: Inconsistency when setting appearance and then font color fixed
   - **Solution**: Now uses the specified font color
   - **Migration**: Visual testing of UI components
   - **Automation**: Warning only

10. **qx.util.PropertyUtil API Changes**
    - **Problem**: Theme/user values can no longer be set independently of property mechanism
    - **Solution**: New Property instances instead of POJOs
    - **Migration**: Adjust API calls
    - **Automation**: Warning

### Deprecations (may be removed in future):

1. **qx.lang.normalize.Date** (deprecated since v7.0)
   - Use native Date methods

2. **qx.lang.String.startsWith/endsWith** (deprecated since v6.0)
   - Use native String.prototype methods

3. **Icon Font Loading**
   - Old `LoadMaterialIcons*` classes are deprecated
   - Use `@usefont` directive

## Implemented v8 Migration (M8_0_0.js)

The new migration class was created with the following methods:

### 1. `migrateManifest()`
- Updates all Manifest.json files
- Updates schema (when v8 schema is available)
- Updates @qooxdoo/framework dependency

### 2. `migrateTableModelUsage()`
- Warns about breaking change in qx.ui.table.Table
- Informs about necessary manual code reviews
- Marks as "pending" since manual adjustment is required

### 3. `migrateDeprecatedAPIs()`
- Scans for deprecated API usage
- Provides warnings and recommendations
- Patterns:
  - `qx.lang.normalize.Date`
  - `qx.lang.String.startsWith/endsWith`

### 4. `migrateCompileJson()`
- Updates compile.json schema (when v8 schema is available)
- Prepares for new compiler options

### 5. `migrateCompileJs()`
- Detects old yargs-based command extensions
- Provides detailed migration guide from yargs to CLI classes
- Marks as pending for manual migration

### 6. `migrateInstanceName()`
- Automatically replaces `.name` with `.classname`
- Uses regex to avoid false positives
- Applied only in source files

### 7. `migratePropertyMemberConflicts()`
- Warns about property/member namespace unification
- Informs about property refining behavior change
- Requires manual review of class definitions

### 8. `migrateNodeVersion()`
- Warns about Node.js >= 20.0.0 requirement
- Informs about ESLint 9 Flat Config auto-conversion
- Provides plugin naming guide

### 9. `migrateLocaleAPI()`
- Warns about qx.locale implementation change (CLDR → Intl API)
- Recommends testing locale-specific functionality
- Only shown if qx.locale is used

### 10. `migratePackages()`
- Upgrades installed packages to v8-compatible versions

## Usage of the Migration

### Dry-Run (recommended first):
```bash
qx migrate --dry-run --verbose
```

Shows what changes would be made without executing them.

### Execute Migration:
```bash
qx migrate --verbose
```

Executes all applicable migrations.

## Further Recommendations

### 1. Create Test Migrations
Test projects should be created under:
- `test/tool/integrationtest/test-migrations/v8.0.0/unmigrated/`
- `test/tool/integrationtest/test-migrations/v8.0.0/migrated/`

These serve to validate the migration.

### 2. Schema Updates
When new schemas for v8 are created:
- `https://qooxdoo.org/schema/Manifest-3-0-0.json`
- `https://qooxdoo.org/schema/compile-2-0-0.json`

Uncomment these in M8_0_0.js.

### 3. Extend Release Notes
A `release-notes-8.0.md` should be created with:
- New features
- Breaking changes (detailed)
- Migration guide
- Deprecations

### 4. Enhanced Code Scanning
For more complex migrations, an AST-based approach could be useful:
- Use of `@babel/parser` or similar tools
- Automatic code transformations with `jscodeshift`
- More accurate detection of API usage

### 5. Migration for Specific Patterns
If additional breaking changes are identified:

```javascript
async migrateSpecificPattern() {
  await this.replaceInFilesUnlessDryRun([
    {
      files: "source/**/*.js",
      from: /oldPattern/g,
      to: "newPattern"
    }
  ]);
}
```

## Summary

The v8 migration is now prepared with:

✅ Migration class M8_0_0.js created
✅ Manifest updates implemented
✅ Warnings for breaking changes implemented
✅ Deprecated API scanning implemented
✅ Compile.js migration guide implemented
✅ instance.name → classname automatic replacement
✅ Property/member namespace conflict warnings
✅ Node.js version and ESLint migration warnings
✅ Locale API change warnings
✅ Package upgrade prepared

⚠️ Manual steps required:
- Code review for qx.ui.table.Table usage
- Update deprecated APIs
- Migrate compile.js if using command extensions
- Review property/member conflicts
- Test locale functionality
- Verify Node.js >= 20.0.0
- Run tests

📋 Next Steps:
1. Create test migrations
2. Define v8 schemas
3. Write release notes
4. Conduct community testing

## Execution

The migration is automatically executed by the Runner when:
- The app version < 8.0.0
- The framework version >= 8.0.0

The Runner automatically calls all `migrate*()` methods of the M8_0_0 class.
