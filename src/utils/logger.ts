import { createLogger, format, transports } from 'winston'

const logger = createLogger({
  level: 'info',
  format: format.combine(format.splat(), format.json()),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
})
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.timestamp({
          format: 'YY-MM-DD HH:mm:ss'
        }),
        format.label({
          label: '[LOGGER]'
        }),
        format.simple(),
        format.printf((msg) =>
          format
            .colorize()
            .colorize(msg.level, `${msg.timestamp as string} - ${msg.label as string}: ${msg.message as string}`)
        )
      )
    })
  )
}

export { logger }
