/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2024 The authors

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Migration Team

************************************************************************ */

const process = require("process");
const path = require("upath");
const semver = require("semver");
const fs = qx.tool.utils.Promisify.fs;

/**
 * Migration class for updating from v7 to v8
 */
qx.Class.define("qx.tool.migration.M8_0_0", {
  extend: qx.tool.migration.BaseMigration,
  members: {
    /**
     * Update Manifest.json files
     */
    async migrateManifest() {
      let dryRun = this.getRunner().getDryRun();
      let verbose = this.getRunner().getVerbose();

      // Update all Manifests
      for (const manifestModel of await qx.tool.config.Utils.getManifestModels()) {
        await manifestModel
          .set({
            warnOnly: true
          })
          .load();

        // Update schema to v8 schema (when available)
        // await this.updateSchemaUnlessDryRun(
        //   manifestModel,
        //   "https://qooxdoo.org/schema/Manifest-3-0-0.json"
        // );

        // Update qooxdoo version dependency
        await this.updateQxDependencyUnlessDryRun(manifestModel);

        // Save Manifest file
        if (!dryRun) {
          manifestModel.setValidate(false);
          await manifestModel.save();
        }
      }
    },

    /**
     * Migrate code that sets table model data during editing
     * This is now an error in v8, so we need to warn users
     */
    async migrateTableModelUsage() {
      // This is informational only - always announce this breaking change
      this.announce(
        "*** IMPORTANT: qx.ui.table.Table Breaking Change ***\n" +
        "Setting model data while the table is editing will now raise an error.\n" +
        "Please review your code to ensure that table edits are completed or\n" +
        "cancelled before refreshing table model data.\n" +
        "See: https://github.com/qooxdoo/qooxdoo/blob/master/CHANGELOG.md#breaking-changes"
      );
      this.markAsPending(
        "Manual review required for table model data updates"
      );
    },

    /**
     * Check for usage of deprecated APIs from v6 and v7
     * that might be removed in v8
     */
    async migrateDeprecatedAPIs() {
      // Inform about deprecated APIs
      this.announce(
        "*** INFO: Deprecated APIs ***\n" +
        "The following APIs are deprecated and may be removed in future versions:\n" +
        "- qx.lang.normalize.Date (deprecated since v7.0) - Use native Date methods\n" +
        "- qx.lang.String.startsWith/endsWith (deprecated since v6.0) - Use native String methods\n\n" +
        "Please review your code for usage of these deprecated APIs."
      );
    },

    /**
     * Update compile.json schema if needed
     */
    async migrateCompileJson() {
      const compileJsonModel = qx.tool.config.Compile.getInstance().set({
        warnOnly: true,
        validate: false
      });

      if (!(await fs.existsAsync(compileJsonModel.getDataPath()))) {
        return;
      }

      await compileJsonModel.load();

      // Update schema to v8 schema (when available)
      // await this.updateSchemaUnlessDryRun(
      //   compileJsonModel,
      //   "https://qooxdoo.org/schema/compile-2-0-0.json"
      // );

      if (!this.getRunner().getDryRun()) {
        await compileJsonModel.save();
      }
    },

    /**
     * Migrate compile.js from yargs to CLI classes
     * This is a major breaking change in v8
     */
    async migrateCompileJs() {
      const compileJsPath = path.join(process.cwd(), "compile.js");
      if (!(await fs.existsAsync(compileJsPath))) {
        return;
      }

      const content = await fs.readFileAsync(compileJsPath, "utf8");

      // Check if using old yargs API
      if (content.includes("getYargsCommand") || content.includes("yargs")) {
        this.announce(
          "*** IMPORTANT: CLI System Breaking Change ***\n" +
          "The CLI system has been migrated from yargs to custom CLI classes.\n" +
          "If your compile.js extends commands, you need to update the syntax.\n\n" +
          "Old syntax:\n" +
          "  let yargs = qx.tool.cli.commands.Test.getYargsCommand;\n" +
          "  qx.tool.cli.commands.Test.getYargsCommand = () => { ... };\n\n" +
          "New syntax:\n" +
          "  let originalCreateCliCommand = qx.tool.compiler.cli.commands.Test.createCliCommand;\n" +
          "  qx.tool.compiler.cli.commands.Test.createCliCommand = async function(clazz) {\n" +
          "    let cmd = await originalCreateCliCommand.call(this, clazz);\n" +
          "    cmd.addFlag(new qx.tool.cli.Flag(...));\n" +
          "  };\n\n" +
          "See CHANGELOG.md for detailed migration guide."
        );
        this.markAsPending("Manual migration of compile.js required");
      }
    },

    /**
     * Check for instance.name usage (no longer available in v8)
     * Should be replaced with instance.classname
     */
    async migrateInstanceName() {
      const sourceDir = path.join(process.cwd(), "source");
      if (!(await fs.existsAsync(sourceDir))) {
        return;
      }

      const jsFiles = path.join(sourceDir, "**", "*.js");

      // Replace .name with .classname (be careful with false positives)
      await this.replaceInFilesUnlessDryRun([
        {
          files: jsFiles,
          from: /\.name(?=\s*[;\),\n])/g,
          to: ".classname"
        }
      ]);
    },

    /**
     * Check for property and member namespace conflicts
     * Properties and members now share the same namespace
     */
    async migratePropertyMemberConflicts() {
      const sourceDir = path.join(process.cwd(), "source");
      if (!(await fs.existsAsync(sourceDir))) {
        return;
      }

      this.announce(
        "*** IMPORTANT: Property/Member Namespace Change ***\n" +
        "Properties and members are now in the same namespace.\n" +
        "If a class has both a property and a member with the same name,\n" +
        "this will cause a conflict. Please review your class definitions.\n\n" +
        "Also note: Refining a property in a subclass now adds it to the\n" +
        "subclass prototype instead of modifying it in place."
      );
      this.markAsPending("Manual review of property/member conflicts required");
    },

    /**
     * Warn about Node.js version requirement for ESLint 9
     */
    async migrateNodeVersion() {
      this.announce(
        "*** IMPORTANT: Node.js Version Requirement ***\n" +
        "qooxdoo v8 requires Node.js >= 20.0.0 for the compiler.\n" +
        "This is due to the migration from ESLint 8 to ESLint 9.\n\n" +
        "ESLint configuration in compile.json is automatically converted\n" +
        "from the old format to the new Flat Config format.\n\n" +
        "Plugin names must now be complete:\n" +
        "  Old: '@qooxdoo/qx'\n" +
        "  New: '@qooxdoo/eslint-plugin-qx' or full import"
      );
      this.markAsPending("Verify Node.js version >= 20.0.0");
    },

    /**
     * Warn about qx.locale changes (CLDR → Intl API)
     */
    async migrateLocaleAPI() {
      this.announce(
        "*** INFO: qx.locale Implementation Change ***\n" +
        "qx.locale classes now use the native Internationalization API\n" +
        "instead of the Common Locale Data Repository (CLDR) package.\n" +
        "This significantly reduces package size but may cause minor\n" +
        "differences in formatting for some locales.\n\n" +
        "Please test your locale-specific functionality if you use it."
      );
    },

    /**
     * Upgrade packages to v8 compatible versions
     */
    async migratePackages() {
      await this.upgradePackagesUnlessDryRun();
    }
  }
});
