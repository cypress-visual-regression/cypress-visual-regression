import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { expect } from 'vitest'
import { compareSnapshots, updateSnapshot, type VisualRegressionOptions, type UpdateSnapshotOptions } from './plugin'

type CompareSnapshotsOptions = VisualRegressionOptions & { retryAttempt: number }

const baseUpdateOptions: UpdateSnapshotOptions = {
  screenshotName: 'enjuto',
  type: 'regression',
  screenshotAbsolutePath: './src/fixtures/actual/enjuto.png',
  baseDirectory: './src/fixtures/base',
  spec: {
    name: 'spec.cy.ts',
    absolute: 'unneeded/absolute/path/spec.cy.ts',
    relative: 'cypress/e2e/sub-folder/spec.cy.ts'
  }
}

const baseCompareOptions: CompareSnapshotsOptions = {
  ...baseUpdateOptions,
  pluginOptions: {
    errorThreshold: 0.1,
    failSilently: false,
    pixelmatchOptions: {}
  },
  screenshotOptions: {},
  diffDirectory: path.join('./src/fixtures/diff'),
  generateDiff: 'fail',
  retryAttempt: 0
}

const createTempBaseDirectory = (screenshotName: string): string => {
  const directory = mkdtempSync(path.join(tmpdir(), 'cypress-visual-regression-'))
  const destinationDirectory = path.join(directory, baseUpdateOptions.spec.relative)
  mkdirSync(destinationDirectory, { recursive: true })
  copyFileSync(
    path.join(baseUpdateOptions.baseDirectory, baseUpdateOptions.spec.relative, `${screenshotName}.png`),
    path.join(destinationDirectory, `${screenshotName}.png`)
  )
  return directory
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
          screenshotAbsolutePath: './src/fixtures/actual/wadus.png'
        }
        const result = updateSnapshot(options)
        await expect(result).rejects.toThrow('no such file or directory')
      })
    })
  })
  describe('compareSnapshot', () => {
    describe('when doing a comparison', () => {
      it('should return a valid result', async () => {
        const options: CompareSnapshotsOptions & { specName: string } = {
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
          const options: CompareSnapshotsOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: './src/fixtures/actual/random.png',
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
          const options: CompareSnapshotsOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: './src/fixtures/actual/not_ever.png',
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
          const options: CompareSnapshotsOptions = {
            ...baseCompareOptions,
            screenshotName: 'not_ever',
            screenshotAbsolutePath: './src/fixtures/actual/not_ever.png',
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

        it('should update base snapshot on mismatch when updateSnapshots option is enabled', async () => {
          const tempBaseDirectory = createTempBaseDirectory('random')
          const options: CompareSnapshotsOptions = {
            ...baseCompareOptions,
            screenshotName: 'random',
            screenshotAbsolutePath: './src/fixtures/actual/random.png',
            baseDirectory: tempBaseDirectory,
            generateDiff: 'never',
            updateSnapshots: true,
            pluginOptions: {
              errorThreshold: 0,
              failSilently: false,
              pixelmatchOptions: {}
            }
          }

          try {
            const result = await compareSnapshots(options)
            const updatedBasePath = path.join(tempBaseDirectory, options.spec.relative, 'random.png')
            expect(result.error).toBeUndefined()
            expect(result.baseGenerated).toBe(true)
            expect(result.mismatchedPixels).toBeGreaterThan(0)
            expect(readFileSync(updatedBasePath)).toEqual(readFileSync(options.screenshotAbsolutePath))
          } finally {
            rmSync(tempBaseDirectory, { recursive: true, force: true })
          }
        })

        it('should generate a diff image if generateDiff is set to always', async () => {
          const options: CompareSnapshotsOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: './src/fixtures/actual/enjuto.png',
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

        it('should calculate percentage difference correctly', async () => {
          const options: CompareSnapshotsOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: './src/fixtures/actual/percentage-actual-10.png',
            pluginOptions: {
              errorThreshold: 0,
              failSilently: false,
              pixelmatchOptions: {}
            },
            generateDiff: 'never',
            screenshotName: 'percentage-base'
          }
          const result10 = await compareSnapshots(options)
          expect(result10.percentage).toEqual(0.1)
          expect(result10.mismatchedPixels).toEqual(10)

          options.screenshotAbsolutePath = './src/fixtures/actual/percentage-actual-50.png'
          const result50 = await compareSnapshots(options)
          expect(result50.percentage).toEqual(0.5)
          expect(result50.mismatchedPixels).toEqual(50)

          options.screenshotAbsolutePath = './src/fixtures/actual/percentage-actual-75.png'
          const result75 = await compareSnapshots(options)
          expect(result75.percentage).toEqual(0.75)
          expect(result75.mismatchedPixels).toEqual(75)

          options.screenshotAbsolutePath = './src/fixtures/actual/percentage-actual-100.png'
          const result100 = await compareSnapshots(options)
          expect(result100.percentage).toEqual(1)
          expect(result100.mismatchedPixels).toEqual(100)
        })
      })
    })
  })
})
