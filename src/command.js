const { deserializeError } = require('./utils-browser');

/* eslint-disable no-undef */

/** return the errorThreshold from the options settings */
function thresholdOption(defaultScreenshotOptions, params) {
  if (typeof params === 'number') {
    return params;
  }
  if (typeof params === 'object' && params.errorThreshold) {
    return params.errorThreshold;
  }

  return defaultScreenshotOptions?.errorThreshold || 0;
}

/** Take a screenshot and move the file to specified folder */
function screenshotToDir(subject, baseFileName, screenshotOptions, toDir) {
  let fromPath;
  const objToOperateOn = subject ? cy.get(subject) : cy;

  // save the path to forward between screenshot and move tasks
  function onAfterScreenshot(_doc, props) {
    fromPath = props.path;
  }

  objToOperateOn
    .screenshot(`${baseFileName}`, { ...screenshotOptions, onAfterScreenshot })
    .then(() => {
      if (toDir) {
        cy.task('moveSnapshot', {
          fromPath,
          toDir,
          specName: Cypress.spec.name,
          fileName: `${baseFileName}.png`,
        });
      }
    });
}

/** Take a screenshot and move screenshot to base or actual folder */
function takeScreenshot(subject, name, screenshotOptions) {
  if (Cypress.env('type') === 'base') {
    const toDir = Cypress.env('SNAPSHOT_BASE_DIRECTORY');
    screenshotToDir(subject, `${name}-base`, screenshotOptions, toDir);
  } else {
    const toDir = Cypress.config().screenshotsFolder;
    screenshotToDir(subject, `${name}-actual`, screenshotOptions, toDir);
  }
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(name, errorThreshold) {
  if (Cypress.env('type') === 'base') {
    return;
  }

  const options = {
    fileName: name,
    specDirectory: Cypress.spec.name,
    baseDir: Cypress.env('SNAPSHOT_BASE_DIRECTORY'),
    diffDir: Cypress.env('SNAPSHOT_DIFF_DIRECTORY'),
    keepDiff: Cypress.env('ALWAYS_GENERATE_DIFF'),
    errorThreshold,
  };
  cy.task('compareSnapshotsPlugin', options).then((results) => {
    if (results.error) {
      throw deserializeError(results.error);
    }
  });
}

/** Add custom cypress command to compare image snapshots of an element or the window. */
function compareSnapshotCommand(defaultScreenshotOptions) {
  Cypress.Commands.add(
    'compareSnapshot',
    { prevSubject: 'optional' },
    (subject, name, params = {}) => {
      const errorThreshold = thresholdOption(defaultScreenshotOptions, params);
      const screenshotOptions =
        typeof params === 'object'
          ? { ...defaultScreenshotOptions, ...params }
          : { ...defaultScreenshotOptions };

      takeScreenshot(subject, name, screenshotOptions);
      compareScreenshots(name, errorThreshold);
    }
  );
}

/* eslint-enable no-undef */

module.exports = compareSnapshotCommand;
