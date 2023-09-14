import { createFolder } from './fs'
import { describe, afterAll, test, expect } from 'vitest'
import fs from 'fs'

describe('utils/fs module', () => {
  describe('createFolder', () => {
    afterAll(() => {
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
        await createFolder('url*path')
      } catch (e: any) {
        expect(e.message).to.be.contain('ENOENT: no such file or directory')
      }
    })

    test('should return false if failing and failSilently is set to true', async () => {
      const result = await createFolder('url*path', true)
      expect(result).to.be.equal(false)
    })
  })
})
