import { PNG } from 'pngjs'
import { generateImage } from './plugin'
import { expect } from 'vitest'
import { unlinkSync } from 'node:fs'
import path from 'node:path'

// unit tests for generateImage
describe('generateImage', () => {
  const validImagePath = 'mocks/test.png'
  describe('when the image is generated', () => {
    afterEach(() => {
      unlinkSync(path.join(validImagePath))
    })
    it('should generate an image', async () => {
      const png = new PNG({ width: 1, height: 1 })
      png.data = Buffer.from([255, 0, 0, 255])
      const result = await generateImage(png, validImagePath)
      expect(result).toBe(true)
    })
  })
  describe('when the image is not generated', () => {
    const systemFileName = '/System/wadus/test.png'
    const rootFileName = '/test.png'
    it('should not generate an image and throw an error on directory creation', async () => {
      const png = new PNG({ width: 1, height: 1 })
      png.data = Buffer.from([255, 0, 0, 255])
      const result = generateImage(png, systemFileName)
      await expect(result).rejects.toThrow(`cannot create directory '${path.dirname(systemFileName)}'.`)
    })
    it('should not generate an image and throw an error on file creation', async () => {
      const png = new PNG({ width: 1, height: 1 })
      png.data = Buffer.from([255, 0, 0, 255])
      const result = generateImage(png, rootFileName)
      await expect(result).rejects.toThrow(`cannot create file '${rootFileName}'.`)
    })
  })
})
