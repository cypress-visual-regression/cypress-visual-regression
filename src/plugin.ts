import { createWriteStream, promises as fs, renameSync, existsSync, mkdirSync, readdirSync, rmdirSync } from 'fs'
import * as path from 'path'
import pixelMatch from 'pixelmatch'
import { PNG } from 'pngjs'
import sanitize from 'sanitize-filename'
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
  /** Cypress spec file object info */
  spec: Cypress.Spec
}

export type UpdateSnapshotOptions = Pick<
  VisualRegressionOptions,
  'screenshotName' | 'specName' | 'screenshotAbsolutePath' | 'baseDirectory' | 'spec'
>

export type CompareSnapshotOptions = Omit<VisualRegressionOptions, 'failSilently' | 'type'>

export type VisualRegressionResult = {
  error?: string
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
  const destDir = path.join(toDir, options.spec.relative)
  const destFile = path.join(destDir, `${options.screenshotName}.png`)
  try {
    await fs.mkdir(destDir, { recursive: true })
  } catch (error) {
    logger.error(`Failed to create directory '${destDir}' with error:`, error)
    throw new Error(`cannot create directory '${destDir}'.`)
  }
  try {
    await fs.copyFile(options.screenshotAbsolutePath, destFile)
    logger.info(`Updated base snapshot '${options.screenshotName}' at ${destFile}`)
    logger.debug('UpdateSnapshotOptions: ', JSON.stringify(options, undefined, 2))
    moveActualSnapshotIfNeeded(options.screenshotAbsolutePath, options.spec.relativeToCommonRoot)
    return { baseGenerated: true }
  } catch (error) {
    logger.error(`Failed to copy file '${destDir}' with error:`, error)
    throw new Error(`Failed to copy file from '${options.screenshotAbsolutePath}' to '${destFile}'.`)
  }
}

/**
 * @description  For some reason Cypress does save the screenshots in the wrong folder when running in headless mode
 * It will use spec file to build an extra folder in the path
 * This is a workaround to remove the extra folder from the path
 * ie:
 * [CORRECT]   cypress open => .../snapshots/actual/cypress/e2e/alt-sub/foo/deep.cy.ts/inside_context.png
 * [INCORRECT] cypress run =>  .../snapshots/actual/deep.cy.ts/cypress/e2e/alt-sub/foo/deep.cy.ts/inside_context.png
 *
 * looking at Cypress.spec we can see that the relativeToCommonRoot is set only when running in headless mode
 * and that is the only time we need to remove the extra folder from the path
 *
 * ref: https://github.com/cypress-io/cypress/issues/29057
 *
 * @param actualScreenshot
 * @param relativeToCommonRoot
 * @returns boolean
 */
const moveActualSnapshotIfNeeded = (actualScreenshot: string, relativeToCommonRoot?: string): boolean => {
  if (relativeToCommonRoot != null) {
    const newPath = actualScreenshot.replace(relativeToCommonRoot + '/', '')
    const newDirectory = path.dirname(newPath)
    try {
      if (!existsSync(newDirectory)) {
        mkdirSync(newDirectory, { recursive: true })
      }
      renameSync(actualScreenshot, newPath)
      pruneEmptyDirectoriesInverse(path.dirname(actualScreenshot))
    } catch (error) {
      logger.error(`Failed to move file '${actualScreenshot}' with error:`, error)
      throw new Error(`Failed to move file  '${actualScreenshot}' to '${newPath}'.`)
    }
  }
  return true
}

// Function to recursively prune empty directories in the inverse order
const pruneEmptyDirectoriesInverse = (directory: string): void => {
  // check if the current directory is empty and remove it if it is
  if (readdirSync(directory).length === 0) {
    rmdirSync(directory)
    logger.debug(`Removed empty directory: ${directory}`)
    // recursively prune the parent directory
    pruneEmptyDirectoriesInverse(path.dirname(directory))
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
  const expectedImage = path.join(snapshotBaseDirectory, options.spec.relative, `${fileName}.png`)
  const diffImage = path.join(snapshotDiffDirectory, options.spec.relative, `${fileName}.png`)
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
      await generateImage(diffPNG, diffImage)
    }

    return {
      error: `The "${fileName}" image is different. Threshold limit exceeded!
       Expected: ${options.errorThreshold}
       Actual: ${percentage}`,
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
    logger.error(`Failed to create directory '${dirName}' with error:`, error)
    return await Promise.reject(new Error(`cannot create directory '${dirName}'.`))
  }
  return await new Promise((resolve, reject) => {
    const file = createWriteStream(imagePath)
    file.on('error', (error) => {
      logger.error(`Failed to write stream '${imagePath}' with error:`, error)
      reject(new Error(`cannot create file '${imagePath}'.`))
    })
    diffPNG
      .pack()
      .pipe(file)
      .on('finish', () => {
        resolve(true)
      })
      .on('error', (error) => {
        logger.error(`Failed to parse image '${imagePath}' with error:`, error)
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
