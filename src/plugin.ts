import { createWriteStream, promises as fs } from 'fs'
import path from 'path'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import sanitize from 'sanitize-filename'
import { serializeError, type ErrorObject } from 'serialize-error'

import { createFolder } from './utils/fs'
import { adjustCanvas, parseImage } from './utils/image'
import { Logger } from './logger'

const log = Logger('plugin')

let CYPRESS_SCREENSHOT_DIR = 'cypress/screenshots' // TODO wth

export type UpdateSnapshotArgs = {
  screenshotName: string
  specRelativePath: string
  integrationFolder: string
  screenshotsFolder: string
  snapshotBaseDirectory: string
}

function getSpecTrimmedPath(relativePath: string, integrationFolder: string): string {
  integrationFolder = integrationFolder ?? path.join('cypress', 'e2e')
  return relativePath.replace(integrationFolder, '')
}

/** Update the base snapshot .png by copying the generated snapshot to the base snapshot directory.
 * The target path is constructed from parts at runtime in node to be OS independent.  */
const updateSnapshot = async (args: UpdateSnapshotArgs): Promise<boolean> => {
  const specTrimmedPath = getSpecTrimmedPath(args.specRelativePath, args.integrationFolder)
  const toDir = args.snapshotBaseDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'base')
  const snapshotActualDirectory = args.screenshotsFolder ?? path.join('cypress', 'screenshots')
  const destDir = path.join(toDir, specTrimmedPath)

  const fromPath = path.join(snapshotActualDirectory, specTrimmedPath, `${args.screenshotName}.png`)
  const destFile = path.join(destDir, `${args.screenshotName}.png`)

  await createFolder(destDir, false)
  await fs.copyFile(fromPath, destFile)
  log(`Updated base snapshot '${args.screenshotName}' at ${destFile}`)
  return true
}

export type CompareSnapshotsPluginArgs = {
  failSilently?: boolean
  baseDir?: string
  diffDir?: string
  keepDiff?: boolean
  allowVisualRegressionToFail?: boolean
  fileName: string
  errorThreshold: number
  specRelativePath: string
  integrationFolder: string
}

type CompareSnapshotResult = {
  error?: ErrorObject
  mismatchedPixels?: number
  percentage?: number
}

/** Cypress plugin to compare image snapshots & generate a diff image.
 *
 * Uses the pixelmatch library internally.
 */
const compareSnapshotsPlugin = async (args: CompareSnapshotsPluginArgs): Promise<CompareSnapshotResult> => {
  const specTrimmedPath = getSpecTrimmedPath(args.specRelativePath, args.integrationFolder)
  const snapshotBaseDirectory = args.baseDir ?? path.join(process.cwd(), 'cypress', 'snapshots', 'base')
  const snapshotDiffDirectory = args.diffDir ?? path.join(process.cwd(), 'cypress', 'snapshots', 'diff')
  const alwaysGenerateDiff = args.keepDiff
  const allowVisualRegressionToFail = args.allowVisualRegressionToFail

  const fileName = sanitize(args.fileName)

  const options = {
    actualImage: path.join(CYPRESS_SCREENSHOT_DIR, specTrimmedPath, `${fileName}.png`),
    expectedImage: path.join(snapshotBaseDirectory, specTrimmedPath, `${fileName}.png`),
    diffImage: path.join(snapshotDiffDirectory, args.specRelativePath, `${fileName}.png`)
  }

  let mismatchedPixels = 0
  let percentage = 0
  try {
    await createFolder(snapshotDiffDirectory, args.failSilently)
    const [imgExpected, imgActual] = await Promise.all([
      parseImage(options.expectedImage),
      parseImage(options.actualImage)
    ])
    const diff = new PNG({
      width: Math.max(imgActual.width, imgExpected.width),
      height: Math.max(imgActual.height, imgExpected.height)
    })

    const imgActualFullCanvas = adjustCanvas(imgActual, diff.width, diff.height)
    const imgExpectedFullCanvas = adjustCanvas(imgExpected, diff.width, diff.height)

    mismatchedPixels = pixelmatch(
      imgActualFullCanvas.data,
      imgExpectedFullCanvas.data,
      diff.data,
      diff.width,
      diff.height,
      { threshold: 0.1 }
    )
    percentage = (mismatchedPixels / diff.width / diff.height) ** 0.5

    if (percentage > args.errorThreshold) {
      log(`Error in visual regression found: ${percentage.toFixed(2)}`)
      const specFolder = path.join(snapshotDiffDirectory, args.specRelativePath)
      await createFolder(specFolder, args.failSilently)
      diff.pack().pipe(createWriteStream(options.diffImage))
      if (allowVisualRegressionToFail === false) {
        return {
          error: serializeError(
            new Error(
              `The "${fileName}" image is different. Threshold limit exceeded!
              Expected: ${args.errorThreshold}
              Actual: ${percentage}`
            )
          ),
          mismatchedPixels,
          percentage
        }
      }
    } else if (alwaysGenerateDiff === true) {
      const specFolder = path.join(snapshotDiffDirectory, args.specRelativePath)
      await createFolder(specFolder, args.failSilently)
      diff.pack().pipe(createWriteStream(options.diffImage))
    }
  } catch (error) {
    return { error: serializeError(error) }
  }
  return {
    mismatchedPixels,
    percentage
  }
}

type PluginConfig = {
  snapshotActualDirectory: string
} & Cypress.PluginConfig

/** Install plugin to compare snapshots.
 * (Also installs an internally used plugin to move snapshot files). */
const getCompareSnapshotsPlugin = (on: Cypress.PluginEvents, config: PluginConfig): void => {
  setupScreenshotPath(config)
  on('task', {
    compareSnapshotsPlugin,
    updateSnapshot
  })
}

const setupScreenshotPath = (config: PluginConfig): void => {
  // use cypress default path as fallback
  CYPRESS_SCREENSHOT_DIR = config.snapshotActualDirectory ?? 'cypress/screenshots'
}

export default getCompareSnapshotsPlugin
