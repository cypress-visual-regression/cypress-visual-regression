// Load type definitions that come with Cypress module
import type {
  DiffOption,
  TypeOption,
  VisualRegressionOptions,
  VisualRegressionResult,
  PluginCommandOptions,
  VisualRegressionImages,
  PluginOptions
} from './plugin'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Chainable {
      /**
       * Take a screenshot and trigger a visual regression check
       * If visualRegressionType is set to 'base', create a base screenshot, no comparison takes place
       * If visualRegressionType is set to 'regression', compare base and current screenshots
       *
       * @param name - name of the screenshot file
       * @param commandOptions - additional screenshot and plugin options to control the visual regression behavior
       */
      // eslint-disable-next-line @typescript-eslint/method-signature-style
      compareSnapshot(name: string, commandOptions?: PluginCommandOptions): Chainable<VisualRegressionResult>
    }
  }
}

export type CypressConfigEnv = {
  visualRegressionType: TypeOption
  visualRegressionBaseDirectory?: string
  visualRegressionDiffDirectory?: string
  visualRegressionGenerateDiff?: DiffOption
  visualRegressionFailSilently?: boolean
  visualRegressionUpdateSnapshots?: boolean
}

/** Add custom cypress command to compare image snapshots of an element or the window. */
function addCompareSnapshotCommand(screenshotOptions?: Partial<Cypress.ScreenshotOptions & PluginOptions>): void {
  Cypress.Commands.add(
    'compareSnapshot',
    { prevSubject: ['optional', 'element'] },
    function (
      subject: Cypress.JQueryWithSelector | void,
      name: string,
      commandOptions?: PluginCommandOptions
    ): Cypress.Chainable {
      if (name === undefined || name === '') {
        throw new Error('Snapshot name must be specified')
      }

      // if screenshotOptions are undefined, this will evaluate to empty object: {}
      const screenshotOptionsObject = { ...screenshotOptions }

      // if commandOptions are undefined, this will evaluate to empty object: {}
      const commandOptionsObject =
        typeof commandOptions === 'number' ? { errorThreshold: commandOptions } : { ...commandOptions }

      const visualRegressionOptions = prepareOptions(name, screenshotOptionsObject, commandOptionsObject)
      // We need to add the folder structure, so we can have as many levels as we want
      // https://github.com/cypress-visual-regression/cypress-visual-regression/issues/225
      const folderAndName = `${Cypress.spec.relative}/${name}`
      return takeScreenshot(subject, folderAndName, visualRegressionOptions.screenshotOptions).then(
        (screenshotPath) => {
          // Screenshot already taken
          visualRegressionOptions.screenshotAbsolutePath = screenshotPath
          visualRegressionOptions.spec = Cypress.spec
          switch (visualRegressionOptions.type) {
            case 'regression':
              return compareScreenshots(subject, visualRegressionOptions)
            case 'base':
              return updateSnapshots(subject, visualRegressionOptions)
            default:
              throw new Error(
                `The 'type' environment variable is invalid. Expected: 'regression' or 'base' instead of '${visualRegressionOptions.type}'`
              )
          }
        }
      )
    }
  )
}

