import fs from 'fs/promises'
import { serializeError } from 'serialize-error'
import { Logger } from '../logger'

const log = Logger('utils:fs')

/**
 * Creates a new folder at the specified path.
 *
 * @param {string} folderPath - The path where the new folder should be created.
 * @param [failSilently=false] - If true, any errors are logged but not rethrown.
 * @returns {Promise<boolean>} A Promise that resolves with a boolean indicating whether the operation was successful (true) or not (false).
 */
export const createFolder = async (folderPath: string, failSilently = false): Promise<boolean> => {
  try {
    await fs.mkdir(folderPath, { recursive: true })
    log(`Created folder at '${folderPath}'`)
    return true
  } catch (error) {
    if (failSilently) {
      log(`Failed to create folder '${folderPath}' with error:`, serializeError(error))
      return false
    }
    throw error
  }
}
