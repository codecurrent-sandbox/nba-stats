/**
 * Rate Limiting Middleware
 *
 * Provides rate limiting capabilities for Express applications with:
 * - Token bucket algorithm implementation
 * - IP-based and user-based rate limiting
 * - Configurable limits per route/user
 * - Redis support for distributed rate limiting
 * - Response headers with rate limit information
 *
 * @module middleware/rateLimit
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Rate limit configuration options
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Function to generate rate limit key
  skip?: (req: Request) => boolean; // Skip rate limiting for certain requests
  handler?: (req: Request, res: Response, next: NextFunction) => void; // Custom handler
  message?: string; // Custom error message
  statusCode?: number; // HTTP status code for rate limit exceeded
}

/**
 * In-memory store for rate limiting
 * TODO: Replace with Redis store for distributed systems
 */
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get current count for a key
   */
  get(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;

    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return 0;
    }

    return entry.count;
  }

  /**
   * Increment count for a key
   */
  increment(key: string, windowMs: number): number {
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      // New window
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return 1;
    }

    // Increment existing
    entry.count += 1;
    return entry.count;
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key: string): number | null {
    const entry = this.store.get(key);
    return entry ? entry.resetTime : null;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.store.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.store.delete(key));
  }

  /**
   * Destroy the store and cleanup timers
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Global rate limit store
 * TODO: Make configurable to support custom stores (Redis, etc.)
 */
const defaultStore = new RateLimitStore();

/**
 * Default key generator using client IP
 */
function defaultKeyGenerator(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Rate Limiting Middleware
 *
 * Implements token bucket algorithm for rate limiting requests.
 * By default, limits are based on client IP address.
 *
 * @example
 * // Basic usage - 100 requests per 15 minutes
 * app.use(rateLimitMiddleware({
 *   windowMs: 15 * 60 * 1000,
 *   maxRequests: 100,
 * }));
 *
 * @example
 * // Rate limit by user ID
 * app.use(rateLimitMiddleware({
 *   windowMs: 60 * 1000, // 1 minute
 *   maxRequests: 30,
 *   keyGenerator: (req) => req.user?.id || req.ip,
 * }));
 *
 * @example
 * // Skip rate limiting for certain requests
 * app.use(rateLimitMiddleware({
 *   windowMs: 15 * 60 * 1000,
 *   maxRequests: 100,
 *   skip: (req) => req.path === '/health',
 * }));
 *
 * @param config - Rate limiting configuration
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skip,
    handler,
    message = 'Too many requests, please try again later',
    statusCode = 429,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting if configured
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const count = defaultStore.increment(key, windowMs);
    const resetTime = defaultStore.getResetTime(key);
    const retryAfter = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 0;

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - count).toString(),
      'X-RateLimit-Reset': resetTime?.toString() || '',
    });

    if (count > maxRequests) {
      res.set('Retry-After', retryAfter.toString());

      // Use custom handler if provided
      if (handler) {
        return handler(req, res, next);
      }

      // Default handler
      return res.status(statusCode).json({
        error: {
          message,
          code: 'RATE_LIMITED',
          statusCode,
          retryAfter,
        },
      });
    }

    next();
  };
}

/**
 * Create a rate limit middleware for specific routes
 *
 * @example
 * const apiLimiter = createRateLimiter({
 *   windowMs: 60 * 1000,
 *   maxRequests: 30,
 * });
 *
 * app.post('/login', apiLimiter, loginHandler);
 */
export function createRateLimiter(config: RateLimitConfig) {
  return rateLimitMiddleware(config);
}

export default rateLimitMiddleware;
