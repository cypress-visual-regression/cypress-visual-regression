import { existsSync, rmSync } from 'fs'
import path from 'path'
import { expect } from 'vitest'
import { compareSnapshots, updateSnapshot, type CompareSnapshotOptions, type UpdateSnapshotOptions } from './plugin'

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
}

const baseCompareOptions: CompareSnapshotOptions = {
  ...baseUpdateOptions,
  errorThreshold: 0.1,
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
          baseDirectory: undefined,
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
          const options: CompareSnapshotOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: path.join('./src/fixtures/assets/mod/random.png'),
            errorThreshold: 0,
            specName: '',
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
          const isDiffGenerated = existsSync(path.join(options.diffDirectory as string, 'random.png'))
          expect(isDiffGenerated).toBe(true)
        })
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
          expect(result.images.actual).toBeDefined()
          expect(result.images.base).toBeDefined()
          expect(result.images.diff).toBeUndefined()
          expect(result.baseGenerated).toBeUndefined()
          expect(result.error).toBeDefined()
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
          expect(result.images.actual).toBeDefined()
          expect(result.images.base).toBeDefined()
          expect(result.images.diff).toBeUndefined()
          expect(result.baseGenerated).toBeUndefined()
          expect(result.error).toBeUndefined()
          const isDiffGenerated = existsSync(path.join(options.diffDirectory as string, 'not_ever.png'))
          expect(isDiffGenerated).toBe(false)
        })

        it('should generate a diff image if generateDiff is set to always', async () => {
          const options: CompareSnapshotOptions = {
            ...baseCompareOptions,
            specName: '',
            screenshotAbsolutePath: path.join('./src/fixtures/assets/base/enjuto.png'),
            errorThreshold: 0,
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
          const isDiffGenerated = existsSync(path.join(options.diffDirectory as string, 'enjuto.png'))
          expect(isDiffGenerated).toBe(true)
          rmSync('./src/fixtures/diff', { recursive: true })
        })
      })
    })
  })
})
