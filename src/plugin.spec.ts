import { existsSync, rmSync } from 'fs'
import path from 'path'
import { expect } from 'vitest'
import { compareSnapshots, updateSnapshot, type VisualRegressionOptions, type UpdateSnapshotOptions } from './plugin'

const baseUpdateOptions: UpdateSnapshotOptions = {
  screenshotName: 'enjuto',
  type: 'regression',
  screenshotAbsolutePath: './src/fixtures/assets/base/cypress/e2e/sub-folder/spec.cy.ts/enjuto.png',
  baseDirectory: './src/fixtures/assets/base',
  spec: {
    name: 'spec.cy.ts',
    absolute: 'unneeded/absolute/path/spec.cy.ts',
    relative: 'cypress/e2e/sub-folder/spec.cy.ts'
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
        const customDir = 'customDir/cypress/e2e/sub-folder/spec.cy.ts/customName.png'
        const isFileCopied = existsSync(customDir)
        expect(isFileCopied).toBe(true)
        rmSync('customDir', { recursive: true })
      })
    })
    describe('when there is an error on updating the snapshot', () => {
      it('should throw an error if cannot copy file', async () => {
        const options: UpdateSnapshotOptions = {
          ...baseUpdateOptions,
          screenshotAbsolutePath: './src/fixtures/assets/cypress/e2e/sub-folder/spec.cy.ts/wadus.png'
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
            screenshotAbsolutePath: './src/fixtures/assets/mod/cypress/e2e/sub-folder/spec.cy.ts/random.png',
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
          const isDiffGenerated = existsSync(path.join(options.diffDirectory, options.spec.relative, 'random.png'))
          expect(isDiffGenerated).toBe(true)
        })
        it('should not generate a diff image if generateDiff is set to never', async () => {
          const options: VisualRegressionOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: './src/fixtures/assets/mod/cypress/e2e/sub-folder/spec.cy.ts/not_ever.png',
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
            screenshotName: 'not_ever',
            screenshotAbsolutePath: './src/fixtures/assets/mod/cypress/e2e/sub-folder/spec.cy.ts/not_ever.png',
            pluginOptions: {
              errorThreshold: 1,
              failSilently: false,
              pixelmatchOptions: {}
            }
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
            screenshotAbsolutePath: './src/fixtures/assets/base/cypress/e2e/sub-folder/spec.cy.ts/enjuto.png',
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
          const isDiffGenerated = existsSync(path.join(options.diffDirectory, options.spec.relative, 'enjuto.png'))
          expect(isDiffGenerated).toBe(true)
          rmSync('./src/fixtures/diff', { recursive: true })
        })
      })
    })
  })
})
