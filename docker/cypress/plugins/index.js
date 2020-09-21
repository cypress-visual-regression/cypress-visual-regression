const fs = require("fs");
const getCompareSnapshotsPlugin = require('../../dist/plugin.js');

module.exports = (on) => {
  getCompareSnapshotsPlugin(on);

  on("task", {
    doesExist: path => {
      return fs.existsSync(path);
    }
  })
};
