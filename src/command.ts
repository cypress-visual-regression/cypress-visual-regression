import { deserializeError } from 'serialize-error'
import type { VisualRegressionOptions, VisualRegressionResult } from './plugin'

export type OnAfterScreenshotProps = {
  path: string
  size: number
  dimensions: {
    width: number
    height: number
  }
  multipart: boolean
  pixelRatio: number
  takenAt: string
  name: string
  blackout: string[]
  duration: number
  testAttemptIndex: number
}

export type ScreenshotOptions = Partial<Cypress.ScreenshotOptions | AdditionalScreenshotOptions>

type AdditionalScreenshotOptions = {
  errorThreshold: number
  failSilently: boolean
}

export type ComparisonResult = {
  error?: Error
  mismatchedPixels: number
  percentage: number
}

export type DiffOption = 'always' | 'fail' | 'never'

export type CypressConfigEnv = {
  visualRegression: {
    type: 'regression' | 'base'
    baseDirectory?: string
    diffDirectory?: string
    generateDiff?: DiffOption
    failSilently?: boolean
  }
}

/** Take a screenshot and move screenshot to base or actual folder */
function takeScreenshot(
  subject: string | undefined,
  name: string,
  screenshotOptions: Partial<Cypress.ScreenshotOptions | SnapshotOptions>
): Cypress.Chainable<string> {
  const objToOperateOn = subject !== undefined ? cy.get(subject) : cy

  let screenshotPath: string
  return (
    objToOperateOn
      .screenshot(name, {
        ...screenshotOptions,
        onAfterScreenshot(_el: JQuery, props: OnAfterScreenshotProps) {
          screenshotPath = props.path
        }
      })
      // @ts-ignore
      .then(() => {
        return screenshotPath
      })
  )
}

