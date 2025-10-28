import { ICache, CacheEntry } from './ICache.js';

export class InMemoryCache implements ICache {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
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

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    // Clean up expired entries first
    this.cleanupExpired();
    return this.cache.size;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}
