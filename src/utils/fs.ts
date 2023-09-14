import fs from 'fs/promises'
import path from 'path'
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

/**
 * Moves a file from a source folder to a destination folder.
 *
 * @param {string} fileName - The name of the file to move.
 * @param {string} sourceFolder - The path to the source folder containing the file.
 * @param {string} destinationFolder - The path to the destination folder where the file will be moved to.
 * @returns {Promise<void>} A Promise that resolves when the file has been successfully moved or rejects with an error on failure.
 */
export const moveFile = async (fileName: string, sourceFolder: string, destinationFolder: string): Promise<void> => {
  try {
    const filePath = path.join(sourceFolder, fileName)
    await fs.access(filePath)

    // Check if destination folder exists
    try {
      await fs.access(destinationFolder)
    } catch (error) {
      // Create destination folder if it doesn't exist
      await createFolder(destinationFolder)
      log(`Created folder ${destinationFolder}`)
    }

    const destinationFilePath = path.join(destinationFolder, fileName)

    await fs.rename(filePath, destinationFilePath)
    log(`Moved ${filePath} to ${destinationFilePath}`)
  } catch (error) {
    log(
      `Unable to move ${path.join(sourceFolder, fileName)} to ${path.join(destinationFolder, fileName)}`,
      serializeError(error)
    )
  }
}
