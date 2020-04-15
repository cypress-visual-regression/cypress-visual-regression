const fs = require('fs');
const path = require('path');

const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// TODO: allow user to define/update
const SNAPSHOT_DIRECTORY =
  process.env.SNAPSHOT_DIRECTORY ||
  path.join(__dirname, '..', '..', '..', 'cypress', 'snapshots');

async function mkdirp(folderPath) {
  return new Promise((resolve, reject) => {
    fs.mkdir(folderPath, { recursive: true }, (error) => {
      if (error) {
        console.log(error); // eslint-disable-line no-console
        reject(new Error(`Error in creating ${folderPath}`));
      }
      resolve(true);
    });
  });
}

async function createFolder(folderPath, failSilently) {
  if (!fs.existsSync(folderPath)) {
    try {
      await mkdirp(folderPath);
    } catch (error) {
      if (failSilently) {
        console.log(error); // eslint-disable-line no-console
        return false;
      }
      throw error;
    }
  }
  return true;
}

async function parseImage(image) {
  return new Promise((resolve, reject) => {
    const fd = fs.createReadStream(image);
    /* eslint-disable func-names */
    fd.pipe(new PNG())
      .on('parsed', function() {
        const that = this;
        resolve(that);
      })
      .on('error', (error) => reject(error));
    /* eslint-enable func-names */
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
    await createFolder(diffFolder, args.failSilently);
    const specFolder = path.join(diffFolder, args.specDirectory);
    await createFolder(specFolder, args.failSilently);
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
    console.log(error); // eslint-disable-line no-console
  }
  return {
    mismatchedPixels,
    percentage,
  };
}

function checkBaseSnapshot(args) {
  const base = path.join(
    SNAPSHOT_DIRECTORY,
    'base',
    args.specDirectory,
    `${args.fileName}-base.png`
  );
  return {
    existsBase: fs.existsSync(base),
  };
}

function getCompareSnapshotsPlugin(on) {
  on('task', { compareSnapshotsPlugin });
  on('task', { checkBaseSnapshot });
}

module.exports = getCompareSnapshotsPlugin;
