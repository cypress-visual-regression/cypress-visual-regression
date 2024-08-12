// Load type definitions that come with Cypress module
import type {
  DiffOption,
  TypeOption,
  VisualRegressionOptions,
  VisualRegressionResult,
  ScreenshotOptions,
  PluginCommandOptions,
  VisualRegressionImages
} from './plugin'
import JQueryWithSelector = Cypress.JQueryWithSelector

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
    { prevSubject: ['optional', 'element'] },
    function (
      subject: JQueryWithSelector<HTMLElement> | void,
      name: string,
      commandOptions?: PluginCommandOptions
    ): Cypress.Chainable {
      if (name === undefined || name === '') {
        throw new Error('Snapshot name must be specified')
      }
      let errorThreshold = 0
      // prepare screenshot options
      if (screenshotOptions?.errorThreshold !== undefined) {
        errorThreshold = screenshotOptions?.errorThreshold
      }
      let regressionOptions: ScreenshotOptions
      if (typeof commandOptions === 'object') {
        regressionOptions = { ...screenshotOptions, ...commandOptions }
        if (commandOptions.errorThreshold !== undefined) {
          errorThreshold = commandOptions.errorThreshold
        }
      } else {
        regressionOptions = { ...screenshotOptions }
        if (commandOptions !== undefined) {
          errorThreshold = commandOptions
        }
      }

      const visualRegressionOptions: VisualRegressionOptions = prepareOptions(name, errorThreshold, regressionOptions)
      // We need to add the folder structure, so we can have as many levels as we want
      // https://github.com/cypress-visual-regression/cypress-visual-regression/issues/225
      const folderAndName = `${Cypress.spec.relative}/${name}`
      return takeScreenshot(subject, folderAndName, regressionOptions).then((screenShotProps) => {
        // Screenshot already taken
        visualRegressionOptions.screenshotAbsolutePath = screenShotProps.path
        visualRegressionOptions.spec = Cypress.spec
        switch (visualRegressionOptions.type) {
          case 'regression':
            return compareScreenshots(subject, visualRegressionOptions)
          case 'base':
            return updateSnapshots(subject, visualRegressionOptions)
          default:
            throw new Error(
              `The 'type' environment variable is unknown. Expected: 'regression' or 'base' instead of '${
                visualRegressionOptions.type as string
              }'`
            )
        }
      })
    }
  )
}

