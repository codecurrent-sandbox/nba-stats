/**
 * Sample test file for InMemoryCache
 * This test verifies that Jest is configured correctly with TypeScript and ESM support
 */

describe('InMemoryCache', () => {
  // Define a simple cache entry type for testing
  type CacheEntry = {
    value: any;
    expiresAt: number;
  };

  // Simple in-memory cache implementation for testing
  class SimpleCache {
    private cache: Map<string, CacheEntry>;
    private defaultTTL: number;

    constructor(defaultTTL: number = 1000) {
      this.cache = new Map();
      this.defaultTTL = defaultTTL;
    }

    get<T>(key: string): T | null {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return null;
      }

      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        return null;
      }

      return entry.value as T;
    }

    set<T>(key: string, value: T, ttl?: number): void {
      const timeToLive = ttl || this.defaultTTL;
      const expiresAt = Date.now() + timeToLive;

      this.cache.set(key, {
        value,
        expiresAt
      });
    }

    clear(): void {
      this.cache.clear();
    }
  }

  let cache: SimpleCache;

  beforeEach(() => {
    cache = new SimpleCache(1000); // 1 second TTL for tests
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cache.set('key1', 'value1');
      const result = cache.get<string>('key1');
      expect(result).toBe('value1');
    });

    it('should return null for non-existent key', () => {
      const result = cache.get<string>('nonexistent');
      expect(result).toBeNull();
    });

    it('should store and retrieve complex objects', () => {
      const complexObject = {
        id: 1,
        name: 'Test',
        nested: { value: 42 }
      };
      cache.set('complex', complexObject);
      const result = cache.get<typeof complexObject>('complex');
      expect(result).toEqual(complexObject);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      cache.set('expiring', 'value', 100); // 100ms TTL
      
      // Value should exist immediately
      expect(cache.get<string>('expiring')).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Value should be expired
      expect(cache.get<string>('expiring')).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const shortLivedCache = new SimpleCache(100); // 100ms default TTL
      shortLivedCache.set('defaultTTL', 'value');
      
      expect(shortLivedCache.get<string>('defaultTTL')).toBe('value');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(shortLivedCache.get<string>('defaultTTL')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      cache.clear();
      
      expect(cache.get<string>('key1')).toBeNull();
      expect(cache.get<string>('key2')).toBeNull();
      expect(cache.get<string>('key3')).toBeNull();
    });

    it('should allow setting values after clear', () => {
      cache.set('key1', 'value1');
      cache.clear();
      cache.set('key2', 'value2');
      
      expect(cache.get<string>('key1')).toBeNull();
      expect(cache.get<string>('key2')).toBe('value2');
    });
  });
});
