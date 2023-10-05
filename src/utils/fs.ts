// TODO: I think this file is useless since we already have a native fs.mkdir and the only thing that we are doing here is adding a logger.debug
import fs from 'fs/promises'
import { logger } from '../logger'

/**
 * Creates a new folder at the specified path.
 *
 * @param {string} folderPath - The path where the new folder should be created.
 * @returns {Promise<boolean>} A Promise that resolves with a boolean indicating whether the operation was successful (true) or not (false).
 */
// todo: we are always returning true , we should take care about errors and return false if something goes wrong (add try /catch)
export const createFolder = async (folderPath: string): Promise<boolean> => {
  await fs.mkdir(folderPath, { recursive: true })
  logger.debug(`Created folder at '${folderPath}'`)
  return true
}
