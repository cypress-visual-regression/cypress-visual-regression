import { createWriteStream, promises as fs } from 'fs'
import path from 'path'
import pixelMatch from 'pixelmatch'
import { PNG } from 'pngjs'
import sanitize from 'sanitize-filename'
import { serializeError, type ErrorObject } from 'serialize-error'

import { createFolder } from './utils/fs.js'
import { adjustCanvas, parseImage } from './utils/image.js'
import { logger } from './logger.js'

export type UpdateSnapshotArgs = {
  screenshotName: string
  specName: string
  screenshotAbsolutePath: string
  baseDirectory: string
}

export type CompareSnapshotsPluginArgs = {
  screenshotName: string
  errorThreshold: number
  specName: string
  screenshotAbsolutePath: string
  baseDirectory?: string
  diffDirectory?: string
  generateDiff?: 'always' | 'fail' | 'never'
}

export type CompareSnapshotResult = {
  error?: ErrorObject
  mismatchedPixels?: number
  percentage?: number
}

/** Update the base snapshot .png by copying the generated snapshot to the base snapshot directory.
 * The target path is constructed from parts at runtime in node to be OS independent.  */
const updateSnapshot = async (args: UpdateSnapshotArgs): Promise<boolean> => {
  const toDir = args.baseDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'base')
  const destDir = path.join(toDir, args.specName)
  const destFile = path.join(destDir, `${args.screenshotName}.png`)

  await createFolder(destDir)
  await fs.copyFile(args.screenshotAbsolutePath, destFile)
  logger.debug(`Updated base snapshot '${args.screenshotName}' at ${destFile}`)
  return true
}

/** Cypress plugin to compare image snapshots & generate a diff image.
 *
 * Uses the pixelmatch library internally.
 */
const compareSnapshotsPlugin = async (args: CompareSnapshotsPluginArgs): Promise<CompareSnapshotResult> => {
  const snapshotBaseDirectory = args.baseDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'base')
  const snapshotDiffDirectory = args.diffDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'diff')

  const fileName = sanitize(args.screenshotName)

  const options = {
    actualImage: args.screenshotAbsolutePath,
    expectedImage: path.join(snapshotBaseDirectory, args.specName, `${fileName}.png`),
    diffImage: path.join(snapshotDiffDirectory, args.specName, `${fileName}.png`)
  }

  await createFolder(snapshotDiffDirectory)
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

  const mismatchedPixels = pixelMatch(
    imgActualFullCanvas.data,
    imgExpectedFullCanvas.data,
    diff.data,
    diff.width,
    diff.height,
    { threshold: 0.1 }
  )
  const percentage = (mismatchedPixels / diff.width / diff.height) ** 0.5

  if (percentage > args.errorThreshold) {
    logger.error(`Error in visual regression found: ${percentage.toFixed(2)}`)
    if (args.generateDiff !== 'never') {
      const specFolder = path.join(snapshotDiffDirectory, args.specName)
      await createFolder(specFolder)
      diff.pack().pipe(createWriteStream(options.diffImage))
      logger.debug(`Image with pixel difference generated: ${options.diffImage}`)
    }
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
  } else if (args.generateDiff === 'always') {
    const specFolder = path.join(snapshotDiffDirectory, args.specName)
    await createFolder(specFolder)
    diff.pack().pipe(createWriteStream(options.diffImage))
    logger.debug(`Image with pixel difference generated: ${options.diffImage}`)
  }
  return {
    mismatchedPixels,
    percentage
  }
}

/** Install plugin to compare snapshots.
 * (Also installs an internally used plugin to move snapshot files). */
const getCompareSnapshotsPlugin = (on: Cypress.PluginEvents): void => {
  on('task', {
    compareSnapshotsPlugin,
    updateSnapshot
  })
}

export default getCompareSnapshotsPlugin
