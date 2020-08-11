const fs = require('fs');
const path = require('path');

const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// TODO: allow user to define/update
const SNAPSHOT_DIRECTORY =
  process.env.SNAPSHOT_DIRECTORY ||
  path.join(process.cwd(), 'cypress', 'snapshots');

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
    if (!fs.existsSync(image)) {
      reject(new Error(`Snapshot ${image} does not exist.`));
      return;
    }

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

function adjustCanvas(image, width, height) {
  if (image.width === width && image.height === height) {
    // fast-path
    return image;
  }

  const imageAdjustedCanvas = new PNG({
    width,
    height,
    bitDepth: image.bitDepth,
    inputHasAlpha: true,
  });

  PNG.bitblt(image, imageAdjustedCanvas, 0, 0, image.width, image.height, 0, 0);

  return imageAdjustedCanvas;
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
      width: Math.max(imgActual.width, imgExpected.width),
      height: Math.max(imgActual.height, imgExpected.height),
    });

    const imgActualFullCanvas = adjustCanvas(
      imgActual,
      diff.width,
      diff.height
    );
    const imgExpectedFullCanvas = adjustCanvas(
      imgExpected,
      diff.width,
      diff.height
    );

    mismatchedPixels = pixelmatch(
      imgActualFullCanvas.data,
      imgExpectedFullCanvas.data,
      diff.data,
      diff.width,
      diff.height,
      { threshold: 0.1 }
    );
    percentage = (mismatchedPixels / diff.width / diff.height) ** 0.5;

    diff.pack().pipe(fs.createWriteStream(options.diffImage));
  } catch (error) {
    return { error };
  }
  return {
    mismatchedPixels,
    percentage,
  };
}

function getCompareSnapshotsPlugin(on) {
  on('task', { compareSnapshotsPlugin });
}

module.exports = getCompareSnapshotsPlugin;
