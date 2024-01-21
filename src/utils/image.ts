import { createReadStream, type ReadStream } from 'fs'
import { PNG } from 'pngjs'
import { logger } from './logger'

/**
 * Parses an image file and returns a Promise that resolves with a PNG instance.
 *
 * @param {string} imagePath - The path to the image file to parse.
 * @returns {Promise<PNG>} A Promise that resolves with a PNG instance representing the parsed image.
 * @throws {Error} Throws an error if the specified image file does not exist or if there was an error parsing the file.
 */
export const parseImage = async (imagePath: string): Promise<PNG> => {
  return await new Promise((resolve, reject) => {
    const stream: ReadStream = createReadStream(imagePath)
    stream.on('error', (error) => {
      logger.error('Failed to open "%s" with message: "%s"', imagePath, error.message)
      reject(new Error(`File '${imagePath}' does not exist.`))
    })
    stream
      .pipe(new PNG())
      .on('parsed', function () {
        resolve(this)
      })
      .on('error', (error) => {
        logger.error('Failed to parse image "%s" with message: "%s"', imagePath, error.message)
        reject(error)
      })
  })
}

/**
 * Adjusts the canvas size of an image.
 *
 * @param {PNG} image - The input image.
 * @param {number} width - The target width of the image.
 * @param {number} height - The target height of the image.
 *
 * @returns {PNG} The new image with adjusted canvas size.
 */
export const adjustCanvas = (image: PNG, width: number, height: number): PNG => {
  if (image.width === width && image.height === height) {
    return image
  }
  const imageAdjustedCanvas = new PNG({ width, height, inputHasAlpha: true })
  PNG.bitblt(image, imageAdjustedCanvas, 0, 0, image.width, image.height, 0, 0)
  return imageAdjustedCanvas
}
