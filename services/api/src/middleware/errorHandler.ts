/**
 * Error Handler Middleware
 *
 * Provides comprehensive error handling for Express applications with:
 * - Standardized error response format
 * - HTTP status code mapping
 * - Error logging with structured context
 * - Validation error handling
 * - Request tracking through correlationId
 *
 * @module middleware/errorHandler
 */

import { Request, Response, NextFunction } from 'express';
import { structuredLogger, StructuredLogger } from '../logging/logger';

/**
 * Standardized API error response format
 */
export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    requestId?: string;
    timestamp: string;
    details?: Record<string, unknown>;
    path?: string;
  };
}

/**
 * Supported error codes for consistent client handling
 */
export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  BAD_REQUEST = 'BAD_REQUEST',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Mapping from error codes to HTTP status codes
 */
const ERROR_CODE_TO_STATUS: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.CACHE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
};

/**
 * Custom application error with structured information
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    public statusCode: number = ERROR_CODE_TO_STATUS[code],
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error helper
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error helper
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.NOT_FOUND, 404, details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Unauthorized error helper
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.UNAUTHORIZED, 401, details);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Configuration for error handler behavior
 */
export interface ErrorHandlerConfig {
  includeStack: boolean;
  logDetails: boolean;
  environment: 'development' | 'production' | 'test';
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: Error | AppError,
  requestId?: string,
  path?: string,
  config: ErrorHandlerConfig = {
    includeStack: true,
    logDetails: true,
    environment: process.env.NODE_ENV as any || 'development',
  },
): ApiErrorResponse {
  const appError = error instanceof AppError ? error : createAppError(error);

  return {
    error: {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      requestId,
      timestamp: new Date().toISOString(),
      path,
      ...(appError.details && { details: appError.details }),
      ...(config.includeStack && config.environment === 'development' && { stack: error.stack }),
    },
  };
}

/**
 * Convert unknown error to AppError
 */
function createAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message);
    }

    if (error.name === 'SyntaxError') {
      return new ValidationError('Invalid request format', { originalMessage: error.message });
    }

    // Default to internal error
    return new AppError(
      error.message || 'An unexpected error occurred',
      ErrorCode.INTERNAL_ERROR,
      500,
    );
  }

  // Handle non-Error objects
  return new AppError(
    'An unexpected error occurred',
    ErrorCode.INTERNAL_ERROR,
    500,
    { originalError: String(error) },
  );
}

/**
 * Request context for error handling
 */
interface ErrorHandlerRequest extends Request {
  requestId?: string;
  correlationId?: string;
  logger?: StructuredLogger;
}

/**
 * Standardized Error Handler Middleware
 *
 * Should be registered as the last middleware in the Express app.
 * Handles all errors uniformly with structured logging and response formatting.
 *
 * @example
 * app.use(errorHandlerMiddleware());
 *
 * @param config - Error handler configuration
 */
export function errorHandlerMiddleware(
  config: Partial<ErrorHandlerConfig> = {},
) {
  const finalConfig: ErrorHandlerConfig = {
    includeStack: true,
    logDetails: true,
    environment: (process.env.NODE_ENV as any) || 'development',
    ...config,
  };

  return (err: Error | AppError, req: ErrorHandlerRequest, res: Response, next: NextFunction) => {
    const requestId = req.requestId || req.correlationId || 'unknown';
    const path = req.path;

    // Create error response
    const errorResponse = createErrorResponse(err, requestId, path, finalConfig);

    // Log error with structured logger
    const logger = req.logger || structuredLogger;
    logger
      .withRequestId(requestId)
      .withCorrelationId(req.correlationId)
      .error(
        `Request error: ${errorResponse.error.message}`,
        err instanceof Error ? err : new Error(String(err)),
        {
          path,
          method: req.method,
          statusCode: errorResponse.error.statusCode,
          code: errorResponse.error.code,
          ...(finalConfig.logDetails && errorResponse.error.details && {
            details: errorResponse.error.details,
          }),
        },
      );

    // Send error response
    res.status(errorResponse.error.statusCode).json(errorResponse);
  };
}

/**
 * Async error wrapper for Express route handlers
 *
 * Wraps async route handlers to catch errors and pass them to error handler
 * middleware automatically.
 *
 * @example
 * app.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await db.getUser(req.params.id);
 *   res.json(user);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found middleware
 *
 * Should be registered after all other routes.
 * Handles requests to undefined routes.
 *
 * @example
 * app.use(notFoundMiddleware());
 */
export function notFoundMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const error = new NotFoundError(
      `Route not found: ${req.method} ${req.path}`,
      { method: req.method, path: req.path },
    );
    next(error);
  };
}

export default errorHandlerMiddleware;
