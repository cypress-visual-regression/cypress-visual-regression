import { expect } from 'vitest'
import { createFolder } from './fs'

vi.mock('fs/promises')

describe('utils/fs module', () => {
  describe('createFolder', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should return true if success', async () => {
      const fs = await import('fs/promises')
      fs.mkdir = vi.fn().mockReturnValue(undefined)
      const result = await createFolder('url-path')
      expect(fs.mkdir).toHaveBeenCalled()
      expect(result).toEqual(true)
    })

    it('should throw if failing', async () => {
      const fs = await import('fs/promises')
      fs.mkdir = vi.fn().mockRejectedValue(new Error('mock error'))
      const promise = createFolder('url-path')
      expect(fs.mkdir).toHaveBeenCalled()
      await expect(promise).rejects.toEqual(new Error('mock error'))
    })

    it('should return false if failing and failSilently is set to true', async () => {
      const fs = await import('fs/promises')
      fs.mkdir = vi.fn().mockRejectedValue(new Error('mock error'))
      const result = await createFolder('url-path', true)
      expect(fs.mkdir).toHaveBeenCalled()
      expect(result).toEqual(false)
    })
  })
})
