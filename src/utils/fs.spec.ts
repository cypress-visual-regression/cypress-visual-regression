import { createFolder } from './fs.js'
import { describe, afterAll, test, expect } from 'vitest'
import fs from 'fs'

describe('utils/fs module', () => {
  describe('createFolder', () => {
    afterAll(() => {
      // todo: we are physically creating a folder called "url-path", we should mock the creation of the folder since this is a unit test
      fs.rmdir('url-path', (error) => {
        if (error != null) throw error
      })
    })

    test('should return true if success', async () => {
      const result = await createFolder('url-path')
      expect(result).to.be.equal(true)
    })

    test('should throw if failing', async () => {
      try {
        // todo: we are physically creating a folder called "url*path", we should mock the creation of the folder since this is a unit test
        await createFolder('url*path')
      } catch (e: any) {
        expect(e.message).to.be.contain('ENOENT: no such file or directory')
      }
    })
    // todo: it looks to me that the shape of createFolder has been changed , because right now it only includes one parameter, so failSilently parámeteris missing
    test('should return false if failing and failSilently is set to true', async () => {
      const result = await createFolder('url*path')
      expect(result).to.be.equal(false)
    })
  })
})
