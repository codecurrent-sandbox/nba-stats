/**
 * Unit Tests for Error Handler Middleware
 *
 * Tests the error handling middleware functionality including:
 * - Custom error classes
 * - Error response creation
 * - Error handler middleware behavior
 * - Async handler wrapper
 * - Not found middleware
 */

import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ErrorCode,
  createErrorResponse,
  errorHandlerMiddleware,
  asyncHandler,
  notFoundMiddleware,
} from '../errorHandler';

describe('Error Handler Middleware', () => {
  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      const error = new AppError('Test error');
      
      assert.strictEqual(error.message, 'Test error');
      assert.strictEqual(error.code, ErrorCode.INTERNAL_ERROR);
      assert.strictEqual(error.statusCode, 500);
      assert.strictEqual(error.name, 'AppError');
      assert.strictEqual(error.details, undefined);
    });

    it('should create an AppError with custom code and status', () => {
      const error = new AppError(
        'Not found',
        ErrorCode.NOT_FOUND,
        404,
        { resource: 'user' }
      );
      
      assert.strictEqual(error.message, 'Not found');
      assert.strictEqual(error.code, ErrorCode.NOT_FOUND);
      assert.strictEqual(error.statusCode, 404);
      assert.deepStrictEqual(error.details, { resource: 'user' });
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Test error');
      assert.ok(error instanceof Error);
      assert.ok(error instanceof AppError);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with correct defaults', () => {
      const error = new ValidationError('Invalid input');
      
      assert.strictEqual(error.message, 'Invalid input');
      assert.strictEqual(error.code, ErrorCode.VALIDATION_ERROR);
      assert.strictEqual(error.statusCode, 400);
      assert.strictEqual(error.name, 'ValidationError');
    });

    it('should include details when provided', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ValidationError('Invalid email', details);
      
      assert.deepStrictEqual(error.details, details);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with correct defaults', () => {
      const error = new NotFoundError('Resource not found');
      
      assert.strictEqual(error.message, 'Resource not found');
      assert.strictEqual(error.code, ErrorCode.NOT_FOUND);
      assert.strictEqual(error.statusCode, 404);
      assert.strictEqual(error.name, 'NotFoundError');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an UnauthorizedError with correct defaults', () => {
      const error = new UnauthorizedError('Access denied');
      
      assert.strictEqual(error.message, 'Access denied');
      assert.strictEqual(error.code, ErrorCode.UNAUTHORIZED);
      assert.strictEqual(error.statusCode, 401);
      assert.strictEqual(error.name, 'UnauthorizedError');
    });
  });

  describe('createErrorResponse', () => {
    it('should create a standardized error response from AppError', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      const response = createErrorResponse(error, 'req-123', '/api/users');
      
      assert.strictEqual(response.error.message, 'Invalid input');
      assert.strictEqual(response.error.code, ErrorCode.VALIDATION_ERROR);
      assert.strictEqual(response.error.statusCode, 400);
      assert.strictEqual(response.error.requestId, 'req-123');
      assert.strictEqual(response.error.path, '/api/users');
      assert.deepStrictEqual(response.error.details, { field: 'email' });
      assert.ok(response.error.timestamp);
    });

    it('should create error response from generic Error', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error, 'req-456');
      
      assert.strictEqual(response.error.message, 'Something went wrong');
      assert.strictEqual(response.error.code, ErrorCode.INTERNAL_ERROR);
      assert.strictEqual(response.error.statusCode, 500);
      assert.strictEqual(response.error.requestId, 'req-456');
    });

    it('should convert SyntaxError to ValidationError', () => {
      const error = new SyntaxError('Invalid JSON');
      const response = createErrorResponse(error);
      
      assert.strictEqual(response.error.code, ErrorCode.VALIDATION_ERROR);
      assert.strictEqual(response.error.statusCode, 400);
      assert.ok(response.error.message.includes('Invalid request format'));
    });

    it('should include stack trace in development mode', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error, 'req-123', '/test', {
        includeStack: true,
        logDetails: true,
        environment: 'development',
      });
      
      assert.ok(response.error.stack);
    });

    it('should exclude stack trace in production mode', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error, 'req-123', '/test', {
        includeStack: false,
        logDetails: true,
        environment: 'production',
      });
      
      assert.strictEqual(response.error.stack, undefined);
    });

    it('should handle non-Error objects', () => {
      const error = 'string error' as any;
      const response = createErrorResponse(error);
      
      assert.strictEqual(response.error.code, ErrorCode.INTERNAL_ERROR);
      assert.strictEqual(response.error.statusCode, 500);
      assert.ok(response.error.message);
    });
  });

  describe('errorHandlerMiddleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
      mockReq = {
        path: '/api/test',
        method: 'GET',
        requestId: 'req-123',
        correlationId: 'corr-456',
      };

      mockRes = {
        status: mock.fn((code: number) => mockRes),
        json: mock.fn((data: any) => mockRes),
      };

      mockNext = mock.fn();
    });

    it('should handle AppError and send proper response', () => {
      const middleware = errorHandlerMiddleware();
      const error = new ValidationError('Invalid input');
      
      middleware(error, mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockRes.status.mock.calls.length, 1);
      assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 400);
      assert.strictEqual(mockRes.json.mock.calls.length, 1);
      
      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.strictEqual(response.error.message, 'Invalid input');
      assert.strictEqual(response.error.code, ErrorCode.VALIDATION_ERROR);
      assert.strictEqual(response.error.statusCode, 400);
    });

    it('should handle generic Error', () => {
      const middleware = errorHandlerMiddleware();
      const error = new Error('Generic error');
      
      middleware(error, mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockRes.status.mock.calls.length, 1);
      assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 500);
      
      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.strictEqual(response.error.message, 'Generic error');
      assert.strictEqual(response.error.code, ErrorCode.INTERNAL_ERROR);
    });

    it('should use requestId from request', () => {
      const middleware = errorHandlerMiddleware();
      const error = new Error('Test error');
      
      middleware(error, mockReq, mockRes, mockNext);
      
      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.strictEqual(response.error.requestId, 'req-123');
    });

    it('should use correlationId when requestId is not available', () => {
      const middleware = errorHandlerMiddleware();
      const error = new Error('Test error');
      delete mockReq.requestId;
      
      middleware(error, mockReq, mockRes, mockNext);
      
      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.strictEqual(response.error.requestId, 'corr-456');
    });

    it('should respect custom configuration', () => {
      const middleware = errorHandlerMiddleware({
        includeStack: false,
        environment: 'production',
      });
      const error = new Error('Test error');
      
      middleware(error, mockReq, mockRes, mockNext);
      
      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.strictEqual(response.error.stack, undefined);
    });
  });

  describe('asyncHandler', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        json: mock.fn(),
      };
      mockNext = mock.fn();
    });

    it('should handle successful async operations', async () => {
      const handler = asyncHandler(async (req, res) => {
        res.json({ success: true });
      });
      
      await handler(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockRes.json.mock.calls.length, 1);
      assert.deepStrictEqual(mockRes.json.mock.calls[0].arguments[0], { success: true });
      assert.strictEqual(mockNext.mock.calls.length, 0);
    });

    it('should catch and forward errors to next', async () => {
      const error = new Error('Async error');
      const handler = asyncHandler(async (req, res) => {
        throw error;
      });
      
      await handler(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.calls.length, 1);
      assert.strictEqual(mockNext.mock.calls[0].arguments[0], error);
    });
  });

  describe('notFoundMiddleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
      mockReq = {
        method: 'GET',
        path: '/api/nonexistent',
      };
      mockRes = {};
      mockNext = mock.fn();
    });

    it('should create NotFoundError for undefined routes', () => {
      const middleware = notFoundMiddleware();
      
      middleware(mockReq, mockRes, mockNext);
      
      assert.strictEqual(mockNext.mock.calls.length, 1);
      const error = mockNext.mock.calls[0].arguments[0];
      
      assert.ok(error instanceof NotFoundError);
      assert.ok(error.message.includes('Route not found'));
      assert.ok(error.message.includes('GET'));
      assert.ok(error.message.includes('/api/nonexistent'));
      assert.strictEqual(error.statusCode, 404);
    });

    it('should include method and path in error details', () => {
      const middleware = notFoundMiddleware();
      
      middleware(mockReq, mockRes, mockNext);
      
      const error = mockNext.mock.calls[0].arguments[0];
      assert.deepStrictEqual(error.details, {
        method: 'GET',
        path: '/api/nonexistent',
      });
    });
  });
});
