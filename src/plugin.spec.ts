import { PNG } from 'pngjs'
import { generateImage } from './plugin'
import { expect } from 'vitest'
import { unlinkSync } from 'node:fs'
import path from 'node:path'

const fileName = 'test.png'
const specFolder = 'mocks'

// unit tests for generateImage
describe('generateImage', () => {
  describe('when the image is generated', () => {
    afterEach(() => {
      unlinkSync(path.join(specFolder, fileName))
    })
    it('should generate an image', async () => {
      const png = new PNG({ width: 1, height: 1 })
      png.data = Buffer.from([255, 0, 0, 255])
      const result = await generateImage(png, fileName, specFolder)
      expect(result).toBe(true)
    })
  })
  describe('when the image is not generated', () => {
    it('should not generate an image and throw an error on directory creation', async () => {
      const png = new PNG({ width: 1, height: 1 })
      png.data = Buffer.from([255, 0, 0, 255])
      const result = generateImage(png, fileName, '/System/wadus')
      await expect(result).rejects.toThrow(`cannot create directory '/System/wadus'.`)
    })
    it('should not generate an image and throw an error on file creation', async () => {
      const png = new PNG({ width: 1, height: 1 })
      png.data = Buffer.from([255, 0, 0, 255])
      const result = generateImage(png, fileName, '/')
      await expect(result).rejects.toThrow(`cannot create file '/${fileName}'.`)
    })
  })
})
