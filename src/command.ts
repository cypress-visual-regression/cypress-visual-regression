import { deserializeError } from 'serialize-error'
import Chainable = Cypress.Chainable
import { type CompareSnapshotsPluginArgs, type UpdateSnapshotArgs } from './plugin'

type CompareSnapshotOptions = {
  errorThreshold: number
  failSilently: boolean
}
// todo: IMHO, all the declarations should be in a separate file
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Chainable {
      // eslint-disable-next-line @typescript-eslint/method-signature-style
      compareSnapshot(
        name: string,
        options?: number | Partial<Cypress.ScreenshotOptions | CompareSnapshotOptions>
      ): Chainable<ComparisonResult> | Chainable<UpdateBaseResult>
    }
  }
}

/** Return the errorThreshold from the options settings */
function getErrorThreshold(screenshotOptions: any): number {
  return screenshotOptions?.errorThreshold ?? 0
}

/** Take a screenshot and move screenshot to base or actual folder */
function takeScreenshot(subject: any, name: string, screenshotOptions: any): void {
  let objToOperateOn: any
  const subjectCheck = subject ?? ''
  if (subjectCheck !== '') {
    objToOperateOn = cy.get(subject)
  } else {
    objToOperateOn = cy
  }

  // eslint-disable-next-line promise/catch-or-return
  objToOperateOn.screenshot(name, screenshotOptions).then(() => {
    return null
  })
}

function updateBaseScreenshot(screenshotName: string): Chainable<UpdateBaseResult> {
  const args: UpdateSnapshotArgs = {
    screenshotName,
    specRelativePath: Cypress.spec.relative,
    specFolder: Cypress.env('visualRegression').specFolder,
    screenshotsFolder: Cypress.config().screenshotsFolder as string,
    snapshotBaseDirectory: Cypress.env('visualRegression').baseDirectory
  }
  return cy.task('updateSnapshot', args)
}

export type ComparisonResult = {
  error?: Error
  mismatchedPixels: number
  percentage: number
}

export type UpdateBaseResult = {
  baseUpdated: boolean
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(name: string, screenshotOptions: any): Chainable<ComparisonResult> {
  const errorThreshold = getErrorThreshold(screenshotOptions)
  const options: CompareSnapshotsPluginArgs = {
    fileName: name,
    errorThreshold,
    specRelativePath: Cypress.config().spec?.relative ?? '',
    specFolder: Cypress.env('visualRegression').specFolder,
    baseDirectory: Cypress.env('visualRegression').baseDirectory,
    diffDirectory: Cypress.env('visualRegression').diffDirectory,
    generateDiff: Cypress.env('visualRegression').generateDiff,
    failSilently: false
  }

  if (screenshotOptions.failSilently !== null) {
    options.failSilently = screenshotOptions.failSilently
  } else if (Cypress.env('failSilently') !== null) {
    options.failSilently = Cypress.env('failSilently')
  }

  // eslint-disable-next-line promise/catch-or-return
  return cy.task('compareSnapshotsPlugin', options).then((results: any) => {
    if (results.error !== undefined && options.failSilently === false) {
      throw deserializeError(results.error)
    }
    return results
  })
}

/** Add custom cypress command to compare image snapshots of an element or the window. */
export function compareSnapshotCommand(
  defaultScreenshotOptions?: Partial<Cypress.ScreenshotOptions | CompareSnapshotOptions>
): void {
  console.log(Cypress.env())
  Cypress.Commands.add(
    'compareSnapshot',
    { prevSubject: 'optional' },
    (subject: any, name: string, params: any = {}): Chainable<ComparisonResult> | Chainable<UpdateBaseResult> => {
      const type = Cypress.env('visualRegression').type as string
      let screenshotOptions: any
      if (typeof params === 'object') {
        screenshotOptions = { ...defaultScreenshotOptions, ...params }
      } else if (typeof params === 'number') {
        screenshotOptions = { ...defaultScreenshotOptions, errorThreshold: params }
      } else {
        screenshotOptions = { ...defaultScreenshotOptions, errorThreshold: 0 }
      }

      takeScreenshot(subject, name, screenshotOptions)

      switch (type) {
        case 'regression':
          return compareScreenshots(name, screenshotOptions)
        case 'base':
          return updateBaseScreenshot(name)
        default:
          throw new Error(
            `The "type" environment variable is unknown. \nExpected: "regression" or "base" \nActual: ${type}`
          )
      }
    }
  )
}
