import * as trta from './command'
import type { ScreenshotOptions, TakeScreenshotProps } from './command'

const options: ScreenshotOptions = {
  capture: 'fullPage',
  errorThreshold: 1
}

const Cypress: Cypress.Cypress = {
  // @ts-expect-error fix
  env(name: string) {
    if (name === 'visualRegression') return undefined
    return name
  },
  // @ts-expect-error fix
  spec: {
    name: 'test'
  }
}

const mockObject: TakeScreenshotProps = {
  path: 'yes',
  size: 1,
  dimensions: { width: 100, height: 200 },
  multipart: true,
  takenAt: 'today',
  pixelRatio: 1,
  name: 'test',
  duration: 10,
  blackout: [],
  testAttemptIndex: 1
}
async function test1(_name: string, _options: object): Promise<TakeScreenshotProps> {
  return await Promise.resolve(mockObject)
}

// const cy: Cypress.cy = {
//   // @ts-expect-error fix
//   get(_subject: string) {
//     return this
//   },
//   // @ts-expect-error fix
//   screenshot: trt
// }
type PositionType =
  | 'topLeft'
  | 'top'
  | 'topRight'
  | 'left'
  | 'center'
  | 'right'
  | 'bottomLeft'
  | 'bottom'
  | 'bottomRight'
type ClickOptions = {
  force?: boolean
  timeout?: number
  // Other options...
}

const test2: Cypress.Chainable<Subject> = { path: 'yessss' }
global.cy = {
  get: vi.fn().mockReturnThis(),
  click: vi.fn((...args: any[]) => {
    if (args.length === 0) {
      // cy.click()
      return undefined
    } else if (args.length === 1 && typeof args[0] === 'object') {
      // cy.click(options)
      return undefined
    } else if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'object') {
      // cy.click(position, options)
      return undefined
    } else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number') {
      // cy.click(x, y)
      return undefined
    } else if (
      args.length === 3 &&
      typeof args[0] === 'number' &&
      typeof args[1] === 'number' &&
      typeof args[2] === 'object'
    ) {
      // cy.click(x, y, options)
      return undefined
    }
  }),
  screenshot: vi.fn(async (...args) => {
    return test2
  })
}

// vi.mock('cy')
// trt.mockImplementationOnce((): Promise<any> => Promise.resolve({ hello: 'world' }))
// const mockAxios = cy as Cypress.mocked<typeof Cypress>
// mockAxios.request.mockImplementationOnce((): Promise<any> => Promise.resolve({ hello: 'world' }))
// vi.stubGlobal('Cypress', Cypress)

describe('command', () => {
  describe('addCompareSnapshotCommand', () => {
    describe('should work', () => {
      it('should work', async function () {
        const addCommandSpy = vi.spyOn(trta, 'addCommand')
        console.log(Cypress)
        console.log(cy)
        console.log(options)
        trta.addCommand(Cypress, cy, 'a', 'name', undefined, options)
        expect(addCommandSpy.mock.calls.length).to.be.equal(0)
      })
    })
  })
})
