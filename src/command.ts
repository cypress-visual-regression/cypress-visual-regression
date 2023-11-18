import { deserializeError } from 'serialize-error'
import type { DiffOption, TypeOption, VisualRegressionOptions, VisualRegressionResult } from './plugin'

/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/method-signature-style */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      compareSnapshot(name: string, options?: PluginCommandOptions): Chainable<VisualRegressionResult>
    }
  }
}

export type ScreenshotOptions = Partial<Cypress.ScreenshotOptions & PluginSetupOptions>

export type PluginCommandOptions = number | ScreenshotOptions

export type PluginSetupOptions = {
  errorThreshold: number
  failSilently: boolean
}

export type CypressConfigEnv = {
  visualRegression: {
    type: TypeOption
    baseDirectory?: string
    diffDirectory?: string
    generateDiff?: DiffOption
    failSilently?: boolean
  }
}

/** Add custom cypress command to compare image snapshots of an element or the window. */
function addCompareSnapshotCommand(screenshotOptions?: ScreenshotOptions): void {
  Cypress.Commands.add(
    'compareSnapshot',
    { prevSubject: 'optional' },
    function (
      subject: keyof HTMLElementTagNameMap,
      name: string,
      commandOptions: PluginCommandOptions
    ): Cypress.Chainable {
      if (name === undefined || name === '') {
        throw new Error('Snapshot name must be specified')
      }
      // prepare screenshot options
      let errorThreshold = 0
      if (typeof commandOptions === 'object') {
        screenshotOptions = { ...screenshotOptions, ...commandOptions }
      }
      if (typeof commandOptions === 'number') {
        errorThreshold = commandOptions
      }
      const visualRegressionOptions: VisualRegressionOptions = prepareOptions(name, errorThreshold, screenshotOptions)
      return takeScreenshot(subject, name, screenshotOptions).then((screenshotAbsolutePath: string) => {
        visualRegressionOptions.screenshotAbsolutePath = screenshotAbsolutePath
        switch (visualRegressionOptions.type) {
          case 'regression':
            return compareScreenshots(visualRegressionOptions)
          case 'base':
            return cy.task('updateSnapshot', visualRegressionOptions)
          default:
            throw new Error(
              `The "type" environment variable is unknown.
              Expected: "regression" or "base"
              Actual: ${visualRegressionOptions.type as string}`
            )
        }
      })
    }
  )
}

function prepareOptions(
  name: string,
  errorThreshold: number,
  screenshotOptions?: ScreenshotOptions
): VisualRegressionOptions {
  const options: VisualRegressionOptions = {
    type: Cypress.env('visualRegression').type as TypeOption,
    screenshotName: name,
    specName: Cypress.spec.name,
    screenshotAbsolutePath: 'null', // will be set after takeScreenshot
    errorThreshold,
    baseDirectory: Cypress.env('visualRegression')?.baseDirectory,
    diffDirectory: Cypress.env('visualRegression')?.diffDirectory,
    generateDiff: Cypress.env('visualRegression')?.generateDiff,
    failSilently: Cypress.env('visualRegression')?.failSilently
  }

  if (screenshotOptions?.failSilently !== undefined) {
    options.failSilently = screenshotOptions.failSilently
  } else if (Cypress.env('visualRegression').failSilently !== undefined) {
    options.failSilently = Cypress.env('visualRegression').failSilently
  }

  // deprecation methods
  if (Cypress.env('type') !== undefined) {
    console.error("Environment variable 'type' is deprecated. Please check README.md file for latest configuration.")
    options.type = Cypress.env('type')
  }
  if (Cypress.env('failSilently') !== undefined) {
    console.error(
      "Environment variable 'failSilently' is deprecated. Please check README.md file for latest configuration."
    )
  }
  if (Cypress.env('SNAPSHOT_BASE_DIRECTORY') !== undefined) {
    console.error(
      "Environment variable 'SNAPSHOT_BASE_DIRECTORY' is deprecated. Please check README.md file for latest configuration."
    )
    options.baseDirectory = Cypress.env('SNAPSHOT_BASE_DIRECTORY')
  }
  if (Cypress.env('SNAPSHOT_DIFF_DIRECTORY') !== undefined) {
    console.error(
      "Environment variable 'SNAPSHOT_DIFF_DIRECTORY' is deprecated. Please check README.md file for latest configuration."
    )
    options.diffDirectory = Cypress.env('SNAPSHOT_DIFF_DIRECTORY')
  }
  if (Cypress.env('INTEGRATION_FOLDER') !== undefined) {
    console.error(
      "Environment variable 'INTEGRATION_FOLDER' is deprecated. Please check README.md file for latest configuration."
    )
  }
  if (Cypress.env('ALWAYS_GENERATE_DIFF') !== undefined) {
    console.error(
      "Environment variable 'ALWAYS_GENERATE_DIFF' is deprecated. Please check README.md file for latest configuration."
    )
    options.generateDiff = Cypress.env('ALWAYS_GENERATE_DIFF') !== '' ? 'always' : 'never'
  }
  if (Cypress.env('ALLOW_VISUAL_REGRESSION_TO_FAIL') !== undefined) {
    console.error(
      "Environment variable 'ALLOW_VISUAL_REGRESSION_TO_FAIL' is deprecated. Please check README.md file for latest configuration."
    )
    options.failSilently = Cypress.env('ALLOW_VISUAL_REGRESSION_TO_FAIL')
  }

  return options
}

/** Take a screenshot and move screenshot to base or actual folder */
function takeScreenshot(
  subject: string | undefined,
  name: string,
  screenshotOptions?: ScreenshotOptions
): Cypress.Chainable<string> {
  const objToOperateOn = subject !== undefined ? cy.get(subject) : cy
  let screenshotPath: string
  return (
    objToOperateOn
      .screenshot(name, {
        ...screenshotOptions,
        onAfterScreenshot(_el, props) {
          screenshotPath = props.path
        }
      })
      // @ts-ignore
      .then(() => {
        return screenshotPath
      })
  )
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(options: VisualRegressionOptions): Cypress.Chainable {
  return cy.task('compareSnapshots', options).then((results: VisualRegressionResult) => {
    if (results.error !== undefined && !options.failSilently) {
      throw deserializeError(results.error)
    }
    return results
  })
}

export default addCompareSnapshotCommand
