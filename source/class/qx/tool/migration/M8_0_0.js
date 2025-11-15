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
      let dryRun = this.getRunner().getDryRun();

      // Search for common patterns of setting table model data
      const sourceDir = path.join(process.cwd(), "source");
      if (!(await fs.existsAsync(sourceDir))) {
        return;
      }

      // Check for patterns like table.getTableModel().setData*
      const jsFiles = path.join(sourceDir, "**", "*.js");

      // This is informational only - we can't automatically fix this
      // because it requires understanding the application logic
      if (await this.checkFilesContain(jsFiles, "setData")) {
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
      }
    },

    /**
     * Check for usage of deprecated APIs from v6 and v7
     * that might be removed in v8
     */
    async migrateDeprecatedAPIs() {
      let dryRun = this.getRunner().getDryRun();
      const sourceDir = path.join(process.cwd(), "source");

      if (!(await fs.existsAsync(sourceDir))) {
        return;
      }

      const deprecationPatterns = [
        {
          pattern: "qx.lang.normalize.Date",
          message: "qx.lang.normalize.Date is deprecated since v7.0",
          replacement: "Use native Date methods instead"
        },
        {
          pattern: "String.startsWith",
          context: "qx.lang.String.startsWith",
          message: "qx.lang.String.startsWith is deprecated since v6.0",
          replacement: "Use native String.prototype.startsWith instead"
        },
        {
          pattern: "String.endsWith",
          context: "qx.lang.String.endsWith",
          message: "qx.lang.String.endsWith is deprecated since v6.0",
          replacement: "Use native String.prototype.endsWith instead"
        }
      ];

      for (const deprecation of deprecationPatterns) {
        if (await this.checkFilesContain(
          path.join(sourceDir, "**", "*.js"),
          deprecation.pattern
        )) {
          this.announce(
            `Found usage of deprecated API: ${deprecation.message}\n` +
            `Recommended action: ${deprecation.replacement}`
          );
          this.markAsPending(
            `Review usage of ${deprecation.pattern}`
          );
        }
      }
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
     * Upgrade packages to v8 compatible versions
     */
    async migratePackages() {
      await this.upgradePackagesUnlessDryRun();
    }
  }
});
