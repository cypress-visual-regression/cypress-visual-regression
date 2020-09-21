const fs = require("fs");
const getCompareSnapshotsPlugin = require('../../dist/plugin.js');

module.exports = (on, config) => {
  getCompareSnapshotsPlugin(on, config);

  on("task", {
    doesExist: path => {
      return fs.existsSync(path);
    }
  })
};
