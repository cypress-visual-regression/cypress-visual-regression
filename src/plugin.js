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

async function parseImage(image) {
  return new Promise((resolve, reject) => {
    const fd = fs.createReadStream(image);
    fd.pipe(new PNG())
      .on('parsed', function() {
        const that = this;
        resolve(that);
      })
      .on('error', (error) => reject(error));
  });
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

  let mismatchedPixels = 0;
  let percentage = 0;
  try {
    const diffFolder = path.join(SNAPSHOT_DIRECTORY, 'diff');
    await createFolder(diffFolder);
    const specFolder = path.join(diffFolder, args.specDirectory);
    await createFolder(specFolder);
    const imgExpected = await parseImage(options.expectedImage);
    const imgActual = await parseImage(options.actualImage);
    const diff = new PNG({
      width: imgActual.width,
      height: imgActual.height,
    });

    mismatchedPixels = pixelmatch(
      imgActual.data,
      imgExpected.data,
      diff.data,
      imgActual.width,
      imgActual.height,
      { threshold: 0.1 }
    );
    percentage = (mismatchedPixels / imgActual.width / imgActual.height) ** 0.5;

    diff.pack().pipe(fs.createWriteStream(options.diffImage));
  } catch (error) {
    console.log(error);
  }
  return {
    mismatchedPixels,
    percentage,
  };
  /* eslint-enable func-names */
}

function getCompareSnapshotsPlugin(on) {
  on('task', { compareSnapshotsPlugin });
}

module.exports = getCompareSnapshotsPlugin;
