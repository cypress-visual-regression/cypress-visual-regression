import { getValueOrDefault, deserializeError } from './utils-browser'

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

describe('getValueOrDefault', () => {
  it('should return the value if it is defined', () => {
    const value = 'value'
    const defaultValue = 'default'
    expect(getValueOrDefault(value, defaultValue)).toEqual(value)
  })

  it('should return the default value if the value is undefined', () => {
    const value = undefined
    const defaultValue = 'default'
    expect(getValueOrDefault(value, defaultValue)).toEqual(defaultValue)
  })
})
