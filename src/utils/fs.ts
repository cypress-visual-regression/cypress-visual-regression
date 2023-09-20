import fs from 'fs/promises'
import { logger } from '../logger'

/**
 * Creates a new folder at the specified path.
 *
 * @param {string} folderPath - The path where the new folder should be created.
 * @returns {Promise<boolean>} A Promise that resolves with a boolean indicating whether the operation was successful (true) or not (false).
 */
export const createFolder = async (folderPath: string): Promise<boolean> => {
  await fs.mkdir(folderPath, { recursive: true })
  logger.debug(`Created folder at '${folderPath}'`)
  return true
}
