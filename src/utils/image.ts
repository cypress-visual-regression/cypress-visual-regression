import { PNG } from 'pngjs'

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
