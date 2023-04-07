import { mkdir } from 'fs/promises'
import { createReadStream, existsSync } from 'fs'

import { PNG } from 'pngjs'
import Debug from './debug'

const debug = Debug('utils')

export const adjustCanvas = (image: PNG, width: number, height: number): PNG => {
  if (image.width === width && image.height === height) {
    return image
  }

  const imageAdjustedCanvas = new PNG({
    width,
    height,
    inputHasAlpha: true
  })

  PNG.bitblt(image, imageAdjustedCanvas, 0, 0, image.width, image.height, 0, 0)

  return imageAdjustedCanvas
}

export const createFolder = async (folderPath: string, failSilently?: boolean): Promise<boolean> => {
  try {
    await mkdir(folderPath, { recursive: true })
    return true
  } catch (error) {
    if (failSilently ?? false) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      debug(`failing silently with error: ${error} `)
      return false
    }
    throw error
  }
}

export const parseImage = async (image: string): Promise<PNG> =>
  await new Promise((resolve, reject) => {
    if (!existsSync(image)) {
      reject(new Error(`Snapshot ${image} does not exist.`))
      return
    }
    const readStream = createReadStream(image)

    readStream
      .pipe(new PNG())
      .on('parsed', function () {
        resolve(this)
      })
      .on('error', (error) => {
        reject(error)
      })
  })

export const errorSerialize = (error: Record<string, unknown>): string =>
  JSON.stringify(
    Object.getOwnPropertyNames(error).reduce(
      (obj, prop) =>
        Object.assign(obj, {
          [prop]: error[prop]
        }),
      {}
    )
  )