function prepareOptions(
  name: string,
  errorThreshold: number,
  screenshotOptions: ScreenshotOptions
): VisualRegressionOptions {
  if (Cypress.env('visualRegression') !== undefined) {
    throw new Error(
      'Environment variables under "visualRegression" object (Version 4) is deprecated, please use single keys, i.e. visualRegressionType, visualRegressionBaseDirectory, etc.'
    )
  }
  const options: VisualRegressionOptions = {
    type: Cypress.env('visualRegressionType'),
    screenshotName: name,
    specName: Cypress.spec.name,
    screenshotAbsolutePath: 'null', // will be set after takeScreenshot
    screenshotOptions,
    errorThreshold,
    baseDirectory: Cypress.env('visualRegressionBaseDirectory'),
    diffDirectory: Cypress.env('visualRegressionDiffDirectory'),
    generateDiff: Cypress.env('visualRegressionGenerateDiff'),
    failSilently: Cypress.env('visualRegressionFailSilently'),
    spec: Cypress.spec
  }

  if (screenshotOptions?.failSilently !== undefined) {
    options.failSilently = screenshotOptions.failSilently
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
    options.failSilently = Cypress.env('failSilently')
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
  subject: JQueryWithSelector<HTMLElement> | void,
  name: string,
  screenshotOptions?: ScreenshotOptions
): Cypress.Chainable<TakeScreenshotProps> {
  const objToOperateOn = subject !== undefined ? cy.get(subject as unknown as string) : cy
  let screenshotDetails: TakeScreenshotProps
  return (
    objToOperateOn
      .screenshot(name, {
        ...screenshotOptions,
        log: false,
        onAfterScreenshot(_el, props) {
          screenshotDetails = props
          screenshotOptions?.onAfterScreenshot?.(_el, props)
        }
      })
      // @ts-expect-error TODO fix
      .then(() => screenshotDetails)
  )
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(
  subject: JQueryWithSelector<HTMLElement> | void,
  options: VisualRegressionOptions
): Cypress.Chainable<VisualRegressionResult> {
  return cy.task<VisualRegressionResult>('compareSnapshots', options, { log: false }).then((result) => {
    const log = Cypress.log({
      type: 'parent',
      name: 'compareScreenshots',
      displayName: 'compareScreenshots',
      message: "captureMode: 'fullPage'",
      consoleProps: () => {
        return {
          Options: options,
          Result: result
        }
      }
    })
    if (subject != null) {
      log.set('$el', subject)
      log.set('message', subject.selector)
      log.set('type', 'child')
    } else if (options.screenshotOptions.capture !== undefined) {
      log.set('message', `captureMode: ${options.screenshotOptions.capture}`)
    }
    if (result.error !== undefined && !options.failSilently) {
      if (result.error.includes('image is different') && top !== null) {
        const random = Math.random()
        result.error += ` - [Show Difference](#visualRegressionPopup${random})`
        Cypress.$(top.document.body).on('click', `a[href^="#visualRegressionPopup${random}"]`, (e) => {
          e.preventDefault()
          if (top === null) {
            throw Error('Cypress runner not properly initialized')
          }
          Cypress.$(getVisual(result.images)).appendTo(top.document.body)
          if (result.images.diff === undefined) {
            Cypress.$('#diffContainer', top.document.body).remove()
          }

          const popup = Cypress.$('#visualRegressionPopup', top.document.body)
          popup.on('click', 'button[data-type="close"]', () => {
            popup.remove()
          })
          popup.on('click', function (e) {
            if (e.target === this) {
              popup.remove()
            }
          })

          return false
        })
      }
      throw constructCypressError(log, new Error(result.error))
    }
    return result
  })
}

/** Call the plugin to update base snapshot images */
function updateSnapshots(
  subject: JQueryWithSelector<HTMLElement> | void,
  options: VisualRegressionOptions
): Cypress.Chainable<VisualRegressionResult> {
  return cy.task<VisualRegressionResult>('updateSnapshot', options, { log: false }).then((result) => {
    const log = Cypress.log({
      type: 'parent',
      name: 'compareScreenshots',
      displayName: 'compareScreenshots',
      message: 'base generation',
      consoleProps: () => {
        return {
          Options: options,
          Result: result
        }
      }
    })
    if (subject != null) {
      log.set('$el', subject)
      log.set('type', 'child')
    }
    return result
  })
}

const constructCypressError = (log: Cypress.Log, err: Error): unknown => {
  // only way to throw & log the message properly in Cypress
  // https://github.com/cypress-io/cypress/blob/5f94cad3cb4126e0567290b957050c33e3a78e3c/packages/driver/src/cypress/error_utils.ts#L214-L216
  ;(err as unknown as { onFail: (e: Error) => void }).onFail = (err: Error) => log.error(err)
  return err
}

function getVisual(images: VisualRegressionImages): string {
  return `
<div id="visualRegressionPopup" style="position:fixed;z-index:10;top:0;bottom:0;left:0;right:0;display:flex;flex-flow:column;backdrop-filter:blur(5px)">
  <div class="runner" style="position:fixed;top:100px;bottom:100px;left:100px;right:100px;display:flex;flex-flow:column">
    <header style="position:static">
    <nav style="display:flex;width:100%;align-items:center;justify-content:space-between;padding:10px 15px;">
      <h2>Vusual Regression Plugin - screenshot difference inspection</h2>
      <form style="display:flex;align-items:center;gap:5px;text-align:right">
        <button style="background-color:white;color:rgb(73 86 227);border-radius:4px" type="button" data-type="close"><i class="fa fa-times"></i> Close</button>
      <form>
    </nav>
    </header>
    <div style="padding:15px;overflow:auto">
      <div style="display:flex;justify-content:space-evenly;align-items:flex-start;gap:15px">
        <div id="imageContainer"
          style="position:relative;background:#fff;border:solid 15px #fff"
        >
          <img alt="Actual image" style="min-width:300px;width:100%;" src="data:image/png;base64,${images.actual}" />
          <img id="baseImage" alt="Base image" style="position:absolute;top:0;left:0;min-width:300px;width:100%" src="data:image/png;base64,${images.base}" />
          <div id="redLine" style="position: absolute; top: 0; height: 100%; width: 2px; background-color: red; display: none;"></div>
        </div>
        <div id="diffContainer" style="background:#fff;border:solid 15px #fff">
          <img alt="Diff image" style="min-width:300px;width:100%" src="data:image/png;base64,${images.diff}" />
        </div>
      </div>
    </div>
  </div>
</div>
<script>
  document.getElementById('imageContainer').addEventListener('mousemove', (e) => {
    const containerRect = document.getElementById('imageContainer').getBoundingClientRect()
    const mouseX = e.clientX - containerRect.left
    const width = containerRect.width

    // Calculate the percentage position of the mouse relative to the container
    const percentage = (mouseX / width) * 100

    // Update the clip-path to show part of the second image based on the mouse position
    document.getElementById('baseImage').style.clipPath = \`inset(0 \${100 - percentage}% 0 0)\`
    
    // Update the red line
    document.getElementById('redLine').style.left = \`\${mouseX}px\`
    document.getElementById('redLine').style.display = 'block'
  })
</script>
`
}

export { addCompareSnapshotCommand }
