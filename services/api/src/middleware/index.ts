/**
 * Middleware Module
 *
 * Centralized exports for all Express middleware functions and utilities.
 */

export {
  errorHandlerMiddleware,
  notFoundMiddleware,
  asyncHandler,
  createErrorResponse,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ErrorCode,
  type ApiErrorResponse,
  type ErrorHandlerConfig,
} from './errorHandler';

export { rateLimitMiddleware, type RateLimitConfig } from './rateLimit';
