import * as command from './command'
import { expect } from 'vitest'

const log: any = {
  set: function (property: string, value: string) {
    this.property = property
    this.value = value
  },
  property: null,
  value: null
}

global.Cypress = {
  env(name: string) {
    if (name === 'visualRegressionType') return 'base'
    return undefined
  },
  spec: {
    name: 'spec.cy.ts',
    absolute: 'unneeded/absolute/path/spec.cy.ts',
    relative: 'cypress/e2e/sub-folder/spec.cy.ts'
  },
  log: function (..._args) {
    return log
  }
}

global.cy = {
  get: vi.fn().mockReturnThis(),
  screenshot: vi.fn(async (..._args) => {
    return 1
  }),
  task: vi.fn(async (..._args): Promise<unknown> => {
    return {
      baseUpdated: true
    }
  })
}

describe('command', () => {
  describe('addCompareSnapshotCommand', () => {
    describe('should work', () => {
      it('should work', async function () {
        const addCommandSpy = vi.spyOn(command, 'addCommand')
        const logSpy = vi.spyOn(Cypress, 'log')
        const options = {
          capture: 'fullPage',
          errorThreshold: 1
        }
        expect(log.property).to.equal(null)
        expect(log.value).to.be.equal(null)
        command.addCommand(Cypress, cy, 'a', 'name', {}, options)
        expect(addCommandSpy.mock.calls.length).to.be.equal(1)
        const result = await addCommandSpy.mock.results[0].value
        expect(result.baseUpdated).to.equal(true)
        const result2 = await logSpy.mock.results[0].value
        expect(result2).to.deep.equal(log)
        expect(log.property).to.equal('type')
        expect(log.value).to.equal('child')
      })

      it('should throw error if snapshot name is missing', async function () {
        const options = {
          capture: 'fullPage',
          errorThreshold: 1
        }
        try {
          command.addCommand(Cypress, cy, null, undefined, {}, options)
        } catch (error: any) {
          expect(error.message).to.equal('Snapshot name must be specified')
        }
      })

      it('should throw error if type parameter is missing', async function () {
        const Cypress: any = {
          env(_name: string) {
            return undefined
          }
        }
        const options = {
          capture: 'fullPage',
          errorThreshold: 1
        }
        try {
          command.addCommand(Cypress, cy, null, 'name', {}, options)
        } catch (error: any) {
          expect(error.message).to.equal(
            "The 'type' environment variable is missing. Expected values: 'regression' or 'base'"
          )
        }
      })
    })
  })
})
