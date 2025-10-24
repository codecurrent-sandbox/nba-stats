/**
 * InMemoryCache - In-memory cache implementation with TTL management
 * 
 * Provides a simple, client-side cache for API responses with automatic
 * expiration based on Time-To-Live (TTL) settings.
 */

export interface CacheOptions {
  /**
   * Time-to-live in milliseconds
   */
  ttl?: number;
  
  /**
   * Key prefix for namespacing cache entries
   */
  prefix?: string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Cache key builder utility for consistent key generation
 */
export class CacheKeyBuilder {
  private parts: string[] = [];

  constructor(prefix?: string) {
    if (prefix) {
      this.parts.push(prefix);
    }
  }

  add(part: string | number): CacheKeyBuilder {
    this.parts.push(String(part));
    return this;
  }

  build(): string {
    return this.parts.join(':');
  }

  static create(prefix?: string): CacheKeyBuilder {
    return new CacheKeyBuilder(prefix);
  }
}

/**
 * Common cache key prefixes
 */
export enum CachePrefix {
  PLAYER = 'player',
  TEAM = 'team',
  GAME = 'game',
  STATS = 'stats',
  HEALTH = 'health',
  SEARCH = 'search',
}

/**
 * InMemoryCache class - Provides TTL-based caching for API responses
 */
export class InMemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly defaultTTL: number; // in milliseconds
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isDisposed = false;

  /**
   * Creates a new InMemoryCache instance
   * @param defaultTTL - Default time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL;
    this.startCleanupInterval();
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    if (this.isDisposed) {
      return null;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Optional cache options (TTL, prefix)
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    if (this.isDisposed) {
      return;
    }

    const finalKey = options?.prefix ? `${options.prefix}:${key}` : key;
    const ttl = options?.ttl ?? this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.cache.set(finalKey, {
      value,
      expiresAt
    });
  }

  /**
   * Check if a key exists and is not expired
   * @param key - Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    if (this.isDisposed) {
      return false;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a value from cache
   * @param key - Cache key
   * @returns True if key existed and was deleted
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all cache entries matching a pattern
   * @param pattern - Pattern to match (supports wildcards with *)
   * @returns Number of keys deleted
   */
  deletePattern(pattern: string): number {
    if (this.isDisposed) {
      return 0;
    }

    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get remaining TTL for a key
   * @param key - Cache key
   * @returns TTL in milliseconds, 0 if no expiry, -1 if key doesn't exist
   */
  getTTL(key: string): number {
    if (this.isDisposed) {
      return -1;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      return -1;
    }

    const remainingTime = entry.expiresAt - Date.now();
    return remainingTime > 0 ? remainingTime : 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    validKeys: number;
  } {
    if (this.isDisposed) {
      return { size: 0, validKeys: 0 };
    }

    const now = Date.now();
    let validKeys = 0;

    for (const entry of this.cache.values()) {
      if (entry.expiresAt > now) {
        validKeys++;
      }
    }

    return {
      size: this.cache.size,
      validKeys
    };
  }

  /**
   * Start automatic cleanup interval to remove expired entries
   */
  private startCleanupInterval(): void {
    // Run cleanup every 1 minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);

    // Allow interval to be garbage collected if this is the only reference
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Remove all expired entries from cache
   */
  private cleanup(): void {
    if (this.isDisposed) {
      return;
    }

    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Dispose of the cache and stop cleanup interval
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    this.isDisposed = true;
  }

  /**
   * Get the number of items in cache (including expired)
   */
  get size(): number {
    return this.cache.size;
  }
}

// Create and export a singleton instance
export const cacheManager = new InMemoryCache();

export default InMemoryCache;
