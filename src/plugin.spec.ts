import { existsSync, rmSync } from 'fs'
import path from 'path'
import { expect } from 'vitest'
import { compareSnapshots, updateSnapshot, type VisualRegressionOptions, type UpdateSnapshotOptions } from './plugin'

const baseUpdateOptions: UpdateSnapshotOptions = {
  screenshotName: 'enjuto',
  type: 'regression',
  screenshotAbsolutePath: path.join('./src/fixtures/assets/base/enjuto.png'),
  baseDirectory: path.join('./src/fixtures/assets/base'),
  spec: {
    name: 'enjuto.png',
    absolute: '',
    relative: ''
  }
}

const baseCompareOptions: VisualRegressionOptions = {
  ...baseUpdateOptions,
  pluginOptions: {
    errorThreshold: 0.1,
    failSilently: false,
    pixelmatchOptions: {}
  },
  screenshotOptions: {},
  diffDirectory: path.join('./src/fixtures/diff'),
  generateDiff: 'fail'
}

describe('plugin', () => {
  describe('updateSnapshot', () => {
    describe('when the snapshot is updated', () => {
      it('should copy the snapshot to default folder', async () => {
        const options: UpdateSnapshotOptions = {
          ...baseUpdateOptions,
          baseDirectory: 'cypress/snapshots/base',
          screenshotName: 'defaultName'
        }
        const result = await updateSnapshot(options)
        expect(result.images.actual).toBeDefined()
        expect(result.images.base).toBeUndefined()
        expect(result.images.diff).toBeUndefined()
        expect(result.baseGenerated).toBe(true)
        expect(result.error).toBeUndefined()
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
        expect(result.images.actual).toBeDefined()
        expect(result.images.base).toBeUndefined()
        expect(result.images.diff).toBeUndefined()
        expect(result.baseGenerated).toBe(true)
        expect(result.error).toBeUndefined()
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
        await expect(result).rejects.toThrow('no such file or directory')
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
        expect(result.images.actual).toBeDefined()
        expect(result.images.base).toBeDefined()
        expect(result.images.diff).toBeUndefined()
        expect(result.baseGenerated).toBeUndefined()
        expect(result.error).toBeUndefined()
      })
      describe('when image differs', () => {
        it('should generate a diff image by default', async () => {
          const options: VisualRegressionOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: path.join('./src/fixtures/assets/mod/random.png'),
            pluginOptions: {
              errorThreshold: 0,
              failSilently: false,
              pixelmatchOptions: {}
            },
            screenshotName: 'random'
          }

          const result = await compareSnapshots(options)
          expect(result.percentage).toBeGreaterThan(0)
          expect(result.mismatchedPixels).toBeGreaterThan(0)
          expect(result.images.actual).toBeDefined()
          expect(result.images.base).toBeDefined()
          expect(result.images.diff).toBeDefined()
          expect(result.baseGenerated).toBeUndefined()
          expect(result.error).toBeDefined()
          const isDiffGenerated = existsSync(path.join(options.diffDirectory, 'random.png'))
          expect(isDiffGenerated).toBe(true)
        })
        it('should not generate a diff image if generateDiff is set to never', async () => {
          const options: VisualRegressionOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: path.join('./src/fixtures/assets/mod/not_ever.png'),
            pluginOptions: {
              errorThreshold: 0,
              failSilently: false,
              pixelmatchOptions: {}
            },
            screenshotName: 'not_ever',
            generateDiff: 'never'
          }

          const result = await compareSnapshots(options)
          expect(result.percentage).toBeGreaterThan(0)
          expect(result.mismatchedPixels).toBeGreaterThan(0)
          expect(result.images.actual).toBeDefined()
          expect(result.images.base).toBeDefined()
          expect(result.images.diff).toBeUndefined()
          expect(result.baseGenerated).toBeUndefined()
          expect(result.error).toBeDefined()
          const isDiffGenerated = existsSync(path.join(options.diffDirectory, 'not_ever.png'))
          expect(isDiffGenerated).toBe(false)
        })
        it('should not generate a diff image if threshold is higher than mismatched percentage ', async () => {
          const options: VisualRegressionOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: path.join('./src/fixtures/assets/mod/not_ever.png'),
            pluginOptions: {
              errorThreshold: 1,
              failSilently: false,
              pixelmatchOptions: {}
            },
            screenshotName: 'not_ever'
          }
          const result = await compareSnapshots(options)
          expect(result.percentage).toBeGreaterThan(0)
          expect(result.mismatchedPixels).toBeGreaterThan(0)
          expect(result.images.actual).toBeDefined()
          expect(result.images.base).toBeDefined()
          expect(result.images.diff).toBeUndefined()
          expect(result.baseGenerated).toBeUndefined()
          expect(result.error).toBeUndefined()
          const isDiffGenerated = existsSync(path.join(options.diffDirectory, 'not_ever.png'))
          expect(isDiffGenerated).toBe(false)
        })

        it('should generate a diff image if generateDiff is set to always', async () => {
          const options: VisualRegressionOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: path.join('./src/fixtures/assets/base/enjuto.png'),
            pluginOptions: {
              errorThreshold: 0,
              failSilently: false,
              pixelmatchOptions: {}
            },
            generateDiff: 'always'
          }
          const result = await compareSnapshots(options)
          expect(result.percentage).toEqual(0)
          expect(result.mismatchedPixels).toEqual(0)
          expect(result.images.actual).toBeDefined()
          expect(result.images.base).toBeDefined()
          expect(result.images.diff).toBeDefined()
          expect(result.baseGenerated).toBeUndefined()
          expect(result.error).toBeUndefined()
          const isDiffGenerated = existsSync(path.join(options.diffDirectory, 'enjuto.png'))
          expect(isDiffGenerated).toBe(true)
          rmSync('./src/fixtures/diff', { recursive: true })
        })
      })
    })
  })
})
