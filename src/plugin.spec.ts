import { PNG } from 'pngjs'
import { generateImage, updateSnapshot } from './plugin'
import { expect } from 'vitest'
import { unlinkSync } from 'node:fs'
import path from 'node:path'

describe('plugin', () => {
  // unit tests for generateImage
  describe('generateImage', () => {
    const validImagePath = 'mocks/test.png'
    describe('when the image is generated', () => {
      it('should generate an image', async () => {
        const png = new PNG({ width: 1, height: 1 })
        png.data = Buffer.from([255, 0, 0, 255])
        const result = await generateImage(png, validImagePath)
        expect(result).toBe(true)
        unlinkSync(path.join(validImagePath))
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
  describe('updateSnapshot', () => {
    const screenshotName = 'new-image'
    const specName = 'assets'
    const screenshotAbsolutePath = path.join('fixtures', 'assets', 'enjuto.png')
    const defaultBaseDirectory = path.join('cypress', 'snapshots', 'base')
    const baseDirectory = path.join('output')
    describe('when the snapshot is updated', () => {
      it('should copy the snapshot to default folder', async () => {
        const result = await updateSnapshot({ screenshotName, specName, screenshotAbsolutePath })
        expect(result).toBe(true)
        unlinkSync(path.join(defaultBaseDirectory, specName, `${screenshotName}.png`))
      })
      it('should copy the snapshot to baseDirectory', async () => {
        const result = await updateSnapshot({ baseDirectory, screenshotName, specName, screenshotAbsolutePath })
        expect(result).toBe(true)
        unlinkSync(path.join(baseDirectory, specName, `${screenshotName}.png`))
      })
    })
    describe('when there is an error in updating the snapshot', () => {
      const wrongAbsolutePath = path.join('fixtures', 'assets', 'wadus.png')
      it('should throw an error if cannot copy file', async () => {
        const result = updateSnapshot({ screenshotName, specName, screenshotAbsolutePath: wrongAbsolutePath })
        await expect(result).rejects.toThrow(
          `Failed to copy file from '${wrongAbsolutePath}' to '${path.join(
            process.cwd(),
            defaultBaseDirectory,
            specName,
            `${screenshotName}.png`
          )}'.`
        )
      })
      it('should throw an error if cannot create a directory', async () => {
        const privateBaseDirectory = '/System'
        const result = updateSnapshot({
          screenshotName,
          specName,
          screenshotAbsolutePath,
          baseDirectory: privateBaseDirectory
        })
        await expect(result).rejects.toThrow(`cannot create directory '${path.join(privateBaseDirectory, specName)}'.`)
      })
    })
  })
})
