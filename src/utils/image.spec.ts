import { PNG } from 'pngjs'
import { describe, expect, test } from 'vitest'
import { adjustCanvas } from './image'

describe('utils/image module', () => {
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
