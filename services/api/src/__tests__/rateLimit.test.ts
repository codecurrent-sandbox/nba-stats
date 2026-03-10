/**
 * Unit tests for rateLimit middleware
 *
 * Covers:
 * - Token bucket algorithm: allows up to maxRequests, blocks when exceeded, resets after window
 * - Per-IP tracking: separate buckets per key
 * - Rate limit exceeded: 429 status + Retry-After header
 * - Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
 * - skip option
 * - custom handler
 * - createRateLimiter factory
 */

import { jest } from '@jest/globals';
import { rateLimitMiddleware, createRateLimiter } from '../middleware/rateLimit.js';
import type { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let ipCounter = 0;

/** Returns a unique pseudo-IP string so each test gets a fresh rate-limit bucket. */
function nextIp(): string {
  return `test-ip-${++ipCounter}`;
}

function makeMockReq(ip: string, path = '/api/test'): Request {
  return {
    ip,
    path,
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

function makeMockRes() {
  const res: any = {};
  res.set = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response & { set: jest.Mock; status: jest.Mock; json: jest.Mock };
}

// ---------------------------------------------------------------------------
// rateLimitMiddleware – token bucket algorithm
// ---------------------------------------------------------------------------

describe('rateLimitMiddleware', () => {
  describe('token bucket algorithm', () => {
    it('should allow requests up to maxRequests', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 3 });
      const next = jest.fn();

      for (let i = 0; i < 3; i++) {
        middleware(makeMockReq(ip), makeMockRes(), next);
      }

      expect(next).toHaveBeenCalledTimes(3);
    });

    it('should block the request that exceeds maxRequests', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 2 });
      const next = jest.fn();

      // Consume the full allowance
      middleware(makeMockReq(ip), makeMockRes(), next);
      middleware(makeMockReq(ip), makeMockRes(), next);

      // This one should be blocked
      const blockedRes = makeMockRes();
      middleware(makeMockReq(ip), blockedRes, jest.fn());

      expect(next).toHaveBeenCalledTimes(2);
      expect(blockedRes.status).toHaveBeenCalledWith(429);
    });

    it('should reset the count after the window expires', async () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 100, maxRequests: 2 });
      const next = jest.fn();

      // Fill the bucket
      middleware(makeMockReq(ip), makeMockRes(), next);
      middleware(makeMockReq(ip), makeMockRes(), next);

      // Verify it is blocked
      const blockedRes = makeMockRes();
      middleware(makeMockReq(ip), blockedRes, jest.fn());
      expect(blockedRes.status).toHaveBeenCalledWith(429);

      // Wait for the window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // The bucket should be fresh again
      const nextAfterReset = jest.fn();
      middleware(makeMockReq(ip), makeMockRes(), nextAfterReset);
      expect(nextAfterReset).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Per-IP tracking
  // ---------------------------------------------------------------------------

  describe('per-IP tracking', () => {
    it('should give each IP its own independent bucket', () => {
      const ip1 = nextIp();
      const ip2 = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 2 });
      const next1 = jest.fn();
      const next2 = jest.fn();

      // ip1 fills its bucket
      middleware(makeMockReq(ip1), makeMockRes(), next1);
      middleware(makeMockReq(ip1), makeMockRes(), next1);

      // ip1 is now blocked
      const blockedRes = makeMockRes();
      middleware(makeMockReq(ip1), blockedRes, next1);
      expect(blockedRes.status).toHaveBeenCalledWith(429);

      // ip2 still has a fresh bucket
      middleware(makeMockReq(ip2), makeMockRes(), next2);
      middleware(makeMockReq(ip2), makeMockRes(), next2);
      expect(next2).toHaveBeenCalledTimes(2);
    });

    it('should use req.socket.remoteAddress as fallback key', () => {
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 1 });
      const next = jest.fn();

      // ip is undefined, socket.remoteAddress is the key
      const req: any = { ip: undefined, path: '/test', socket: { remoteAddress: 'socket-addr-1' } };
      middleware(req, makeMockRes(), next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should use custom keyGenerator when provided', () => {
      const sharedKey = 'group-key-' + nextIp();
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: () => sharedKey,
      });
      const next = jest.fn();

      // Two different IPs share the same bucket via keyGenerator
      middleware(makeMockReq(nextIp()), makeMockRes(), next);
      middleware(makeMockReq(nextIp()), makeMockRes(), next);
      expect(next).toHaveBeenCalledTimes(2);

      // Third request (different IP, same key) is blocked
      const blockedRes = makeMockRes();
      middleware(makeMockReq(nextIp()), blockedRes, jest.fn());
      expect(blockedRes.status).toHaveBeenCalledWith(429);
    });
  });

  // ---------------------------------------------------------------------------
  // Rate limit exceeded responses
  // ---------------------------------------------------------------------------

  describe('rate limit exceeded', () => {
    it('should return 429 status when limit is exceeded', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 1 });

      middleware(makeMockReq(ip), makeMockRes(), jest.fn());

      const res = makeMockRes();
      middleware(makeMockReq(ip), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should include Retry-After header when limit is exceeded', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 1 });

      middleware(makeMockReq(ip), makeMockRes(), jest.fn());

      const res = makeMockRes();
      middleware(makeMockReq(ip), res, jest.fn());

      expect(res.set).toHaveBeenCalledWith('Retry-After', expect.any(String));
    });

    it('should return error body with RATE_LIMITED code', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 1 });

      middleware(makeMockReq(ip), makeMockRes(), jest.fn());

      const res = makeMockRes();
      middleware(makeMockReq(ip), res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'RATE_LIMITED' }),
        }),
      );
    });

    it('should use custom statusCode when provided', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
        statusCode: 503,
      });

      middleware(makeMockReq(ip), makeMockRes(), jest.fn());

      const res = makeMockRes();
      middleware(makeMockReq(ip), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it('should use custom message when provided', () => {
      const ip = nextIp();
      const customMessage = 'Slow down, cowboy';
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
        message: customMessage,
      });

      middleware(makeMockReq(ip), makeMockRes(), jest.fn());

      const res = makeMockRes();
      middleware(makeMockReq(ip), res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ message: customMessage }),
        }),
      );
    });

    it('should call custom handler instead of default response when provided', () => {
      const ip = nextIp();
      const customHandler = jest.fn();
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
        handler: customHandler,
      });

      middleware(makeMockReq(ip), makeMockRes(), jest.fn());

      const req = makeMockReq(ip);
      const res = makeMockRes();
      const next = jest.fn();
      middleware(req, res, next);

      expect(customHandler).toHaveBeenCalledWith(req, res, next);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Rate limit response headers
  // ---------------------------------------------------------------------------

  describe('rate limit headers', () => {
    it('should set X-RateLimit-Limit header to maxRequests', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 10 });
      const res = makeMockRes();

      middleware(makeMockReq(ip), res, jest.fn());

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-RateLimit-Limit': '10' }),
      );
    });

    it('should set X-RateLimit-Remaining to maxRequests - 1 on first request', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 10 });
      const res = makeMockRes();

      middleware(makeMockReq(ip), res, jest.fn());

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-RateLimit-Remaining': '9' }),
      );
    });

    it('should decrement X-RateLimit-Remaining with each request', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 5 });

      const res1 = makeMockRes();
      middleware(makeMockReq(ip), res1, jest.fn());
      expect(res1.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-RateLimit-Remaining': '4' }),
      );

      const res2 = makeMockRes();
      middleware(makeMockReq(ip), res2, jest.fn());
      expect(res2.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-RateLimit-Remaining': '3' }),
      );
    });

    it('should clamp X-RateLimit-Remaining to 0 when limit is exceeded', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 1 });

      middleware(makeMockReq(ip), makeMockRes(), jest.fn());

      const res = makeMockRes();
      middleware(makeMockReq(ip), res, jest.fn());

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-RateLimit-Remaining': '0' }),
      );
    });

    it('should set X-RateLimit-Reset header', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 10 });
      const res = makeMockRes();

      middleware(makeMockReq(ip), res, jest.fn());

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-RateLimit-Reset': expect.any(String) }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // skip option
  // ---------------------------------------------------------------------------

  describe('skip option', () => {
    it('should bypass rate limiting when skip returns true', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
        skip: req => req.path === '/health',
      });
      const next = jest.fn();

      for (let i = 0; i < 5; i++) {
        middleware(makeMockReq(ip, '/health'), makeMockRes(), next);
      }

      expect(next).toHaveBeenCalledTimes(5);
    });

    it('should apply rate limiting when skip returns false', () => {
      const ip = nextIp();
      const middleware = rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
        skip: req => req.path === '/health',
      });
      const next = jest.fn();

      middleware(makeMockReq(ip, '/api/data'), makeMockRes(), next);

      const blockedRes = makeMockRes();
      middleware(makeMockReq(ip, '/api/data'), blockedRes, jest.fn());

      expect(next).toHaveBeenCalledTimes(1);
      expect(blockedRes.status).toHaveBeenCalledWith(429);
    });
  });
});

// ---------------------------------------------------------------------------
// createRateLimiter factory
// ---------------------------------------------------------------------------

describe('createRateLimiter', () => {
  it('should return a middleware function', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 10 });
    expect(typeof limiter).toBe('function');
    expect(limiter.length).toBe(3); // (req, res, next)
  });

  it('should enforce rate limiting just like rateLimitMiddleware', () => {
    const ip = nextIp();
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 1 });
    const next = jest.fn();

    limiter(makeMockReq(ip), makeMockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);

    const blockedRes = makeMockRes();
    limiter(makeMockReq(ip), blockedRes, jest.fn());
    expect(blockedRes.status).toHaveBeenCalledWith(429);
  });
});
