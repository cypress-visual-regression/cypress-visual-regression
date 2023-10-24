import { createWriteStream, promises as fs } from 'node:fs'
import path from 'node:path'
import pixelMatch from 'pixelmatch'
import { PNG } from 'pngjs'
import sanitize from 'sanitize-filename'
import { serializeError, type ErrorObject } from 'serialize-error'

import { adjustCanvas, parseImage } from './utils/image'
import { logger } from './logger'

export type UpdateSnapshotOptions = {
  screenshotName: string
  specName: string
  screenshotAbsolutePath: string
  baseDirectory?: string
}

export type CompareSnapshotsOptions = {
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

/**
 * Update the base snapshot .png by copying the generated snapshot to the base snapshot directory.
 * The target path is constructed from parts at runtime in node to be OS independent.
 * */
const updateSnapshot = async (options: UpdateSnapshotOptions): Promise<boolean> => {
  const toDir = options.baseDirectory ?? path.join(process.cwd(), 'cypress', 'snapshots', 'base')
  const destDir = path.join(toDir, options.specName)
  const destFile = path.join(destDir, `${options.screenshotName}.png`)

  await fs.mkdir(destDir, { recursive: true })
  await fs.copyFile(options.screenshotAbsolutePath, destFile)
  logger.debug(`Updated base snapshot '${options.screenshotName}' at ${destFile}`)
  return true
}

/**
 * Cypress plugin to compare image snapshots & generate a diff image.
 * Uses the pixelmatch library internally.
 * */
const compareSnapshots = async (options: CompareSnapshotsOptions): Promise<CompareSnapshotResult> => {
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
    logger.error(`Error in visual regression found: ${percentage.toFixed(2)}`)
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

export async function generateImage(diffPNG: PNG, image: string, desirePath: string): Promise<boolean> {
  try {
    await fs.mkdir(desirePath, { recursive: true })
  } catch (error) {
    logger.error(`Failed to create directory '${desirePath}' with error:`, serializeError(error))
    return await Promise.reject(new Error(`cannot create directory '${desirePath}'.`))
  }
  return await new Promise((resolve, reject) => {
    const filePath = path.join(desirePath, image)
    const file = createWriteStream(filePath)
    file.on('error', (error) => {
      logger.error(`Failed to write stream '${filePath}' with error:`, serializeError(error))
      reject(new Error(`cannot create file '${filePath}'.`))
    })
    diffPNG
      .pack()
      .pipe(file)
      .on('finish', () => {
        resolve(true)
      })
      .on('error', (error) => {
        logger.error(`Failed to parse image '${filePath}' with error:`, serializeError(error))
        reject(error)
      })
  })
}

export default configureVisualRegression
