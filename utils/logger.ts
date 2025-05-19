import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { format } from 'winston';
import fs from 'fs';

// Custom format for console output
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Custom format for file output
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.json()
);
// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}


// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'smpp-server' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }),

    // Daily rotate file transport for all logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'smpp-server-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
      level: 'info'
    }),

    // Separate file for error logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
      level: 'error'
    }),

    // Separate file for SMPP protocol logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'smpp-protocol-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
      level: 'debug'
    })
  ]
});

// Add a stream object for Morgan integration
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Helper functions for common logging patterns
export const logHelpers = {
  // Log SMPP protocol messages
  smpp: (message: string, metadata?: Record<string, unknown>) => {
    logger.debug(message, { ...metadata, category: 'smpp-protocol' });
  },

  // Log message delivery events
  delivery: (message: string, metadata?: Record<string, unknown>) => {
    logger.info(message, { ...metadata, category: 'message-delivery' });
  },

  // Log authentication events
  auth: (message: string, metadata?: Record<string, unknown>) => {
    logger.info(message, { ...metadata, category: 'authentication' });
  },

  // Log connection events
  connection: (message: string, metadata?: Record<string, unknown>) => {
    logger.info(message, { ...metadata, category: 'connection' });
  },

  // Log error with stack trace
  error: (message: string, error?: Error, metadata?: Record<string, unknown>) => {
    logger.error(message, {
      ...metadata,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
};

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});