const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const sanitize = require('sanitize-filename');

const {
  adjustCanvas,
  createFolder,
  parseImage,
  errorSerialize,
} = require('./utils');

let CYPRESS_SCREENSHOT_DIR;

function setupScreenshotPath(config) {
  // use cypress default path as fallback
  CYPRESS_SCREENSHOT_DIR =
    (config || {}).screenshotsFolder || 'cypress/screenshots';
}

/** Move the snapshot .png file to a new path.
 * The target path is constructed from parts at runtime in node to be OS independent.  */
async function moveSnapshot(args) {
  const { fromPath, toDir, specName, fileName } = args;
  const destDir = path.join(toDir, specName);
  await createFolder(destDir, false);
  const destFile = path.join(destDir, fileName);
  return fsp.rename(fromPath, destFile).then(() => null);
}

/** Cypresss plugin to compare image snapshots & generate a diff image.
 *
 * Uses the pixelmatch library internally.
 */
async function compareSnapshotsPlugin(args) {
  const snapshotBaseDirectory =
    args.baseDir || path.join(process.cwd(), 'cypress', 'snapshots', 'base');
  const snapshotDiffDirectory =
    args.diffDir || path.join(process.cwd(), 'cypress', 'snapshots', 'diff');
  const alwaysGenerateDiff = !(args.keepDiff === false);

  const fileName = sanitize(args.fileName);

  const options = {
    actualImage: path.join(
      CYPRESS_SCREENSHOT_DIR,
      args.specDirectory,
      `${fileName}-actual.png`
    ),
    expectedImage: path.join(
      snapshotBaseDirectory,
      args.specDirectory,
      `${fileName}-base.png`
    ),
    diffImage: path.join(
      snapshotDiffDirectory,
      args.specDirectory,
      `${fileName}-diff.png`
    ),
  };

  let mismatchedPixels = 0;
  let percentage = 0;
  try {
    await createFolder(snapshotDiffDirectory, args.failSilently);
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

    if (percentage > args.errorThreshold) {
      const specFolder = path.join(snapshotDiffDirectory, args.specDirectory);
      await createFolder(specFolder, args.failSilently);
      diff.pack().pipe(fs.createWriteStream(options.diffImage));
      throw new Error(
        `The "${fileName}" image is different. Threshold limit exceeded! \nExpected: ${args.errorThreshold} \nActual: ${percentage}`
      );
    } else if (alwaysGenerateDiff) {
      const specFolder = path.join(snapshotDiffDirectory, args.specDirectory);
      await createFolder(specFolder, args.failSilently);
      diff.pack().pipe(fs.createWriteStream(options.diffImage));
    }
  } catch (error) {
    return { error: errorSerialize(error) };
  }
  return {
    mismatchedPixels,
    percentage,
  };
}

/** Install plugin to compare snapshots.
 * (Also installs an internally used plugin to move snapshot files). */
function getCompareSnapshotsPlugin(on, config) {
  setupScreenshotPath(config);
  on('task', {
    compareSnapshotsPlugin,
    moveSnapshot,
  });
}

module.exports = getCompareSnapshotsPlugin;
