import { deserializeError } from 'serialize-error'
import type { CompareSnapshotsOptions, UpdateSnapshotOptions } from './plugin'

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
function takeScreenshot(subject: any, name: string, screenshotOptions: any): void {
  let objToOperateOn: any
  const subjectCheck = subject ?? ''
  if (subjectCheck !== '') {
    objToOperateOn = cy.get(subject)
  } else {
    objToOperateOn = cy
  }

  let screenshotPath: string
  // eslint-disable-next-line promise/catch-or-return
  objToOperateOn
    .screenshot(name, {
      ...screenshotOptions,
      onAfterScreenshot(_el: any, props: any) {
        screenshotPath = props.path
      }
    })
    .then(() => {
      return cy.wrap(screenshotPath).as('screenshotAbsolutePath')
    })
}

function updateBaseScreenshot(screenshotName: string): Cypress.Chainable {
  return cy.get('@screenshotAbsolutePath').then((screenshotAbsolutePath: unknown) => {
    if (typeof screenshotAbsolutePath !== 'string') {
      throw new Error('Could not resolve screenshot path')
    }
    const args: UpdateSnapshotOptions = {
      screenshotName,
      specName: Cypress.spec.name,
      screenshotAbsolutePath,
      baseDirectory: Cypress.env('visualRegression').baseDirectory
    }
    return cy.task('updateSnapshot', args)
  })
}

export type ComparisonResult = {
  error?: Error
  mismatchedPixels: number
  percentage: number
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(name: string, screenshotOptions: any): Cypress.Chainable {
  return cy.get('@screenshotAbsolutePath').then((screenshotAbsolutePath: unknown) => {
    if (typeof screenshotAbsolutePath !== 'string') {
      throw new Error('Could not resolve screenshot path')
    }
    const errorThreshold = screenshotOptions?.errorThreshold ?? 0
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

    return cy.task('compareSnapshots', options).then((results: any) => {
      if (results.error !== undefined && !failSilently) {
        throw deserializeError(results.error)
      }
      return results
    })
  })
}

/** Add custom cypress command to compare image snapshots of an element or the window. */
function addCompareSnapshotCommand(
  defaultScreenshotOptions?: Partial<Cypress.ScreenshotOptions | SnapshotOptions>
): void {
  Cypress.Commands.add(
    'compareSnapshot',
    { prevSubject: 'optional' },
    function (subject: any, name: string, params: any = {}): Cypress.Chainable {
      if (name === undefined || name === '') {
        throw new Error('name of the snapshot must be specified')
      }
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

export default addCompareSnapshotCommand
