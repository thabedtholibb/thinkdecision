const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Create format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.printf(
    ({ timestamp, level, message, metadata }) => {
      let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      if (metadata && Object.keys(metadata).length > 0) {
        log += ` ${JSON.stringify(metadata)}`;
      }
      return log;
    }
  )
);

// Create logger
const logger = winston.createLogger({
  levels,
  format,
  defaultMeta: { service: 'think-decision-backend' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxDays: '14d',
      format: winston.format.uncolorize(),
    }),

    // Combined logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxDays: '14d',
      format: winston.format.uncolorize(),
    }),

    // Console logs (only in development)
    ...(process.env.NODE_ENV !== 'production'
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
        ]
      : []),
  ],
});

// Create specialized loggers
const getLogger = (category) => {
  return {
    info: (message, metadata = {}) =>
      logger.info(message, { ...metadata, category }),
    error: (message, error, metadata = {}) =>
      logger.error(message, { ...metadata, category, error: error?.message, stack: error?.stack }),
    warn: (message, metadata = {}) =>
      logger.warn(message, { ...metadata, category }),
    debug: (message, metadata = {}) =>
      logger.debug(message, { ...metadata, category }),
  };
};

// Specialized loggers
const apiLogger = getLogger('API');
const authLogger = getLogger('AUTH');
const dbLogger = getLogger('DATABASE');
const cacheLogger = getLogger('CACHE');
const errorLogger = getLogger('ERROR');

module.exports = {
  logger,
  getLogger,
  apiLogger,
  authLogger,
  dbLogger,
  cacheLogger,
  errorLogger,
};
