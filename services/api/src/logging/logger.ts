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
 * Correlation context for tracking related log entries
 */
export interface LogContext {
  correlationId?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
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
 * Performance metrics for structured logging
 */
export interface PerformanceMetrics {
  startTime: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

/**
 * Error information for structured logging
 */
export interface ErrorInfo {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  stack?: string;
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
 * Structured Logger Wrapper
 *
 * Provides a high-level abstraction over Winston for consistent,
 * structured logging with context management and fluent API.
 *
 * Features:
 * - Context binding (correlation IDs, request IDs, user IDs)
 * - Performance metrics tracking
 * - Structured metadata support
 * - Fluent method chaining
 * - Child logger creation with inherited context
 *
 * @example
 * const logger = new StructuredLogger();
 * logger
 *   .withCorrelationId('req-123')
 *   .withUserId('user-456')
 *   .info('User action performed', { action: 'login' });
 *
 * @example
 * const logger = new StructuredLogger();
 * logger.withTimer().startTimer();
 * // ... some operation
 * logger.info('Operation completed'); // Will include duration
 */
export class StructuredLogger {
  private winstonLogger: winston.Logger;
  private context: LogContext = {};
  private metrics: PerformanceMetrics | null = null;

  constructor(winstonLogger?: winston.Logger) {
    this.winstonLogger = winstonLogger || getLogger();
  }

  /**
   * Set correlation ID for tracking related operations
   */
  withCorrelationId(id: string): this {
    this.context.correlationId = id;
    return this;
  }

  /**
   * Set request ID for HTTP request tracking
   */
  withRequestId(id: string): this {
    this.context.requestId = id;
    return this;
  }

  /**
   * Set user ID for audit logging
   */
  withUserId(id: string): this {
    this.context.userId = id;
    return this;
  }

  /**
   * Set session ID for session tracking
   */
  withSessionId(id: string): this {
    this.context.sessionId = id;
    return this;
  }

  /**
   * Set trace ID for distributed tracing
   */
  withTraceId(id: string): this {
    this.context.traceId = id;
    return this;
  }

  /**
   * Initialize timer for performance metrics
   */
  withTimer(): this {
    this.metrics = { startTime: Date.now() };
    return this;
  }

  /**
   * Start the performance timer
   */
  startTimer(): this {
    if (!this.metrics) {
      this.metrics = { startTime: Date.now() };
    } else {
      this.metrics.startTime = Date.now();
    }
    return this;
  }

  /**
   * Get elapsed time in milliseconds
   */
  private getElapsedTime(): number {
    if (!this.metrics) return 0;
    return Date.now() - this.metrics.startTime;
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, metadata?: LogMetadata): this {
    this.log('debug', message, metadata);
    return this;
  }

  /**
   * Log at INFO level
   */
  info(message: string, metadata?: LogMetadata): this {
    this.log('info', message, metadata);
    return this;
  }

  /**
   * Log at WARN level
   */
  warn(message: string, metadata?: LogMetadata): this {
    this.log('warn', message, metadata);
    return this;
  }

  /**
   * Log at ERROR level with error details
   */
  error(message: string, error?: Error | ErrorInfo | string, metadata?: LogMetadata): this {
    let errorInfo: ErrorInfo | undefined;

    if (!error) {
      errorInfo = undefined;
    } else if (typeof error === 'string') {
      errorInfo = { message: error };
    } else if (error instanceof Error) {
      errorInfo = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        statusCode: (error as any).statusCode,
      };
    } else {
      errorInfo = error as ErrorInfo;
    }

    this.log('error', message, {
      ...metadata,
      error: errorInfo,
    });
    return this;
  }

  /**
   * Core logging method with context merging
   */
  private log(
    level: string,
    message: string,
    metadata?: LogMetadata,
  ): void {
    const duration = this.metrics ? this.getElapsedTime() : undefined;

    const enrichedMetadata: LogMetadata = {
      ...this.context,
      ...metadata,
      ...(duration !== undefined && { duration }),
    };

    this.winstonLogger.log(level, message, enrichedMetadata);

    // Reset metrics after logging
    if (this.metrics) {
      this.metrics = null;
    }
  }

  /**
   * Create a child logger inheriting current context
   */
  child(): StructuredLogger {
    const child = new StructuredLogger(this.winstonLogger);
    child.context = { ...this.context };
    return child;
  }

  /**
   * Clear all context information
   */
  clearContext(): this {
    this.context = {};
    return this;
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): this {
    this.metrics = null;
    return this;
  }

  /**
   * Get current context for debugging
   */
  getContext(): LogContext {
    return { ...this.context };
  }

  /**
   * Set entire context at once
   */
  setContext(context: LogContext): this {
    this.context = { ...context };
    return this;
  }
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

/**
 * Create a new StructuredLogger instance
 */
export function createStructuredLogger(): StructuredLogger {
  return new StructuredLogger();
}

/**
 * Default structured logger instance
 */
export const structuredLogger = new StructuredLogger();

export default logger;
