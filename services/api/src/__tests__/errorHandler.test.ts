/**
 * Unit tests for errorHandler middleware
 *
 * Covers:
 * - AppError, ValidationError, NotFoundError, UnauthorizedError classes
 * - createErrorResponse() structure
 * - errorHandlerMiddleware() status code mapping
 * - asyncHandler() async error propagation
 * - notFoundMiddleware() 404 handling
 */

import { jest } from '@jest/globals';
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
} from '../middleware/errorHandler.js';
import type { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockLogger() {
  return {
    withRequestId: jest.fn().mockReturnThis(),
    withCorrelationId: jest.fn().mockReturnThis(),
    error: jest.fn().mockReturnThis(),
  };
}

function makeMockReq(overrides: Record<string, any> = {}): Request & {
  requestId?: string;
  correlationId?: string;
  logger?: ReturnType<typeof makeMockLogger>;
} {
  return {
    path: '/test',
    method: 'GET',
    requestId: 'req-123',
    correlationId: 'corr-456',
    logger: makeMockLogger(),
    ...overrides,
  } as any;
}

function makeMockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res as Response & { status: jest.Mock; json: jest.Mock; set: jest.Mock };
}

function makeMockNext(): jest.Mock {
  return jest.fn();
}

// ---------------------------------------------------------------------------
// AppError
// ---------------------------------------------------------------------------

