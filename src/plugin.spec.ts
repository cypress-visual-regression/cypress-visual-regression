import { existsSync, rmSync } from 'fs'
import path from 'path'
import { PNG } from 'pngjs'
import { expect } from 'vitest'
import {
  compareSnapshots,
  generateImage,
  updateSnapshot,
  type CompareSnapshotOptions,
  type UpdateSnapshotOptions
} from './plugin'

const baseUpdateOptions: UpdateSnapshotOptions = {
  screenshotName: 'enjuto',
  specName: 'sub-folder',
  screenshotAbsolutePath: path.join('./src/fixtures/assets/base/enjuto.png'),
  baseDirectory: path.join('./src/fixtures/assets/base'),
  spec: {
    name: 'enjuto.png',
    absolute: '',
    relative: ''
  }
} as const

const baseCompareOptions: CompareSnapshotOptions = {
  ...baseUpdateOptions,
  errorThreshold: 0.1,
  diffDirectory: path.join('./src/fixtures/diff'),
  generateDiff: 'fail'
}

const buildPNG = (): PNG => {
  const png = new PNG({ width: 1, height: 1 })
  png.data = Buffer.from([255, 0, 0, 255])
  return png
}

describe('plugin', () => {
  describe('generateImage', () => {
    describe('when the image is generated', () => {
      it('should generate an image', async () => {
        const result = await generateImage(buildPNG(), path.join('mock/validImagePath.png'))
        expect(result).toBe(true)
        rmSync('mock', { recursive: true })
      })
    })
    describe('when the image is not generated', () => {
      it('should not generate an image and throw an error on directory creation', async () => {
        const invalidDir = path.join('./ass\0ets*/invalidDir.png')
        const result = generateImage(buildPNG(), invalidDir)
        const fullPath = path.dirname(invalidDir)
        await expect(result).rejects.toThrow(`cannot create directory '${fullPath}'.`)
      })
      it('should not generate an image and throw an error on file creation', async () => {
        const rootFile = path.join('te\0st.png*')
        const result = generateImage(buildPNG(), rootFile)
        await expect(result).rejects.toThrow("The argument 'path' must be a str")
      })
    })
  })
  describe('updateSnapshot', () => {
    describe('when the snapshot is updated', () => {
      it('should copy the snapshot to default folder', async () => {
        const options: UpdateSnapshotOptions = {
          ...baseUpdateOptions,
          baseDirectory: undefined,
          screenshotName: 'defaultName'
        }
        //         options.screenshotName = 'defaultDir'
        const result = await updateSnapshot(options)
        expect(result).toEqual({
          baseGenerated: true
        })
        const defaultDir = path.join('cypress/snapshots/base/defaultName.png')
        const isFileCopied = existsSync(defaultDir)
        expect(isFileCopied).toBe(true)
        rmSync('cypress', { recursive: true })
      })
      it('should copy the snapshot to custom baseDirectory', async () => {
        const options: UpdateSnapshotOptions = {
          ...baseUpdateOptions,
          baseDirectory: 'customDir',
          screenshotName: 'customName'
        }
        const result = await updateSnapshot(options)
        expect(result).toEqual({
          baseGenerated: true
        })
        const customDir = path.join('customDir/customName.png')
        const isFileCopied = existsSync(customDir)
        expect(isFileCopied).toBe(true)
        rmSync('customDir', { recursive: true })
      })
    })
    describe('when there is an error on updating the snapshot', () => {
      it('should throw an error if cannot copy file', async () => {
        const options: UpdateSnapshotOptions = {
          ...baseUpdateOptions,
          screenshotAbsolutePath: path.join('./src/fixtures/assets/wadus.png')
        }
        const result = updateSnapshot(options)
        const fullPath = path.join(options.baseDirectory ?? '', `${options.screenshotName}.png`)
        await expect(result).rejects.toThrow(
          `Failed to copy file from '${path.join('./src/fixtures/assets/wadus.png')}' to '${fullPath}'.`
        )
      })
    })
  })
  describe('compareSnapshot', () => {
    describe('when doing a comparison', () => {
      it('should return a valid result', async () => {
        const options = {
          ...baseCompareOptions,
          specName: ''
        }
        const result = await compareSnapshots(options)
        expect(result.percentage).toBe(0)
        expect(result.mismatchedPixels).toBe(0)
      })
      describe('when image differs', () => {
        it('should not generate a diff image if generateDiff is set to never', async () => {
          const options: CompareSnapshotOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: path.join('./src/fixtures/assets/mod/not_ever.png'),
            errorThreshold: 0,
            specName: '',
            screenshotName: 'not_ever',
            generateDiff: 'never'
          }

          const result = await compareSnapshots(options)
          expect(result.percentage).toBeGreaterThan(0)
          expect(result.mismatchedPixels).toBeGreaterThan(0)
          const isDiffGenerated = existsSync(path.join(options.diffDirectory as string, 'not_ever.png'))
          expect(isDiffGenerated).toBe(false)
        })
        it('should not generate a diff image if threshold is higher than mismatched percentage ', async () => {
          const options: CompareSnapshotOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: path.join('./src/fixtures/assets/mod/not_ever.png'),
            specName: '',
            errorThreshold: 1,
            screenshotName: 'not_ever'
          }
          const result = await compareSnapshots(options)
          expect(result.percentage).toBeGreaterThan(0)
          expect(result.mismatchedPixels).toBeGreaterThan(0)
          const isDiffGenerated = existsSync(path.join(options.diffDirectory as string, 'not_ever.png'))
          expect(isDiffGenerated).toBe(false)
        })

        it('should generate a diff image if generateDiff is set to always', async () => {
          const options: CompareSnapshotOptions = {
            ...baseCompareOptions,
            specName: '',
            screenshotAbsolutePath: path.join('./src/fixtures/assets/mod/enjuto.png'),
            errorThreshold: 0,
            generateDiff: 'always'
          }
          const result = await compareSnapshots(options)
          expect(result.percentage).toBeGreaterThan(0)
          expect(result.mismatchedPixels).toBeGreaterThan(0)
          const isDiffGenerated = existsSync(path.join(options.diffDirectory as string, 'enjuto.png'))
          expect(isDiffGenerated).toBe(true)
          rmSync('./src/fixtures/diff', { recursive: true })
        })
      })
    })
  })
})