function prepareOptions(
  name: string,
  screenshotOptions: Partial<Cypress.ScreenshotOptions & PluginOptions>,
  commandOptions: Partial<Cypress.ScreenshotOptions & PluginOptions>
): VisualRegressionOptions {
  // if type is not set, throw error immediately
  if (Cypress.env('visualRegressionType') === undefined) {
    throw new Error("The 'type' environment variable is missing. Expected values: 'regression' or 'base'")
  }

  // follow Cypress priority order https://docs.cypress.io/guides/references/configuration#Resolved-Configuration
  // firstly, set default values
  const defaultCommandOptions = {
    errorThreshold: 0,
    failSilently: false,
    pixelmatchOptions: { threshold: 0.1 }
  }

  const options: VisualRegressionOptions = {
    type: Cypress.env('visualRegressionType'),
    screenshotName: name,
    screenshotAbsolutePath: 'null', // will be set after takeScreenshot
    pluginOptions: defaultCommandOptions,
    screenshotOptions: {},
    baseDirectory: 'cypress/snapshots/base',
    diffDirectory: 'cypress/snapshots/diff',
    generateDiff: 'fail',
    updateSnapshots: false,
    spec: Cypress.spec
  }

  // secondly, override values provided in e2e support file
  if (screenshotOptions.pixelmatchOptions !== undefined) {
    options.pluginOptions.pixelmatchOptions = screenshotOptions.pixelmatchOptions
  }
  if (screenshotOptions.errorThreshold !== undefined) {
    options.pluginOptions.errorThreshold = screenshotOptions.errorThreshold
  }
  if (screenshotOptions.failSilently !== undefined) {
    options.pluginOptions.failSilently = screenshotOptions.failSilently
  }
  // TODO refactor this in next release, separate plugin vs screenshot properties
  options.screenshotOptions = { ...screenshotOptions, ...commandOptions }

  // thirdly, override values provided through environment variables
  if (Cypress.env('visualRegressionBaseDirectory') !== undefined) {
    options.baseDirectory = Cypress.env('visualRegressionBaseDirectory')
  }
  if (Cypress.env('visualRegressionDiffDirectory') !== undefined) {
    options.diffDirectory = Cypress.env('visualRegressionDiffDirectory')
  }
  if (Cypress.env('visualRegressionGenerateDiff') !== undefined) {
    options.generateDiff = Cypress.env('visualRegressionGenerateDiff')
  }
  if (Cypress.env('visualRegressionFailSilently') !== undefined) {
    options.pluginOptions.failSilently = Cypress.env('visualRegressionFailSilently')
  }
  if (Cypress.env('visualRegressionUpdateSnapshots') !== undefined) {
    const envValue = Cypress.env('visualRegressionUpdateSnapshots')
    options.updateSnapshots = envValue === true || envValue === 'true' || envValue === 1 || envValue === '1'
  }

  // lastly, override values provided through compareSnapshot command
  if (commandOptions.failSilently !== undefined) {
    options.pluginOptions.failSilently = commandOptions.failSilently
  }
  if (commandOptions.errorThreshold !== undefined) {
    options.pluginOptions.errorThreshold = commandOptions.errorThreshold
  }
  if (commandOptions.pixelmatchOptions !== undefined) {
    options.pluginOptions.pixelmatchOptions = commandOptions.pixelmatchOptions
  }
  return options
}

/** Take a screenshot and move screenshot to base or actual folder */
function takeScreenshot(
  subject: Cypress.JQueryWithSelector | void,
  name: string,
  screenshotOptions: Partial<Cypress.ScreenshotOptions>
): Cypress.Chainable {
  const objToOperateOn = subject !== undefined ? cy.get(subject as unknown as string) : cy
  let screenshotDetails: string
  return (
    objToOperateOn
      .screenshot(name, {
        ...screenshotOptions,
        log: false,
        onAfterScreenshot(_el, props) {
          screenshotDetails = props.path
          screenshotOptions?.onAfterScreenshot?.(_el, props)
        }
      })
      // @ts-expect-error TODO fix
      .then(() => screenshotDetails)
  )
}

/** Call the plugin to compare snapshot images and generate a diff */
function compareScreenshots(
  subject: Cypress.JQueryWithSelector | void,
  options: VisualRegressionOptions
): Cypress.Chainable<VisualRegressionResult> {
  const retryAttempt = Cypress.currentRetry
  const compareSnapshotsOptions = { retryAttempt, ...options }
  return cy.task<VisualRegressionResult>('compareSnapshots', compareSnapshotsOptions, { log: false }).then((result) => {
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
    } else if (options.screenshotOptions?.capture !== undefined) {
      log.set('message', `captureMode: ${options.screenshotOptions.capture}`)
    }
    if (result.error !== undefined && !options.pluginOptions.failSilently) {
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
  subject: Cypress.JQueryWithSelector | void,
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
      <h2>Visual Regression Plugin - screenshot difference inspection</h2>
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
