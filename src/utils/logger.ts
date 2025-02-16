import chalk, { type Chalk } from 'chalk'
import { inspect } from 'util'

const logLevelKeys = {
  debug: 3,
  info: 2,
  warn: 1,
  error: 0
}

const isLogLevel = (level: string): boolean => {
  return level in logLevelKeys
}

const logLevel = (): number => {
  const envLevel = isLogLevel(process.env.visual_regression_log ?? '')
    ? (process.env.visual_regression_log ?? 'error')
    : 'error'
  return logLevelKeys[envLevel as keyof typeof logLevelKeys]
}

const format = (colorFormat: Chalk, messages: unknown[]): void => {
  for (const msg of messages) {
    if (typeof msg === 'string') {
      console.log(colorFormat(msg))
    } else {
      console.log(
        colorFormat(
          inspect(msg, {
            showHidden: false,
            customInspect: false,
            colors: true,
            depth: null,
            maxArrayLength: Infinity
          })
        )
      )
    }
  }
}

const printDate = (colorFormat: Chalk): void => {
  console.log(colorFormat(`LOGGER [${new Date().toISOString()}]`))
}

const error = (...messages: unknown[]): void => {
  if (logLevel() < logLevelKeys.error) return
  printDate(chalk.redBright.bold)
  format(chalk.redBright, messages)
}

const warn = (...messages: unknown[]): void => {
  if (logLevel() < logLevelKeys.warn) return
  printDate(chalk.yellow.bold)
  format(chalk.yellowBright, messages)
}

const info = (...messages: unknown[]): void => {
  if (logLevel() < logLevelKeys.info) return
  printDate(chalk.blue.bold)
  format(chalk.blueBright, messages)
}

const debug = (...messages: unknown[]): void => {
  if (logLevel() < logLevelKeys.debug) return
  printDate(chalk.magenta.bold)
  format(chalk.magenta, messages)
}

const always = (...messages: unknown[]): void => {
  printDate(chalk.grey.bold)
  format(chalk.greenBright, messages)
}

const logger = {
  error,
  warn,
  info,
  debug,
  always,
  logLevel
}

export { logger }
