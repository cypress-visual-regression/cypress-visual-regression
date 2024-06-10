import { PNG } from 'pngjs'
import { describe, expect, test } from 'vitest'
import { adjustCanvas, parseImage } from './image'

describe('utils/image module', () => {
  describe('parseImage', () => {
    // TODO mock createReadStream
    test('should throw error if image does not exist', async () => {
      const filename = 'img'
      const promise = parseImage(filename)
      await expect(promise).rejects.toThrow('no such file or directory')
    })
    // TODO mock createReadStream
    test('should throw error on invalid file type', async () => {
      const filename = './cypress-visual-regression.gif'
      const promise = parseImage(filename)
      await expect(promise).rejects.toThrow('Invalid file signature')
    })
    // TODO mock createReadStream
    test('should return a PNG image from reference', async () => {
      const filename = './src/fixtures/mocks/cypress-visual-regression.png'
      const image = await parseImage(filename)
      expect(typeof image).to.equal('object')
    })
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
