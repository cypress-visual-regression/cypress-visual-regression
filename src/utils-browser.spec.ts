import { deserializeError } from './utils-browser'

describe('deserializeError', () => {
  it('should deserialize an error', () => {
    const error = {
      message: 'error message',
      stack: 'error stack'
    }
    const deserializedError = deserializeError(JSON.stringify(error))

    expect(deserializedError.toString()).toEqual('Error: error message')
  })
})
