import { PNG } from 'pngjs'
import { describe, expect, test } from 'vitest'
import { adjustCanvas, parseImage } from './image.js'

describe('utils/image module', () => {
  describe('parseImage', () => {
    test('should throw error when image does not exist', async () => {
      const filename = 'img'
      const promise = parseImage(filename)
      await expect(promise).rejects.toThrow(`File '${filename}' does not exist.`)
    })
    // TODO mock createReadStream
    // it('should return an error on PNG creation', async () => {})
    // TODO mock createReadStream
    // it('should return a PNG image from reference', async () => {})
  })
  describe('adjustCanvas', () => {
    test('should return the same image if given same width and height than the given image ', () => {
      const originalPNG = new PNG({
        width: 10,
        height: 20
      })
      const outputPNG = adjustCanvas(originalPNG, 10, 20)
      expect(originalPNG).toEqual(outputPNG)
    })
    test('should return a new image based on the image given , with the new width and height passed', () => {
      const originalPNG = new PNG({ width: 10, height: 20 })
      const outputPNG = adjustCanvas(originalPNG, 50, 70)
      expect(originalPNG).not.toEqual(outputPNG)
      expect(outputPNG.width).toEqual(50)
      expect(outputPNG.height).toEqual(70)
    })
  })
})
