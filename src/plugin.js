const path = require('path');

const imageDiff = require('image-diff');

const SNAPSHOT_DIRECTORY = path.join(__dirname, '..', 'cypress', 'snapshots');


function compareSnapshotsPlugin(args) {
  return new Promise((resolve, reject) => {
    const options = {
      actualImage: path.join(SNAPSHOT_DIRECTORY, 'actual', args.specDirectory, `${args.fileName}-actual.png`),
      expectedImage: path.join(SNAPSHOT_DIRECTORY, 'base', args.specDirectory, `${args.fileName}-base.png`),
      diffImage: path.join(SNAPSHOT_DIRECTORY, 'diff', args.specDirectory, `${args.fileName}-diff.png`),
    };
    imageDiff(options, (err, imagesAreSame) => {
      if (err) reject(err);
      resolve(imagesAreSame);
    });
  });
}

function getCompareSnapshotsPlugin(on) {
  on('task', { compareSnapshotsPlugin });
}

module.exports = getCompareSnapshotsPlugin;
