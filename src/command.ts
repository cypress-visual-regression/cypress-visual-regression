import { deserializeError } from 'serialize-error'
import Chainable = Cypress.Chainable;

type CompareSnapshotOptions = {
  errorThreshold: number
  failSilently: boolean
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Chainable {
      // eslint-disable-next-line @typescript-eslint/method-signature-style
      compareSnapshot(
        name: string,
        options?: number | Partial<Cypress.ScreenshotOptions | CompareSnapshotOptions>
      ): Chainable<ComparisonResults>
    }
  }
}

/** Return the errorThreshold from the options settings */
function getErrorThreshold(screenshotOptions: any): number {
  // if (typeof params === 'number') {
  //   return params
  // }
  //
  // if (typeof params === 'object') {
  //   if (typeof params.errorThreshold === 'number') {
  //     return params.errorThreshold
  //   }
  // }

  return screenshotOptions?.errorThreshold ?? 0
}

function getSpecRelativePath(): string {
  const integrationFolder = Cypress.env('INTEGRATION_FOLDER') ?? 'cypress/e2e'

  return Cypress.spec.relative.replace(integrationFolder, '')
}

/** Take a screenshot and move screenshot to base or actual folder */
function takeScreenshot(subject: any, name: string, screenshotOptions: any): void {
  let screenshotPath: string
  let objToOperateOn: any
  const subjectCheck = subject ?? ''
  if (subjectCheck !== '') {
    objToOperateOn = cy.get(subject)
  } else {
    objToOperateOn = cy
  }

  // save the path to forward between screenshot and move tasks
  function onAfterScreenshot(_doc: any, props: any): void {
    screenshotPath = props.path
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const options: any = {
    ...screenshotOptions,
    onAfterScreenshot
  }

  // eslint-disable-next-line promise/catch-or-return
  objToOperateOn.screenshot(name, options).then(() => {
    return cy.task('moveSnapshot', {
      fileName: `${name}.png`,
      fromPath: screenshotPath,
      specDirectory: getSpecRelativePath()
    })
  })
}

function updateScreenshot(name: string): Chainable<ComparisonResults> {
  return cy.task('updateSnapshot', {
    name,
    specRelativePath: getSpecRelativePath(),
    screenshotsFolder: Cypress.config().screenshotsFolder,
    snapshotBaseDirectory: Cypress.env('SNAPSHOT_BASE_DIRECTORY')
  })
}

export type ComparisonResults = {
  error?: Error
  mismatchedPixels: number
  percentage: number
  baseUpdated: boolean
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(name: string, screenshotOptions: any): Chainable<ComparisonResults> {
  const errorThreshold = getErrorThreshold(screenshotOptions)
  const options = {
    fileName: name,
    specDirectory: getSpecRelativePath(),
    baseDir: Cypress.env('SNAPSHOT_BASE_DIRECTORY'),
    diffDir: Cypress.env('SNAPSHOT_DIFF_DIRECTORY'),
    keepDiff: Cypress.env('ALWAYS_GENERATE_DIFF'),
    failSilently: screenshotOptions.failSilently || Cypress.env('failSilently'),
    errorThreshold
  }

  // eslint-disable-next-line promise/catch-or-return
  return cy.task('compareSnapshotsPlugin', options).then((results: any) => {
    if (results.error !== undefined && options.failSilently !== true) {
      throw deserializeError(results.error)
    }
    return results
  })
}

/** Add custom cypress command to compare image snapshots of an element or the window. */
export function compareSnapshotCommand(
  defaultScreenshotOptions?: Partial<Cypress.ScreenshotOptions | CompareSnapshotOptions>
): void {
  Cypress.Commands.add(
    'compareSnapshot',
    { prevSubject: 'optional' },
    (subject: any, name: string, params: any = {}): Chainable<ComparisonResults> => {
      const type = Cypress.env('type') as string
      let screenshotOptions: any
      if (typeof params === 'object') {
        screenshotOptions = { ...defaultScreenshotOptions, ...params }
      } else if (typeof params === 'number') {
        screenshotOptions = { ...defaultScreenshotOptions, errorThreshold: params }
      } else {
        screenshotOptions = { ...defaultScreenshotOptions, errorThreshold: 0 }
      }
      // const screenshotOptions =
      //   typeof params === 'object' ? { ...defaultScreenshotOptions, ...params } : { ...defaultScreenshotOptions }

      takeScreenshot(subject, name, screenshotOptions)

      switch (type) {
        case 'actual':
          return compareScreenshots(name, screenshotOptions)
        case 'base':
          return updateScreenshot(name)
        default:
          throw new Error(
            `The "type" environment variable is unknown. \nExpected: "actual" or "base" \nActual: ${type}`
          )
      }
    }
  )
}
