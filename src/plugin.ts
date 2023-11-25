import { createWriteStream, promises as fs } from 'node:fs'
import * as path from 'node:path'
import pixelMatch from 'pixelmatch'
import { PNG } from 'pngjs'
import sanitize from 'sanitize-filename'
import { serializeError, type ErrorObject } from 'serialize-error'

import { adjustCanvas, parseImage } from './utils/image'
import { logger } from './utils/logger'

export type DiffOption = 'always' | 'fail' | 'never'
export type TypeOption = 'regression' | 'base'

export type VisualRegressionOptions = {
  /** kind of comparison that we are going to execute */
  type: TypeOption
  /** new image name **_without_** file termination */
  screenshotName: string
  /** threshold value from 0 to 1. 0.01 will be 1%  */
  errorThreshold: number
  /** subdirectory to be added to base directory */
  specName: string
  /** absolute path and name of the original image **_including file termination_** */
  screenshotAbsolutePath: string
  /** base directory where to move the image, if omitted default will be **'cypress/snapshots/base'** */
  baseDirectory?: string
  /** diff directory were we store the diff images, if omitted default will be  **'cypress/snapshots/diff'** */
  diffDirectory?: string
  /** how we should handle diff images */
  generateDiff?: DiffOption
  /** if set to true failing test will not be thrown */
  failSilently: boolean
}

export type UpdateSnapshotOptions = Pick<
  VisualRegressionOptions,
  'screenshotName' | 'specName' | 'screenshotAbsolutePath' | 'baseDirectory'
>

export type CompareSnapshotOptions = Omit<VisualRegressionOptions, 'failSilently' | 'type'>

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
export const updateSnapshot = async (options: UpdateSnapshotOptions): Promise<VisualRegressionResult> => {
  const toDir = options.baseDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'base')
  const destDir = path.join(toDir, options.specName)
  const destFile = path.join(destDir, `${options.screenshotName}.png`)
  try {
    await fs.mkdir(destDir, { recursive: true })
  } catch (error) {
    logger.error(`Failed to create directory '${destDir}' with error:`, serializeError(error))
    return await Promise.reject(new Error(`cannot create directory '${destDir}'.`))
  }
  try {
    await fs.copyFile(options.screenshotAbsolutePath, destFile)
    logger.debug(`Updated base snapshot '${options.screenshotName}' at ${destFile}`)
    return { baseGenerated: true }
  } catch (error) {
    logger.error(`Failed to copy file '${destDir}' with error:`, serializeError(error))
    return await Promise.reject(
      new Error(`Failed to copy file from '${options.screenshotAbsolutePath}' to '${destFile}'.`)
    )
  }
}

/**
 * Cypress plugin to compare image snapshots & generate a diff image.
 * Uses the pixelmatch library internally.
 * */
export const compareSnapshots = async (options: CompareSnapshotOptions): Promise<VisualRegressionResult> => {
  const snapshotBaseDirectory = options.baseDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'base')
  const snapshotDiffDirectory = options.diffDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'diff')

  const fileName: string = sanitize(options.screenshotName)
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
      await generateImage(diffPNG, diffImage)
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
    await generateImage(diffPNG, diffImage)
  }
  return {
    mismatchedPixels,
    percentage
  }
}

export async function generateImage(diffPNG: PNG, imagePath: string): Promise<boolean> {
  const dirName = path.dirname(imagePath)
  try {
    await fs.mkdir(dirName, { recursive: true })
  } catch (error) {
    logger.error(`Failed to create directory '${dirName}' with error:`, serializeError(error))
    return await Promise.reject(new Error(`cannot create directory '${dirName}'.`))
  }
  return await new Promise((resolve, reject) => {
    const file = createWriteStream(imagePath)
    file.on('error', (error) => {
      logger.error(`Failed to write stream '${imagePath}' with error:`, serializeError(error))
      reject(new Error(`cannot create file '${imagePath}'.`))
    })
    diffPNG
      .pack()
      .pipe(file)
      .on('finish', () => {
        resolve(true)
      })
      .on('error', (error) => {
        logger.error(`Failed to parse image '${imagePath}' with error:`, serializeError(error))
        reject(error)
      })
  })
}

/** Configure the plugin to compare snapshots. */
export const configureVisualRegression = (on: Cypress.PluginEvents): void => {
  on('task', {
    compareSnapshots,
    updateSnapshot
  })
}
