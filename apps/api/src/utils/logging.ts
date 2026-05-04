import winston from 'winston'

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
)

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: process.env.AWS_LAMBDA_FUNCTION_NAME ?? 'ridelogger-api' },
  transports: [new winston.transports.Console()],
})

export default logger
