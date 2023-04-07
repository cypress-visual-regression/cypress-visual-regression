import debug from 'debug'

// Wrap debug module to ensure common namespace
export function Logger(name: string): debug.Debugger {
  return debug(`cypress-visual-regression: ${name}`)
}
