import { existsSync, unlinkSync } from 'fs'
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

function deleteFileSafely(filePath: string): void {
  try {
    unlinkSync(filePath)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err // If the error is not "File not found" (ENOENT), rethrow it
    } // If the error is "File not found," do nothing (fail silently)
  }
}

const baseUpdateOptions: UpdateSnapshotOptions = {
  screenshotName: 'enjuto',
  specName: 'sub-folder',
  screenshotAbsolutePath: path.join('fixtures', 'assets', 'base', 'enjuto.png'),
  baseDirectory: path.join('fixtures', 'assets', 'base'),
  spec: {
    name: 'test',
    absolute: 'test',
    relative: 'test'
  }
} as const

const baseCompareOptions: CompareSnapshotOptions = {
  ...baseUpdateOptions,
  errorThreshold: 0.1,
  diffDirectory: path.join('cypress', 'snapshots', 'test', 'diff'),
  generateDiff: 'fail'
}

const baseDirectoryCustom = path.join('output')
const baseDirectoryDefault = path.join('cypress', 'snapshots', 'base')
const diffFilePath = path.join(baseCompareOptions.diffDirectory ?? '', 'enjuto.png')
const absolutePathMod = path.join('fixtures', 'assets', 'mod', 'enjuto.png')
const validImagePath = path.join('mock', 'test.png')
const systemFileName = path.join('System', 'ass\0ets*', 'test.png')
const wrongAbsolutePath = path.join('fixtures', 'assets', 'wadus.png')
const rootFileName = path.join('te\0st.png*')
const copiedFileName = path.join(
  baseDirectoryDefault,
  baseUpdateOptions.specName,
  `${baseUpdateOptions.screenshotName}.png`
)
const copiedFileNameCustom = path.join(
  baseDirectoryCustom,
  baseUpdateOptions.specName,
  `${baseUpdateOptions.screenshotName}.png`
)

const buildPNG = (): PNG => {
  const png = new PNG({ width: 1, height: 1 })
  png.data = Buffer.from([255, 0, 0, 255])
  return png
}

describe('plugin', () => {
  describe('generateImage', () => {
    describe('when the image is generated', () => {
      afterEach(() => {
        deleteFileSafely(validImagePath)
      })
      it('should generate an image', async () => {
        const result = await generateImage(buildPNG(), validImagePath)
        expect(result).toBe(true)
      })
    })
    describe('when the image is not generated', () => {
      it('should not generate an image and throw an error on directory creation', async () => {
        const result = generateImage(buildPNG(), systemFileName)
        await expect(result).rejects.toThrow(`cannot create directory '${path.dirname(systemFileName)}'.`)
      })
      it('should not generate an image and throw an error on file creation', async () => {
        const result = generateImage(buildPNG(), rootFileName)
        await expect(result).rejects.toThrow("The argument 'path' must be a str")
      })
    })
  })
  describe('updateSnapshot', () => {
    describe('when the snapshot is updated', () => {
      afterEach(() => {
        deleteFileSafely(copiedFileName)
        deleteFileSafely(copiedFileNameCustom)
      })

      it('should copy the snapshot to default folder', async () => {
        const options: UpdateSnapshotOptions = {
          ...baseUpdateOptions,
          baseDirectory: undefined
        }
        const result = await updateSnapshot(options)
        expect(result).toEqual({
          baseGenerated: true
        })
        const isFileCopied = existsSync(copiedFileName)
        expect(isFileCopied).toBe(true)
      })
      it('should copy the snapshot to custom baseDirectory', async () => {
        const options: UpdateSnapshotOptions = {
          ...baseUpdateOptions,
          baseDirectory: baseDirectoryCustom
        }
        const result = await updateSnapshot(options)
        expect(result).toEqual({
          baseGenerated: true
        })
        const isFileCopied = existsSync(copiedFileNameCustom)
        expect(isFileCopied).toBe(true)
      })
    })
    describe('when there is an error in updating the snapshot', () => {
      it('should throw an error if cannot copy file', async () => {
        const options: UpdateSnapshotOptions = {
          ...baseUpdateOptions,
          screenshotAbsolutePath: wrongAbsolutePath
        }
        const result = updateSnapshot(options)
        await expect(result).rejects.toThrow(
          `Failed to copy file from '${wrongAbsolutePath}' to '${path.join(
            options.baseDirectory ?? '',
            options.specName,
            `${options.screenshotName}.png`
          )}'.`
        )
      })
      it('should throw an error if cannot create a directory', async () => {
        const options: UpdateSnapshotOptions = {
          ...baseUpdateOptions,
          specName: '',
          baseDirectory: systemFileName
        }

        const result = updateSnapshot(options)
        await expect(result).rejects.toThrow(`cannot create directory '${systemFileName}'.`)
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
        afterEach(() => {
          deleteFileSafely(diffFilePath)
        })
        it('should not generate a diff image if generateDiff is set to never', async () => {
          const options: CompareSnapshotOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: absolutePathMod,
            errorThreshold: 0,
            specName: '',
            generateDiff: 'never'
          }

          const result = await compareSnapshots(options)
          expect(result.percentage).toBeGreaterThan(0)
          expect(result.mismatchedPixels).toBeGreaterThan(0)
          const isDiffGenerated = existsSync(diffFilePath)
          expect(isDiffGenerated).toBe(false)
        })
        it('should not generate a diff image if threshold is higher than mismatched percentage ', async () => {
          const options: CompareSnapshotOptions = {
            ...baseCompareOptions,
            screenshotAbsolutePath: absolutePathMod,
            specName: '',
            errorThreshold: 1
          }
          const result = await compareSnapshots(options)
          expect(result.percentage).toBeGreaterThan(0)
          expect(result.mismatchedPixels).toBeGreaterThan(0)
          const isDiffGenerated = existsSync(diffFilePath)
          expect(isDiffGenerated).toBe(false)
        })

        it('should generate a diff image if generateDiff is set to always', async () => {
          const options: CompareSnapshotOptions = {
            ...baseCompareOptions,
            specName: '',
            screenshotAbsolutePath: absolutePathMod,
            errorThreshold: 0,
            generateDiff: 'always'
          }
          const result = await compareSnapshots(options)
          expect(result.percentage).toBeGreaterThan(0)
          expect(result.mismatchedPixels).toBeGreaterThan(0)
          const isDiffGenerated = existsSync(diffFilePath)
          expect(isDiffGenerated).toBe(true)
        })
      })
    })
  })
})
