const { deserializeError, getValueOrDefault } = require('./utils-browser');

/* eslint-disable no-undef */

/** Return the errorThreshold from the options settings */
function getErrorThreshold(defaultScreenshotOptions, params) {
  if (typeof params === 'number') {
    return params;
  }

  if (typeof params === 'object' && params.errorThreshold) {
    return params.errorThreshold;
  }

  return getValueOrDefault(defaultScreenshotOptions?.errorThreshold, 0);
}

function getSpecRelativePath() {
  const integrationFolder = getValueOrDefault(Cypress.env('INTEGRATION_FOLDER'), 'cypress/e2e');

  return Cypress.spec.relative.replace(integrationFolder, '');
}

/** Take a screenshot and move screenshot to base or actual folder */
function takeScreenshot(subject, name, screenshotOptions) {
  let screenshotPath;
  const objToOperateOn = subject ? cy.get(subject) : cy;

  // save the path to forward between screenshot and move tasks
  function onAfterScreenshot(_doc, props) {
    screenshotPath = props.path;
  }

  objToOperateOn
    .screenshot(name, {
      ...screenshotOptions,
      onAfterScreenshot,
    })
    .then(() => {
      cy.task('moveSnapshot', {
        fileName: `${name}.png`,
        fromPath: screenshotPath,
        specDirectory: getSpecRelativePath(),
      });
    });
}

function updateScreenshot(name) {
  cy.task('updateSnapshot', {
    name,
    specDirectory: getSpecRelativePath(),
    screenshotsFolder: Cypress.config().screenshotsFolder,
    snapshotBaseDirectory: Cypress.env('SNAPSHOT_BASE_DIRECTORY'),
  });
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(name, errorThreshold) {
  const options = {
    fileName: name,
    specDirectory: getSpecRelativePath(),
    baseDir: Cypress.env('SNAPSHOT_BASE_DIRECTORY'),
    diffDir: Cypress.env('SNAPSHOT_DIFF_DIRECTORY'),
    keepDiff: Cypress.env('ALWAYS_GENERATE_DIFF'),
    allowVisualRegressionToFail: Cypress.env('ALLOW_VISUAL_REGRESSION_TO_FAIL'),
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
  Cypress.Commands.add('compareSnapshot', { prevSubject: 'optional' }, (subject, name, params = {}) => {
    const type = Cypress.env('type');
    const screenshotOptions =
      typeof params === 'object' ? { ...defaultScreenshotOptions, ...params } : { ...defaultScreenshotOptions };

    takeScreenshot(subject, name, screenshotOptions);

    switch (type) {
      case 'actual':
        compareScreenshots(name, getErrorThreshold(defaultScreenshotOptions, params));

        break;

      case 'base':
        updateScreenshot(name);

        break;

      default:
        throw new Error(`The "type" environment variable is unknown. \nExpected: "actual" or "base" \nActual: ${type}`);
    }
  });
}

/* eslint-enable no-undef */

module.exports = compareSnapshotCommand;
