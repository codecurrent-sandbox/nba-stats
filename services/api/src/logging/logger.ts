import winston from 'winston';
import { Format } from 'logform';

/**
 * Log levels used in the application
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

/**
 * Custom log metadata interface
 */
export interface LogMetadata {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  level: LogLevel;
  format?: 'json' | 'text';
  enableConsole?: boolean;
  enableFile?: boolean;
  filePath?: string;
  enableHttp?: boolean;
  httpEndpoint?: string;
}

/**
 * Create custom format for JSON logging
 */
const jsonFormat: Format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

/**
 * Create custom format for text logging (development)
 */
const textFormat: Format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    const metadataKeys = Object.keys(meta).filter(key => key !== 'timestamp' && key !== 'level' && key !== 'message');
    if (metadataKeys.length > 0) {
      const metaStr = JSON.stringify(meta, null, 2);
      log += `\n${metaStr}`;
    }
    
    return log;
  })
);

/**
 * Create and configure Winston logger
 */
export function createLogger(config: LoggerConfig): winston.Logger {
  const transports: winston.transport[] = [];

  // Console transport
  if (config.enableConsole !== false) {
    transports.push(
      new winston.transports.Console({
        format: config.format === 'json' ? jsonFormat : textFormat,
      })
    );
  }

  // File transport
  if (config.enableFile && config.filePath) {
    transports.push(
      new winston.transports.File({
        filename: config.filePath,
        format: jsonFormat, // Always use JSON for file logs
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      })
    );
  }

  // HTTP transport for centralized logging
  if (config.enableHttp && config.httpEndpoint) {
    transports.push(
      new winston.transports.Http({
        host: config.httpEndpoint,
        format: jsonFormat,
      })
    );
  }

  const logger = winston.createLogger({
    level: config.level,
    transports,
    exitOnError: false,
  });

  return logger;
}

/**
 * Default logger instance
 */
let defaultLogger: winston.Logger;

/**
 * Initialize the default logger
 */
export function initLogger(config: LoggerConfig): void {
  defaultLogger = createLogger(config);
}

/**
 * Get the default logger instance
 */
export function getLogger(): winston.Logger {
  if (!defaultLogger) {
    // Create a default logger if not initialized
    defaultLogger = createLogger({
      level: LogLevel.INFO,
      format: 'json',
      enableConsole: true,
    });
  }
  return defaultLogger;
}

/**
 * Structured logging helper functions
 */
export const logger = {
  error: (message: string, meta?: LogMetadata) => {
    getLogger().error(message, meta);
  },

  warn: (message: string, meta?: LogMetadata) => {
    getLogger().warn(message, meta);
  },

  info: (message: string, meta?: LogMetadata) => {
    getLogger().info(message, meta);
  },

  debug: (message: string, meta?: LogMetadata) => {
    getLogger().debug(message, meta);
  },

  trace: (message: string, meta?: LogMetadata) => {
    getLogger().log('trace', message, meta);
  },

  /**
   * Log HTTP request
   */
  http: (meta: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    requestId?: string;
  }) => {
    getLogger().info('HTTP Request', meta);
  },

  /**
   * Log database query
   */
  query: (meta: {
    query: string;
    duration: number;
    rows?: number;
  }) => {
    getLogger().debug('Database Query', meta);
  },

  /**
   * Log cache operation
   */
  cache: (operation: 'hit' | 'miss' | 'set' | 'del', key: string, meta?: any) => {
    getLogger().debug(`Cache ${operation}`, { key, ...meta });
  },
};

/**
 * Express middleware for request logging
 */
export function requestLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || generateRequestId();

    // Attach request ID to request object
    req.requestId = requestId;

    // Log request start
    logger.info('Request started', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      const duration = Date.now() - startTime;
      
      logger.http({
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        requestId,
      });

      originalEnd.apply(res, args);
    };

    next();
  };
}

/**
 * Express error logging middleware
 */
export function errorLoggingMiddleware() {
  return (err: Error, req: any, res: any, next: any) => {
    logger.error('Request error', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      error: err.message,
      stack: err.stack,
    });

    next(err);
  };
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default logger;
