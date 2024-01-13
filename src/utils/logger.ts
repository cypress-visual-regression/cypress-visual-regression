import { createLogger, format, transports } from 'winston'

const logger = createLogger({
  silent: process.env.visualRegressionLogger ? false : true,
  level: 'info',
  format: format.combine(format.splat(), format.json()),
  transports: [
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
  ]
})

export { logger }