function updateBaseScreenshot(screenshotAbsolutePath: string, screenshotName: string): Cypress.Chainable {
  const args: UpdateSnapshotOptions = {
    screenshotName,
    specName: Cypress.spec.name,
    screenshotAbsolutePath,
    baseDirectory: Cypress.env('visualRegression').baseDirectory
  }
  return cy.task('updateSnapshot', args)
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(
  screenshotAbsolutePath: string,
  name: string,
  screenshotOptions: Partial<Cypress.ScreenshotOptions & SnapshotOptions>
): Cypress.Chainable {
  const errorThreshold = screenshotOptions.errorThreshold ?? 0
  const options: CompareSnapshotsOptions = {
    screenshotName: name,
    errorThreshold,
    specName: Cypress.config().spec?.name ?? '',
    screenshotAbsolutePath,
    baseDirectory: Cypress.env('visualRegression')?.baseDirectory,
    diffDirectory: Cypress.env('visualRegression')?.diffDirectory,
    generateDiff: Cypress.env('visualRegression')?.generateDiff
  }

  let failSilently = false
  if (screenshotOptions.failSilently !== undefined) {
    failSilently = screenshotOptions.failSilently
  } else if (Cypress.env('visualRegression').failSilently !== undefined) {
    failSilently = Cypress.env('visualRegression').failSilently
  }

  return cy.task('compareSnapshots', options).then((results: CompareSnapshotResult) => {
    if (results.error !== undefined && !failSilently) {
      throw deserializeError(results.error)
    }
    return results
  })
}

/** Add custom cypress command to compare image snapshots of an element or the window. */
function addCompareSnapshotCommand(defaultScreenshotOptions?: ScreenshotOptions): void {
  Cypress.Commands.add(
    'compareSnapshot',
    { prevSubject: 'optional' },
    function (
      subject: keyof HTMLElementTagNameMap | undefined,
      name: string | undefined,
      params: number | ScreenshotOptions | undefined = {}
    ): Cypress.Chainable {
      if (name === undefined || name === '') {
        throw new Error('name of the snapshot must be specified')
      }

      let screenshotOptions: ScreenshotOptions
      if (typeof params === 'object') {
        screenshotOptions = { ...defaultScreenshotOptions, ...params }
      } else if (typeof params === 'number') {
        screenshotOptions = { ...defaultScreenshotOptions, errorThreshold: params }
      } else {
        screenshotOptions = { ...defaultScreenshotOptions, errorThreshold: 0 }
      }

      const visualRegressionOptions: VisualRegressionOptions = prepareOptions(name, screenshotOptions)

      return takeScreenshot(subject, name, screenshotOptions).then((screenshotAbsolutePath: string) => {
        visualRegressionOptions.screenshotAbsolutePath = screenshotAbsolutePath
        switch (visualRegressionOptions.type) {
          case 'regression':
            return compareScreenshots(visualRegressionOptions)
          case 'base':
            return cy.task('updateSnapshot', visualRegressionOptions)
          default:
            throw new Error(
              `The "type" environment variable is unknown. \nExpected: "regression" or "base" \nActual: ${visualRegressionOptions.type}`
            )
        }
      })
    }
  )
}

function prepareOptions(name: string, screenshotOptions: ScreenshotOptions): VisualRegressionOptions {
  const options: VisualRegressionOptions = {
    type: Cypress.env('visualRegression').type as string,
    screenshotName: name,
    specName: Cypress.spec.name,
    screenshotAbsolutePath: 'null', // will be set after takeScreenshot
    errorThreshold: screenshotOptions.errorThreshold ?? 0,
    baseDirectory: Cypress.env('visualRegression')?.baseDirectory,
    diffDirectory: Cypress.env('visualRegression')?.diffDirectory,
    generateDiff: Cypress.env('visualRegression')?.generateDiff,
    failSilently: Cypress.env('visualRegression')?.failSilently
  }

  if (screenshotOptions.failSilently !== undefined) {
    options.failSilently = screenshotOptions.failSilently
  } else if (Cypress.env('visualRegression').failSilently !== undefined) {
    options.failSilently = Cypress.env('visualRegression').failSilently
  }

  // deprecation methods
  if (Cypress.env('type') !== undefined) {
    process.emitWarning(
      "Environment variable 'type' is deprecated. Please check README.md file for latest configuration."
    )
  }
  if (Cypress.env('failSilently') !== undefined) {
    process.emitWarning(
      "Environment variable 'failSilently' is deprecated. Please check README.md file for latest configuration."
    )
  }
  if (Cypress.env('SNAPSHOT_BASE_DIRECTORY') !== undefined) {
    process.emitWarning(
      "Environment variable 'SNAPSHOT_BASE_DIRECTORY' is deprecated. Please check README.md file for latest configuration."
    )
    options.baseDirectory = Cypress.env('SNAPSHOT_BASE_DIRECTORY')
  }
  if (Cypress.env('SNAPSHOT_DIFF_DIRECTORY') !== undefined) {
    process.emitWarning(
      "Environment variable 'SNAPSHOT_DIFF_DIRECTORY' is deprecated. Please check README.md file for latest configuration."
    )
    options.diffDirectory = Cypress.env('SNAPSHOT_DIFF_DIRECTORY')
  }
  if (Cypress.env('INTEGRATION_FOLDER') !== undefined) {
    process.emitWarning(
      "Environment variable 'INTEGRATION_FOLDER' is deprecated. Please check README.md file for latest configuration."
    )
  }
  if (Cypress.env('ALWAYS_GENERATE_DIFF') !== undefined) {
    process.emitWarning(
      "Environment variable 'ALWAYS_GENERATE_DIFF' is deprecated. Please check README.md file for latest configuration."
    )
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    options.generateDiff = Cypress.env('SNAPSHOT_DIFF_DIRECTORY') ? 'always' : 'never'
  }
  if (Cypress.env('ALLOW_VISUAL_REGRESSION_TO_FAIL') !== undefined) {
    process.emitWarning(
      "Environment variable 'failSilently' is deprecated. Please check README.md file for latest configuration."
    )
  }

  return options
}

/** Take a screenshot and move screenshot to base or actual folder */
function takeScreenshot(
  subject: string | undefined,
  name: string,
  screenshotOptions: ScreenshotOptions
): Cypress.Chainable<string> {
  const objToOperateOn = subject !== undefined ? cy.get(subject) : cy

  let screenshotPath: string
  return (
    objToOperateOn
      .screenshot(name, {
        ...screenshotOptions,
        onAfterScreenshot(_el: JQuery, props: OnAfterScreenshotProps) {
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
