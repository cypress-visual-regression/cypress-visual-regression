const fs = require('fs');
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

let SNAPSHOT_BASE_DIRECTORY;
let SNAPSHOT_DIFF_DIRECTORY;
let CYPRESS_SCREENSHOT_DIR;
let ALWAYS_GENERATE_DIFF;
let ALLOW_TO_FAIL;

function setupScreenshotPath(config) {
  // use cypress default path as fallback
  CYPRESS_SCREENSHOT_DIR =
    (config || {}).screenshotsFolder || 'cypress/screenshots';
}

function setupSnapshotPaths(args) {
  SNAPSHOT_BASE_DIRECTORY =
    args.baseDir || path.join(process.cwd(), 'cypress', 'snapshots', 'base');

  SNAPSHOT_DIFF_DIRECTORY =
    args.diffDir || path.join(process.cwd(), 'cypress', 'snapshots', 'diff');
}

function setupDiffImageGeneration(args) {
  ALWAYS_GENERATE_DIFF = true;
  if (args.keepDiff === false) ALWAYS_GENERATE_DIFF = false;
  ALLOW_TO_FAIL = false;
  if (args.allowToFail) ALLOW_TO_FAIL = true;
}

function visualRegressionCopy(args) {
  setupSnapshotPaths(args);
  const baseDir = path.join(SNAPSHOT_BASE_DIRECTORY, args.specName);
  const from = path.join(
    CYPRESS_SCREENSHOT_DIR,
    args.specName,
    `${args.from}.png`
  );
  const to = path.join(baseDir, `${args.to}.png`);

  return createFolder(baseDir, false).then(() => {
    fs.copyFileSync(from, to);
    return true;
  });
}

async function compareSnapshotsPlugin(args) {
  setupSnapshotPaths(args);
  setupDiffImageGeneration(args);

  const fileName = sanitize(args.fileName);

  const options = {
    actualImage: path.join(
      CYPRESS_SCREENSHOT_DIR,
      args.specDirectory,
      `${fileName}-actual.png`
    ),
    expectedImage: path.join(
      SNAPSHOT_BASE_DIRECTORY,
      args.specDirectory,
      `${fileName}-base.png`
    ),
    diffImage: path.join(
      SNAPSHOT_DIFF_DIRECTORY,
      args.specDirectory,
      `${fileName}-diff.png`
    ),
  };

  let mismatchedPixels = 0;
  let percentage = 0;
  try {
    await createFolder(SNAPSHOT_DIFF_DIRECTORY, args.failSilently);
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
      const specFolder = path.join(SNAPSHOT_DIFF_DIRECTORY, args.specDirectory);
      await createFolder(specFolder, args.failSilently);
      diff.pack().pipe(fs.createWriteStream(options.diffImage));
      if (!ALLOW_TO_FAIL) {
        throw new Error(
            `The "${fileName}" image is different. Threshold limit exceeded! \nExpected: ${args.errorThreshold} \nActual: ${percentage}`
        );
      }
    } else if (ALWAYS_GENERATE_DIFF) {
      const specFolder = path.join(SNAPSHOT_DIFF_DIRECTORY, args.specDirectory);
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

function getCompareSnapshotsPlugin(on, config) {
  setupScreenshotPath(config);
  on('task', {
    compareSnapshotsPlugin,
    visualRegressionCopy,
  });
}

module.exports = getCompareSnapshotsPlugin;
