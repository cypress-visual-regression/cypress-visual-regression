// Load type definitions that come with Cypress module
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
import type { DiffOption, TypeOption, VisualRegressionOptions, VisualRegressionResult } from './plugin'

// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Chainable {
      // eslint-disable-next-line @typescript-eslint/method-signature-style
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
  visualRegressionType: TypeOption
  visualRegressionBaseDirectory?: string
  visualRegressionDiffDirectory?: string
  visualRegressionGenerateDiff?: DiffOption
  visualRegressionFailSilently?: boolean
}

export type TakeScreenshotProps = {
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

/** Add custom cypress command to compare image snapshots of an element or the window. */
function addCompareSnapshotCommand(screenshotOptions?: ScreenshotOptions): void {
  Cypress.Commands.add(
    'compareSnapshot',
    // @ts-expect-error todo: fix this
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
        if (commandOptions.errorThreshold !== undefined) {
          errorThreshold = commandOptions.errorThreshold
        }
      } else if (typeof commandOptions === 'number') {
        errorThreshold = commandOptions
      } else if (screenshotOptions?.errorThreshold !== undefined) {
        errorThreshold = screenshotOptions.errorThreshold
      }

      const visualRegressionOptions: VisualRegressionOptions = prepareOptions(name, errorThreshold, screenshotOptions)

      return takeScreenshot(subject, name, screenshotOptions).then((screenShotProps) => {
        console.groupCollapsed(
          `%c     Visual Regression Test (${visualRegressionOptions.screenshotName}) `,
          'color: #17EDE1; background: #091806; padding: 12px 6px; border-radius: 4px; width:100%;'
        )
        console.info('%c visualRegressionOptions:     ', 'color: #FFF615; background: #091806; padding: 6px;')
        console.table(visualRegressionOptions)
        console.info('%c Screenshot taken:     ', 'color: #FFF615; background: #091806; padding: 6px;')
        console.table(screenShotProps)
        console.groupEnd()
        visualRegressionOptions.screenshotAbsolutePath = screenShotProps.path
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
  if (Cypress.env('visualRegression') !== undefined) {
    throw new Error(
      'Environment variables under "visualRegression" object (Version 4) si deprecated, please use single keys, ie visualRegressionType, visualRegressionBaseDirectory, etc.'
    )
  }
  const options: VisualRegressionOptions = {
    type: Cypress.env('visualRegressionType'),
    screenshotName: name,
    specName: Cypress.spec.name,
    screenshotAbsolutePath: 'null', // will be set after takeScreenshot
    errorThreshold,
    baseDirectory: Cypress.env('visualRegressionBaseDirectory'),
    diffDirectory: Cypress.env('visualRegressionDiffDirectory'),
    generateDiff: Cypress.env('visualRegressionGenerateDiff'),
    failSilently: Cypress.env('visualRegressionFailSilently')
  }

  if (screenshotOptions?.failSilently !== undefined) {
    options.failSilently = screenshotOptions.failSilently
  } else if (Cypress.env('visualRegressionFailSilently') !== undefined) {
    options.failSilently = Cypress.env('visualRegressionFailSilently')
  }

  // deprecation methods
  if (Cypress.env('type') !== undefined) {
    console.error(
      "Environment variable 'type' is deprecated, please rename it to 'visualRegressionType'. Please check README.md file for latest configuration."
    )
    options.type = Cypress.env('type')
  }
  if (Cypress.env('failSilently') !== undefined) {
    console.error(
      "Environment variable 'failSilently' is deprecated, please rename it to 'visualRegressionFailSilently'. Please check README.md file for latest configuration."
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
): Cypress.Chainable<TakeScreenshotProps> {
  const objToOperateOn = subject !== undefined ? cy.get(subject) : cy
  let ScreenshotDetails: TakeScreenshotProps
  return (
    objToOperateOn
      .screenshot(name, {
        ...screenshotOptions,
        onAfterScreenshot(_el, props) {
          ScreenshotDetails = props
        }
      })
      // @ts-ignore
      .then(() => ScreenshotDetails)
  )
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(options: VisualRegressionOptions): Cypress.Chainable {
  // @ts-expect-error todo: fix this
  return cy.task('compareSnapshots', options).then((results: VisualRegressionResult) => {
    if (results.error !== undefined && !options.failSilently) {
      throw new Error(results.error)
    }
    return results
  })
}

export { addCompareSnapshotCommand }
