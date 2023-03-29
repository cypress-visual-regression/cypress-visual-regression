const { defineConfig } = require("cypress");
const fs = require("fs");
const getCompareSnapshotsPlugin = require("./dist/plugin.js");

module.exports = defineConfig({
  screenshotsFolder: "./cypress/snapshots/actual",
  trashAssetsBeforeRuns: true,
  video: false,
  e2e: {
    setupNodeEvents(on, config) {
      getCompareSnapshotsPlugin(on, config);

      on("task", {
        doesExist: (path) => fs.existsSync(path),
      });
    },
  },
});
