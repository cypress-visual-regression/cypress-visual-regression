const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// TODO: allow user to define/update
const SNAPSHOT_DIRECTORY =
  process.env.SNAPSHOT_DIRECTORY ||
  path.join(__dirname, '..', '..', '..', 'cypress', 'snapshots');

async function createFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    try {
      await mkdirp(folderPath);
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  return true;
}

async function compareSnapshotsPlugin(args) {
  const options = {
    actualImage: path.join(
      SNAPSHOT_DIRECTORY,
      'actual',
      args.specDirectory,
      `${args.fileName}-actual.png`
    ),
    expectedImage: path.join(
      SNAPSHOT_DIRECTORY,
      'base',
      args.specDirectory,
      `${args.fileName}-base.png`
    ),
    diffImage: path.join(
      SNAPSHOT_DIRECTORY,
      'diff',
      args.specDirectory,
      `${args.fileName}-diff.png`
    ),
  };

  try {
    const diffFolder = path.join(SNAPSHOT_DIRECTORY, 'diff');
    await createFolder(diffFolder);
    const specFolder = path.join(diffFolder, args.specDirectory);
    await createFolder(specFolder);
  } catch (error) {
    console.log(error);
  }

  /* eslint-disable func-names */
  fs.createReadStream(options.actualImage)
    .pipe(new PNG())
    .on('parsed', function() {
      const imgActual = this;
      fs.createReadStream(options.expectedImage)
        .pipe(new PNG())
        .on('parsed', function() {
          const imgExpected = this;
          const diff = new PNG({
            width: imgActual.width,
            height: imgActual.height,
          });

          const mismatchedPixels = pixelmatch(
            imgActual.data,
            imgExpected.data,
            diff.data,
            imgActual.width,
            imgActual.height,
            { threshold: 0.1 }
          );

          diff.pack().pipe(fs.createWriteStream(options.diffImage));

          return {
            mismatchedPixels,
            percentage:
              (mismatchedPixels / imgActual.width / imgActual.height) ** 0.5,
          };
        })
        .on('error', (error) => {
          throw error;
        });
    })
    .on('error', (error) => {
      throw error;
    });
  /* eslint-enable func-names */
}

function getCompareSnapshotsPlugin(on) {
  on('task', { compareSnapshotsPlugin });
}

module.exports = getCompareSnapshotsPlugin;
