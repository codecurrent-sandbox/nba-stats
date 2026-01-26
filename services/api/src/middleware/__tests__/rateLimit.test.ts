/**
 * Unit Tests for Rate Limit Middleware
 *
 * Tests the rate limiting middleware functionality including:
 * - RateLimitStore operations
 * - Rate limit middleware behavior
 * - Rate limit headers
 * - Custom configurations
 */

import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { rateLimitMiddleware, createRateLimiter } from '../rateLimit';

describe('Rate Limit Middleware', () => {
  describe('rateLimitMiddleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;
    let testCounter = 0;

    beforeEach(() => {
      // Use unique IP for each test to avoid interference from shared store
      testCounter++;
      mockReq = {
        ip: `127.0.0.${testCounter}`,
        path: '/api/test',
        socket: {
          remoteAddress: `127.0.0.${testCounter}`,
        },
      };

      mockRes = {
        set: mock.fn(),
        status: mock.fn((code: number) => mockRes),
        json: mock.fn((data: any) => mockRes),
      };

      mockNext = mock.fn();
    });

    it('should allow requests under the limit', () => {
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 5,
      });

      middleware(mockReq, mockRes, mockNext);

      assert.strictEqual(mockNext.mock.calls.length, 1);
      assert.strictEqual(mockRes.status.mock.calls.length, 0);
    });

    it('should set rate limit headers', () => {
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 10,
      });

      middleware(mockReq, mockRes, mockNext);

      assert.strictEqual(mockRes.set.mock.calls.length, 1);
      const headers = mockRes.set.mock.calls[0].arguments[0];
      
      assert.strictEqual(headers['X-RateLimit-Limit'], '10');
      assert.strictEqual(headers['X-RateLimit-Remaining'], '9');
      assert.ok(headers['X-RateLimit-Reset']);
    });

    it('should block requests over the limit', () => {
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
      });

      // First request - should pass
      middleware(mockReq, mockRes, mockNext);
      assert.strictEqual(mockNext.mock.calls.length, 1);

      // Second request - should pass
      middleware(mockReq, mockRes, mockNext);
      assert.strictEqual(mockNext.mock.calls.length, 2);

      // Third request - should be blocked
      middleware(mockReq, mockRes, mockNext);
      assert.strictEqual(mockRes.status.mock.calls.length, 1);
      assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 429);
    });

    it('should send error response when rate limit exceeded', () => {
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
      });

      // First request - should pass
      middleware(mockReq, mockRes, mockNext);

      // Reset mocks
      mockRes.set = mock.fn();
      mockRes.status = mock.fn((code: number) => mockRes);
      mockRes.json = mock.fn((data: any) => mockRes);

      // Second request - should be blocked
      middleware(mockReq, mockRes, mockNext);

      assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 429);
      const response = mockRes.json.mock.calls[0].arguments[0];
      
      assert.strictEqual(response.error.code, 'RATE_LIMITED');
      assert.strictEqual(response.error.statusCode, 429);
      assert.ok(response.error.message.includes('Too many requests'));
      assert.ok(response.error.retryAfter);
    });

    it('should set Retry-After header when rate limited', () => {
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
      });

      // First request
      middleware(mockReq, mockRes, mockNext);

      // Reset set mock
      mockRes.set = mock.fn();
      mockRes.status = mock.fn((code: number) => mockRes);
      mockRes.json = mock.fn((data: any) => mockRes);

      // Second request - should be blocked
      middleware(mockReq, mockRes, mockNext);

      // Check for Retry-After header
      const setCallsAfterLimit = mockRes.set.mock.calls;
      const retryAfterCall = setCallsAfterLimit.find((call: any) => 
        call.arguments[0] === 'Retry-After' || 
        (typeof call.arguments[0] === 'object' && 'Retry-After' in call.arguments[0])
      );
      
      assert.ok(retryAfterCall, 'Retry-After header should be set');
    });

    it('should use custom key generator', () => {
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (req) => `user-${req.userId || 'anonymous'}`,
      });

      const userReq = { ...mockReq, userId: 'user123' };
      const anonReq = { ...mockReq, userId: undefined };

      // User requests
      middleware(userReq, mockRes, mockNext);
      middleware(userReq, mockRes, mockNext);
      
      // Third request from same user should be blocked
      mockRes.status = mock.fn((code: number) => mockRes);
      mockRes.json = mock.fn((data: any) => mockRes);
      middleware(userReq, mockRes, mockNext);
      assert.strictEqual(mockRes.status.mock.calls.length, 1);

      // But anonymous user should still be allowed
      mockRes.status = mock.fn((code: number) => mockRes);
      mockNext = mock.fn();
      middleware(anonReq, mockRes, mockNext);
      assert.strictEqual(mockNext.mock.calls.length, 1);
    });

    it('should skip rate limiting when configured', () => {
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
        skip: (req) => req.path === '/health',
      });

      const healthReq = { ...mockReq, path: '/health' };

      // Multiple health check requests should all pass
      middleware(healthReq, mockRes, mockNext);
      middleware(healthReq, mockRes, mockNext);
      middleware(healthReq, mockRes, mockNext);

      assert.strictEqual(mockNext.mock.calls.length, 3);
      assert.strictEqual(mockRes.status.mock.calls.length, 0);
    });

    it('should use custom handler when provided', () => {
      const customHandler = mock.fn();
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
        handler: customHandler,
      });

      // First request - should pass
      middleware(mockReq, mockRes, mockNext);

      // Second request - should trigger custom handler
      middleware(mockReq, mockRes, mockNext);

      assert.strictEqual(customHandler.mock.calls.length, 1);
      assert.strictEqual(mockRes.json.mock.calls.length, 0); // Custom handler should prevent default
    });

    it('should use custom error message', () => {
      const customMessage = 'Rate limit exceeded, please wait';
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
        message: customMessage,
      });

      // First request
      middleware(mockReq, mockRes, mockNext);

      // Reset mocks
      mockRes.status = mock.fn((code: number) => mockRes);
      mockRes.json = mock.fn((data: any) => mockRes);

      // Second request - should be blocked
      middleware(mockReq, mockRes, mockNext);

      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.strictEqual(response.error.message, customMessage);
    });

    it('should use custom status code', () => {
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
        statusCode: 503,
      });

      // First request
      middleware(mockReq, mockRes, mockNext);

      // Reset mocks
      mockRes.status = mock.fn((code: number) => mockRes);
      mockRes.json = mock.fn((data: any) => mockRes);

      // Second request
      middleware(mockReq, mockRes, mockNext);

      assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 503);
      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.strictEqual(response.error.statusCode, 503);
    });

    it('should handle missing IP address', () => {
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 5,
      });

      const reqWithoutIp = {
        path: '/api/test',
        socket: {},
      };

      middleware(reqWithoutIp, mockRes, mockNext);

      // Should use 'unknown' as fallback
      assert.strictEqual(mockNext.mock.calls.length, 1);
    });

    it('should update remaining count correctly', () => {
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 5,
      });

      // First request
      middleware(mockReq, mockRes, mockNext);
      let headers = mockRes.set.mock.calls[0].arguments[0];
      assert.strictEqual(headers['X-RateLimit-Remaining'], '4');

      // Reset set mock
      mockRes.set = mock.fn();

      // Second request
      middleware(mockReq, mockRes, mockNext);
      headers = mockRes.set.mock.calls[0].arguments[0];
      assert.strictEqual(headers['X-RateLimit-Remaining'], '3');

      // Reset set mock
      mockRes.set = mock.fn();

      // Third request
      middleware(mockReq, mockRes, mockNext);
      headers = mockRes.set.mock.calls[0].arguments[0];
      assert.strictEqual(headers['X-RateLimit-Remaining'], '2');
    });
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter middleware', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      assert.strictEqual(typeof limiter, 'function');
    });

    it('should work the same as rateLimitMiddleware', () => {
      // Use unique counter to avoid interference with other tests
      testCounter++;
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      const mockReq = {
        ip: `192.168.1.${testCounter}`,
        path: '/api/test',
        socket: { remoteAddress: `192.168.1.${testCounter}` },
      };

      const mockRes = {
        set: mock.fn(),
        status: mock.fn((code: number) => mockRes),
        json: mock.fn((data: any) => mockRes),
      };

      const mockNext = mock.fn();

      // Should allow first requests
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      assert.strictEqual(mockNext.mock.calls.length, 2);

      // Should block third request
      limiter(mockReq, mockRes, mockNext);
      assert.strictEqual(mockRes.status.mock.calls.length, 1);
      assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 429);
    });
  });

  describe('Rate limit window expiration', () => {
    it('should reset count after window expires', async () => {
      const windowMs = 200;
      const waitTime = windowMs + 100; // Wait for window + buffer
      
      // Use unique IP to avoid interference
      testCounter++;
      const middleware = rateLimitMiddleware({
        windowMs,
        maxRequests: 2,
      });

      const mockReq = {
        ip: `10.0.0.${testCounter}`,
        path: '/api/test',
        socket: { remoteAddress: `10.0.0.${testCounter}` },
      };

      const mockRes = {
        set: mock.fn(),
        status: mock.fn((code: number) => mockRes),
        json: mock.fn((data: any) => mockRes),
      };

      let mockNext = mock.fn();

      // Use up the limit
      middleware(mockReq, mockRes, mockNext);
      middleware(mockReq, mockRes, mockNext);
      assert.strictEqual(mockNext.mock.calls.length, 2);

      // Third should be blocked
      middleware(mockReq, mockRes, mockNext);
      assert.strictEqual(mockRes.status.mock.calls.length, 1);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Reset mocks
      mockNext = mock.fn();
      mockRes.status = mock.fn((code: number) => mockRes);
      mockRes.set = mock.fn();

      // Should be allowed again
      middleware(mockReq, mockRes, mockNext);
      assert.strictEqual(mockNext.mock.calls.length, 1);
    });
  });
});