describe('AppError', () => {
  it('should set message correctly', () => {
    const err = new AppError('Something went wrong');
    expect(err.message).toBe('Something went wrong');
  });

  it('should default to INTERNAL_ERROR code', () => {
    const err = new AppError('Oops');
    expect(err.code).toBe(ErrorCode.INTERNAL_ERROR);
  });

  it('should default to 500 status code', () => {
    const err = new AppError('Oops');
    expect(err.statusCode).toBe(500);
  });

  it('should accept a custom error code', () => {
    const err = new AppError('Not found', ErrorCode.NOT_FOUND);
    expect(err.code).toBe(ErrorCode.NOT_FOUND);
    expect(err.statusCode).toBe(404);
  });

  it('should accept custom statusCode and details', () => {
    const details = { field: 'email' };
    const err = new AppError('Bad request', ErrorCode.BAD_REQUEST, 400, details);
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual(details);
  });

  it('should be an instance of Error', () => {
    const err = new AppError('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('should set name to AppError', () => {
    const err = new AppError('test');
    expect(err.name).toBe('AppError');
  });

  it('should be instanceof AppError after prototype fix', () => {
    const err = new AppError('test');
    expect(err).toBeInstanceOf(AppError);
  });
});

// ---------------------------------------------------------------------------
// ValidationError
// ---------------------------------------------------------------------------

describe('ValidationError', () => {
  it('should have statusCode 400', () => {
    const err = new ValidationError('Invalid input');
    expect(err.statusCode).toBe(400);
  });

  it('should have VALIDATION_ERROR code', () => {
    const err = new ValidationError('Invalid input');
    expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('should accept details', () => {
    const details = { field: 'name', reason: 'required' };
    const err = new ValidationError('Validation failed', details);
    expect(err.details).toEqual(details);
  });

  it('should be an instance of AppError', () => {
    const err = new ValidationError('test');
    expect(err).toBeInstanceOf(AppError);
  });

  it('should set name to ValidationError', () => {
    const err = new ValidationError('test');
    expect(err.name).toBe('ValidationError');
  });
});

// ---------------------------------------------------------------------------
// NotFoundError
// ---------------------------------------------------------------------------

describe('NotFoundError', () => {
  it('should have statusCode 404', () => {
    const err = new NotFoundError('Resource not found');
    expect(err.statusCode).toBe(404);
  });

  it('should have NOT_FOUND code', () => {
    const err = new NotFoundError('Resource not found');
    expect(err.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('should accept details', () => {
    const details = { id: 42 };
    const err = new NotFoundError('Not found', details);
    expect(err.details).toEqual(details);
  });

  it('should be an instance of AppError', () => {
    const err = new NotFoundError('test');
    expect(err).toBeInstanceOf(AppError);
  });

  it('should set name to NotFoundError', () => {
    const err = new NotFoundError('test');
    expect(err.name).toBe('NotFoundError');
  });
});

// ---------------------------------------------------------------------------
// UnauthorizedError
// ---------------------------------------------------------------------------

describe('UnauthorizedError', () => {
  it('should have statusCode 401', () => {
    const err = new UnauthorizedError('Unauthorized');
    expect(err.statusCode).toBe(401);
  });

  it('should have UNAUTHORIZED code', () => {
    const err = new UnauthorizedError('Unauthorized');
    expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('should accept details', () => {
    const details = { reason: 'invalid token' };
    const err = new UnauthorizedError('Unauthorized', details);
    expect(err.details).toEqual(details);
  });

  it('should be an instance of AppError', () => {
    const err = new UnauthorizedError('test');
    expect(err).toBeInstanceOf(AppError);
  });

  it('should set name to UnauthorizedError', () => {
    const err = new UnauthorizedError('test');
    expect(err.name).toBe('UnauthorizedError');
  });
});

// ---------------------------------------------------------------------------
// createErrorResponse
// ---------------------------------------------------------------------------

describe('createErrorResponse', () => {
  it('should return error object with message', () => {
    const err = new AppError('Test error');
    const response = createErrorResponse(err);
    expect(response.error.message).toBe('Test error');
  });

  it('should include the error code', () => {
    const err = new ValidationError('Bad input');
    const response = createErrorResponse(err);
    expect(response.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('should include the statusCode', () => {
    const err = new NotFoundError('Not here');
    const response = createErrorResponse(err);
    expect(response.error.statusCode).toBe(404);
  });

  it('should include requestId when provided', () => {
    const err = new AppError('Error');
    const response = createErrorResponse(err, 'my-request-id');
    expect(response.error.requestId).toBe('my-request-id');
  });

  it('should include path when provided', () => {
    const err = new AppError('Error');
    const response = createErrorResponse(err, undefined, '/api/players');
    expect(response.error.path).toBe('/api/players');
  });

  it('should include timestamp as ISO string', () => {
    const err = new AppError('Error');
    const response = createErrorResponse(err);
    expect(response.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should include details when present on AppError', () => {
    const details = { field: 'email' };
    const err = new ValidationError('Invalid', details);
    const response = createErrorResponse(err);
    expect(response.error.details).toEqual(details);
  });

  it('should not include details when absent', () => {
    const err = new AppError('Error');
    const response = createErrorResponse(err);
    expect(response.error.details).toBeUndefined();
  });

  it('should wrap a generic Error as INTERNAL_ERROR', () => {
    const err = new Error('Unexpected failure');
    const response = createErrorResponse(err);
    expect(response.error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(response.error.statusCode).toBe(500);
  });

  it('should not include stack in production environment', () => {
    const err = new AppError('Error');
    const response = createErrorResponse(err, undefined, undefined, {
      includeStack: true,
      logDetails: true,
      environment: 'production',
    });
    expect((response.error as any).stack).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// errorHandlerMiddleware
// ---------------------------------------------------------------------------

describe('errorHandlerMiddleware', () => {
  it('should use AppError statusCode for AppError instances', () => {
    const middleware = errorHandlerMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    const next = makeMockNext();
    const err = new NotFoundError('Not here');

    middleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should use 500 for generic Error instances', () => {
    const middleware = errorHandlerMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    const next = makeMockNext();
    const err = new Error('Unexpected');

    middleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should use 400 for ValidationError', () => {
    const middleware = errorHandlerMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    const next = makeMockNext();
    const err = new ValidationError('Bad input');

    middleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should use 401 for UnauthorizedError', () => {
    const middleware = errorHandlerMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    const next = makeMockNext();
    const err = new UnauthorizedError('Unauthorized');

    middleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should call res.json with structured error response', () => {
    const middleware = errorHandlerMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    const next = makeMockNext();
    const err = new AppError('Test error');

    middleware(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Test error',
          statusCode: 500,
        }),
      }),
    );
  });

  it('should use requestId from req.requestId', () => {
    const middleware = errorHandlerMiddleware();
    const req = makeMockReq({ requestId: 'my-req-id' });
    const res = makeMockRes();
    const err = new AppError('Error');

    middleware(err, req, res, makeMockNext());

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.error.requestId).toBe('my-req-id');
  });

  it('should fall back to correlationId when requestId is absent', () => {
    const middleware = errorHandlerMiddleware();
    const req = makeMockReq({ requestId: undefined, correlationId: 'corr-789' });
    const res = makeMockRes();
    const err = new AppError('Error');

    middleware(err, req, res, makeMockNext());

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.error.requestId).toBe('corr-789');
  });

  it('should use the req.logger when provided', () => {
    const middleware = errorHandlerMiddleware();
    const mockLogger = makeMockLogger();
    const req = makeMockReq({ logger: mockLogger });
    const res = makeMockRes();
    const err = new AppError('Error');

    middleware(err, req, res, makeMockNext());

    expect(mockLogger.error).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// asyncHandler
// ---------------------------------------------------------------------------

describe('asyncHandler', () => {
  it('should call the wrapped async function', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);
    const req = makeMockReq() as unknown as Request;
    const res = makeMockRes() as unknown as Response;
    const next = makeMockNext();

    handler(req, res, next);
    await Promise.resolve(); // flush microtasks

    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it('should forward async errors to next()', async () => {
    const asyncError = new Error('Async failure');
    const fn = jest.fn().mockRejectedValue(asyncError);
    const handler = asyncHandler(fn);
    const req = makeMockReq() as unknown as Request;
    const res = makeMockRes() as unknown as Response;
    const next = makeMockNext();

    handler(req, res, next);
    await new Promise(resolve => setTimeout(resolve, 0)); // flush promise queue

    expect(next).toHaveBeenCalledWith(asyncError);
  });

  it('should not call next() when the async function resolves successfully', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const handler = asyncHandler(fn);
    const req = makeMockReq() as unknown as Request;
    const res = makeMockRes() as unknown as Response;
    const next = makeMockNext();

    handler(req, res, next);
    await Promise.resolve();

    expect(next).not.toHaveBeenCalled();
  });

  it('should forward AppError subclasses to next()', async () => {
    const appError = new ValidationError('Bad field');
    const fn = jest.fn().mockRejectedValue(appError);
    const handler = asyncHandler(fn);
    const next = makeMockNext();

    handler(makeMockReq() as any, makeMockRes() as any, next);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(next).toHaveBeenCalledWith(appError);
  });
});

// ---------------------------------------------------------------------------
// notFoundMiddleware
// ---------------------------------------------------------------------------

describe('notFoundMiddleware', () => {
  it('should call next() with a NotFoundError', () => {
    const middleware = notFoundMiddleware();
    const req = makeMockReq({ path: '/unknown', method: 'GET' }) as unknown as Request;
    const res = makeMockRes() as unknown as Response;
    const next = makeMockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it('should create error with 404 statusCode', () => {
    const middleware = notFoundMiddleware();
    const req = makeMockReq({ path: '/missing', method: 'DELETE' }) as unknown as Request;
    const res = makeMockRes() as unknown as Response;
    const next = makeMockNext();

    middleware(req, res, next);

    const error: NotFoundError = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });

  it('should include method and path in error message', () => {
    const middleware = notFoundMiddleware();
    const req = makeMockReq({ path: '/no-such-route', method: 'POST' }) as unknown as Request;
    const res = makeMockRes() as unknown as Response;
    const next = makeMockNext();

    middleware(req, res, next);

    const error: NotFoundError = next.mock.calls[0][0];
    expect(error.message).toContain('POST');
    expect(error.message).toContain('/no-such-route');
  });

  it('should include method and path in error details', () => {
    const middleware = notFoundMiddleware();
    const req = makeMockReq({ path: '/gone', method: 'PUT' }) as unknown as Request;
    const res = makeMockRes() as unknown as Response;
    const next = makeMockNext();

    middleware(req, res, next);

    const error: NotFoundError = next.mock.calls[0][0];
    expect(error.details).toEqual({ method: 'PUT', path: '/gone' });
  });
});
