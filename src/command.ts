import { deserializeError } from 'serialize-error'
import type { CompareSnapshotsOptions, UpdateSnapshotOptions, CompareSnapshotResult } from './plugin'

type OnAfterScreenshotProps = {
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

type SnapshotOptions = {
  errorThreshold: number
  failSilently: boolean
}

// TODO: improve types and move to a *.d.ts file
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Chainable {
      // eslint-disable-next-line @typescript-eslint/method-signature-style
      compareSnapshot(
        name: string,
        options?: number | Partial<Cypress.ScreenshotOptions | SnapshotOptions>
      ): Cypress.Chainable<ComparisonResult> | Cypress.Chainable<boolean>
    }
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

export type ComparisonResult = {
  error?: Error
  mismatchedPixels: number
  percentage: number
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
    baseDirectory: Cypress.env('visualRegression').baseDirectory,
    diffDirectory: Cypress.env('visualRegression').diffDirectory,
    generateDiff: Cypress.env('visualRegression').generateDiff
  }

  let failSilently = false
  if (screenshotOptions.failSilently !== undefined) {
    failSilently = screenshotOptions.failSilently
  } else if (Cypress.env('visualRegression').failSilently !== undefined) {
    failSilently = Cypress.env('visualRegression').failSilently
  }

  // @ts-expect-error TODO
  return cy.task('compareSnapshots', options).then((results: CompareSnapshotResult) => {
    if (results.error !== undefined && !failSilently) {
      throw deserializeError(results.error)
    }
    return results
  })
}

/** Add custom cypress command to compare image snapshots of an element or the window. */
function addCompareSnapshotCommand(
  defaultScreenshotOptions?: Partial<Cypress.ScreenshotOptions | SnapshotOptions>
): void {
  Cypress.Commands.add(
    'compareSnapshot',
    // @ts-expect-error - TODO: it doesn't look that prevSubject can be 'optional
    { prevSubject: 'optional' },
    function (
      subject: keyof HTMLElementTagNameMap | undefined,
      name: string | undefined,
      params: number | Partial<Cypress.ScreenshotOptions | SnapshotOptions> | undefined = {}
    ): Cypress.Chainable {
      if (name === undefined || name === '') {
        throw new Error('name of the snapshot must be specified')
      }
      const type = Cypress.env('visualRegression').type as string
      let screenshotOptions: Partial<Cypress.ScreenshotOptions | SnapshotOptions>
      if (typeof params === 'object') {
        screenshotOptions = { ...defaultScreenshotOptions, ...params }
      } else if (typeof params === 'number') {
        screenshotOptions = { ...defaultScreenshotOptions, errorThreshold: params }
      } else {
        screenshotOptions = { ...defaultScreenshotOptions, errorThreshold: 0 }
      }
      return takeScreenshot(subject, name, screenshotOptions).then((screenshotAbsolutePath: string) => {
        switch (type) {
          case 'regression':
            return compareScreenshots(screenshotAbsolutePath, name, screenshotOptions)
          case 'base':
            return updateBaseScreenshot(screenshotAbsolutePath, name)
          default:
            throw new Error(
              `The "type" environment variable is unknown. \nExpected: "regression" or "base" \nActual: ${type}`
            )
        }
      })
    }
  )
}

export default addCompareSnapshotCommand
