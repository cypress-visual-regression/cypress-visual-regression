type ErrorOptions = Record<string, string | number>

class CompareSnapshotsPluginError extends Error {
  constructor(error: ErrorOptions) {
    super(error.message as string)
    Object.getOwnPropertyNames(error).forEach((prop) => {
      // @ts-expect-error  - we know that the error object has the prop
      this[prop] = error[prop]
    })
  }
}

const deserializeError = (error: string): Error => new CompareSnapshotsPluginError(JSON.parse(error))

const getValueOrDefault = (value: string | undefined, defaultValue: string): string => value ?? defaultValue

export { deserializeError, getValueOrDefault }
