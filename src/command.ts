import { deserializeError } from 'serialize-error'

type CompareSnapshotOptions = {
  errorThreshold: number
}

declare global {
  namespace Cypress {
    interface Chainable {
      compareSnapshot(name: string): void
      compareSnapshot(name: string, errorThreshold?: number): void
      compareSnapshot(name: string, options?: Partial<Cypress.ScreenshotOptions | CompareSnapshotOptions>): void
    }
  }
}

/** Return the errorThreshold from the options settings */
function getErrorThreshold(defaultScreenshotOptions: any, params: any): number {
  if (typeof params === 'number') {
    return params
  }

  if (typeof params === 'object' && params.errorThreshold) {
    return params.errorThreshold
  }

  return defaultScreenshotOptions?.errorThreshold ?? 0
}

function getSpecRelativePath(): string {
  const integrationFolder = Cypress.env('INTEGRATION_FOLDER') ?? 'cypress/e2e'

  return Cypress.spec.relative.replace(integrationFolder, '')
}

/** Take a screenshot and move screenshot to base or actual folder */
function takeScreenshot(subject: any, name: string, screenshotOptions: any): void {
  let screenshotPath: string
  const objToOperateOn = subject ? cy.get(subject) : cy

  // save the path to forward between screenshot and move tasks
  function onAfterScreenshot(_doc: any, props: any): void {
    screenshotPath = props.path
  }

  objToOperateOn
    .screenshot(name, {
      ...screenshotOptions,
      onAfterScreenshot
    })
    .then(() => {
      cy.task('moveSnapshot', {
        fileName: `${name}.png`,
        fromPath: screenshotPath,
        specDirectory: getSpecRelativePath()
      })
    })
}

function updateScreenshot(name: string): void {
  cy.task('updateSnapshot', {
    name,
    specDirectory: getSpecRelativePath(),
    screenshotsFolder: Cypress.config().screenshotsFolder,
    snapshotBaseDirectory: Cypress.env('SNAPSHOT_BASE_DIRECTORY')
  })
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(name: string, errorThreshold: number): void {
  const options = {
    fileName: name,
    specDirectory: getSpecRelativePath(),
    baseDir: Cypress.env('SNAPSHOT_BASE_DIRECTORY'),
    diffDir: Cypress.env('SNAPSHOT_DIFF_DIRECTORY'),
    keepDiff: Cypress.env('ALWAYS_GENERATE_DIFF'),
    allowVisualRegressionToFail: Cypress.env('ALLOW_VISUAL_REGRESSION_TO_FAIL'),
    errorThreshold
  }

  cy.task('compareSnapshotsPlugin', options).then((results: any) => {
    if ('error' in results) {
      throw deserializeError(results.error)
    }
  })
}

/** Add custom cypress command to compare image snapshots of an element or the window. */
export function compareSnapshotCommand(
  defaultScreenshotOptions?: Partial<Cypress.ScreenshotOptions | CompareSnapshotOptions>
): void {
  Cypress.Commands.add(
    'compareSnapshot',
    { prevSubject: 'optional' },
    (subject: any, name: string, params: any = {}): void => {
      const type = Cypress.env('type')
      const screenshotOptions =
        typeof params === 'object' ? { ...defaultScreenshotOptions, ...params } : { ...defaultScreenshotOptions }

      takeScreenshot(subject, name, screenshotOptions)

      switch (type) {
        case 'actual':
          compareScreenshots(name, getErrorThreshold(defaultScreenshotOptions, params))

          break

        case 'base':
          updateScreenshot(name)

          break

        default:
          throw new Error(
            `The "type" environment variable is unknown. \nExpected: "actual" or "base" \nActual: ${type}`
          )
      }
    }
  )
}

// Re-export as module.exports for compatibility with CommonJS.
// This will allow you to require this module using require()
module.exports = compareSnapshotCommand
