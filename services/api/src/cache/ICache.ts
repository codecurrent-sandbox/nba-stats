/**
 * ICache - Cache interface for NBA Stats API
 * 
 * This interface defines the contract for cache implementations.
 * It supports multiple cache backends (Redis, Memcached, in-memory)
 * through a common interface.
 */

export interface ICacheOptions {
  /**
   * Time-to-live in seconds. If not specified, uses default TTL from config.
   */
  ttl?: number;
  
  /**
   * Key prefix for namespacing cache entries
   */
  prefix?: string;
}

export interface ICache {
  /**
   * Get a value from cache by key
   * @param key - Cache key
   * @returns Promise resolving to cached value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Optional cache options (TTL, prefix, etc.)
   * @returns Promise resolving to true if successful
   */
  set<T>(key: string, value: T, options?: ICacheOptions): Promise<boolean>;

  /**
   * Delete a value from cache
   * @param key - Cache key to delete
   * @returns Promise resolving to true if key was deleted
   */
  del(key: string): Promise<boolean>;

  /**
   * Delete multiple keys matching a pattern
   * @param pattern - Key pattern (supports wildcards)
   * @returns Promise resolving to number of keys deleted
   */
  delPattern(pattern: string): Promise<number>;

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   * @returns Promise resolving to true if key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Clear all cache entries
   * @returns Promise resolving to true if successful
   */
  flush(): Promise<boolean>;

  /**
   * Get remaining TTL for a key
   * @param key - Cache key
   * @returns Promise resolving to TTL in seconds, or -1 if no expiry, -2 if key doesn't exist
   */
  ttl(key: string): Promise<number>;

  /**
   * Increment a numeric value in cache
   * @param key - Cache key
   * @param amount - Amount to increment by (default: 1)
   * @returns Promise resolving to new value after increment
   */
  incr(key: string, amount?: number): Promise<number>;

  /**
   * Decrement a numeric value in cache
   * @param key - Cache key
   * @param amount - Amount to decrement by (default: 1)
   * @returns Promise resolving to new value after decrement
   */
  decr(key: string, amount?: number): Promise<number>;

  /**
   * Get multiple values from cache
   * @param keys - Array of cache keys
   * @returns Promise resolving to array of values (null for missing keys)
   */
  mget<T>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Set multiple key-value pairs
   * @param entries - Object with key-value pairs to set
   * @param options - Optional cache options
   * @returns Promise resolving to true if successful
   */
  mset(entries: Record<string, any>, options?: ICacheOptions): Promise<boolean>;

  /**
   * Check health/connectivity of cache
   * @returns Promise resolving to true if cache is healthy
   */
  ping(): Promise<boolean>;

  /**
   * Close cache connection
   * @returns Promise resolving when connection is closed
   */
  close(): Promise<void>;
}

/**
 * Cache key builder utility
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
}
