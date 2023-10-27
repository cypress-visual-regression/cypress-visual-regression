import { createWriteStream, promises as fs } from 'fs'
import * as path from 'path'
import pixelMatch from 'pixelmatch'
import { PNG } from 'pngjs'
import sanitize from 'sanitize-filename'
import { serializeError, type ErrorObject } from 'serialize-error'

import { adjustCanvas, parseImage } from './utils/image'
import { logger } from './utils/logger'

export type DiffOption = 'always' | 'fail' | 'never'

export type VisualRegressionOptions = {
  type: string
  screenshotName: string
  errorThreshold: number
  specName: string
  screenshotAbsolutePath: string
  baseDirectory?: string
  diffDirectory?: string
  generateDiff?: DiffOption
  failSilently: boolean
}

export type UpdateSnapshotOptions = Pick<
  VisualRegressionOptions,
  'screenshotName' | 'specName' | 'screenshotAbsolutePath' | 'baseDirectory'
>
export type CompareSnapshotOptions = Pick<
  VisualRegressionOptions,
  | 'screenshotName'
  | 'specName'
  | 'screenshotAbsolutePath'
  | 'baseDirectory'
  | 'diffDirectory'
  | 'errorThreshold'
  | 'generateDiff'
>

export type VisualRegressionResult = {
  error?: ErrorObject
  mismatchedPixels?: number
  percentage?: number
  baseGenerated?: boolean
}

/**
 * Update the base snapshot .png by copying the generated snapshot to the base snapshot directory.
 * The target path is constructed from parts at runtime in node to be OS independent.
 * */
const updateSnapshot = async (options: UpdateSnapshotOptions): Promise<VisualRegressionResult> => {
  const toDir = options.baseDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'base')
  const destDir = path.join(toDir, options.specName)
  const destFile = path.join(destDir, `${options.screenshotName}.png`)

  await fs.mkdir(destDir, { recursive: true })
  await fs.copyFile(options.screenshotAbsolutePath, destFile)
  logger.debug('Updated base snapshot "%s" at "%s"', options.screenshotName, destFile)
  return { baseGenerated: true }
}

/**
 * Cypress plugin to compare image snapshots & generate a diff image.
 * Uses the pixelmatch library internally.
 * */
const compareSnapshots = async (options: CompareSnapshotOptions): Promise<VisualRegressionResult> => {
  const snapshotBaseDirectory = options.baseDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'base')
  const snapshotDiffDirectory = options.diffDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'diff')

  const fileName: string = sanitize(options.screenshotName)
  const specFolder = path.join(snapshotDiffDirectory, options.specName)

  const actualImage = options.screenshotAbsolutePath
  const expectedImage = path.join(snapshotBaseDirectory, options.specName, `${fileName}.png`)
  const diffImage = path.join(snapshotDiffDirectory, options.specName, `${fileName}.png`)

  const [imgExpected, imgActual] = await Promise.all([parseImage(expectedImage), parseImage(actualImage)])
  const diffPNG = new PNG({
    width: Math.max(imgActual.width, imgExpected.width),
    height: Math.max(imgActual.height, imgExpected.height)
  })

  const imgActualFullCanvas = adjustCanvas(imgActual, diffPNG.width, diffPNG.height)
  const imgExpectedFullCanvas = adjustCanvas(imgExpected, diffPNG.width, diffPNG.height)

  const mismatchedPixels = pixelMatch(
    imgActualFullCanvas.data,
    imgExpectedFullCanvas.data,
    diffPNG.data,
    diffPNG.width,
    diffPNG.height,
    { threshold: 0.1 }
  )
  const percentage = (mismatchedPixels / diffPNG.width / diffPNG.height) ** 0.5

  if (percentage > options.errorThreshold) {
    logger.error('Error in visual regression found: "%s"', percentage.toFixed(2))
    if (options.generateDiff !== 'never') {
      await generateImage(diffPNG, diffImage, specFolder)
    }
    return {
      error: serializeError(
        new Error(
          `The "${fileName}" image is different. Threshold limit exceeded!
          Expected: ${options.errorThreshold}
          Actual: ${percentage}`
        )
      ),
      mismatchedPixels,
      percentage
    }
  } else if (options.generateDiff === 'always') {
    await generateImage(diffPNG, diffImage, specFolder)
  }
  return {
    mismatchedPixels,
    percentage
  }
}

/** Configure the plugin to compare snapshots. */
const configureVisualRegression = (on: Cypress.PluginEvents): void => {
  on('task', {
    compareSnapshots,
    updateSnapshot
  })
}

async function generateImage(diffPNG: PNG, image: string, path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true })
  diffPNG.pack().pipe(createWriteStream(image))
  logger.debug('Image with pixel difference generated: "%d"', image)
}

export default configureVisualRegression
