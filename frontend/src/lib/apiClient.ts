import type {
  Player,
  Team,
  Game,
  PlayerStats,
  TeamStats,
  ApiResponse,
  PaginatedResponse
} from '../types/nba';
import { logger } from '../logging/logger';
import { cacheManager, CachePrefix, CacheKeyBuilder } from './cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface RequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
  skipCache?: boolean;
  cacheTTL?: number;
}

class ApiError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

class ApiClient {
  private readonly baseURL: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly cache = cacheManager;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, headers = {}, skipCache = false, cacheTTL = DEFAULT_CACHE_TTL, ...fetchOptions } = options;
    const method = (fetchOptions.method || 'GET').toUpperCase();

    // Check cache for GET requests
    if (method === 'GET' && !skipCache) {
      const cacheKey = CacheKeyBuilder.create().add(method).add(endpoint).build();
      const cachedValue = this.cache.get<T>(cacheKey);
      if (cachedValue) {
        logger.debug('Cache hit', { method, endpoint });
        return cachedValue;
      }
    }

    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const startedAt = Date.now();

    try {
      logger.debug('API Request', {
        method,
        url,
        headers: { ...this.defaultHeaders, ...headers }
      });

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...this.defaultHeaders,
          ...headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startedAt;

      if (!response.ok) {
        let message = `HTTP Error: ${response.status}`;
        let code = `HTTP_${response.status}`;

        try {
          const errorPayload = await response.json();
          if (typeof errorPayload?.message === 'string') {
            message = errorPayload.message;
          }
          if (typeof errorPayload?.code === 'string') {
            code = errorPayload.code;
          }
        } catch {
          // Ignore JSON parsing issues for error responses
        }

        logger.trackApiCall(method, url, response.status, duration, { error: message });
        throw new ApiError(message, response.status, code);
      }

      const rawPayload = await response.json();
      const data = this.extractData<T>(rawPayload);

      // Cache successful GET responses
      if (method === 'GET' && !skipCache) {
        const cacheKey = CacheKeyBuilder.create().add(method).add(endpoint).build();
        this.cache.set(cacheKey, data, { ttl: cacheTTL });
        logger.debug('Cache set', { method, endpoint, ttl: cacheTTL });
      }

      logger.trackApiCall(method, url, response.status, duration);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startedAt;

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        logger.error('API Request Timeout', { url, timeout });
        logger.trackApiCall(method, url, 408, duration, { error: 'Request timeout' });
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }

      const message = error instanceof Error ? error.message : 'Unknown error';

      logger.error('API Request Failed', { url, error: message, duration });
      logger.trackApiCall(method, url, 0, duration, { error: message });

      throw new ApiError('Network error occurred', 0, 'NETWORK_ERROR');
    }
  }

  private extractData<U>(payload: unknown): U {
    if (
      payload &&
      typeof payload === 'object' &&
      'data' in payload &&
      (payload as ApiResponse<U>).data !== undefined
    ) {
      return (payload as ApiResponse<U>).data;
    }

    return payload as U;
  }

  async getPlayers(params?: {
    limit?: number;
    offset?: number;
    position?: string;
    teamId?: string;
  }): Promise<PaginatedResponse<Player>> {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.position) searchParams.append('position', params.position);
    if (params?.teamId) searchParams.append('teamId', params.teamId);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Player>>(`/v1/players${query ? `?${query}` : ''}`);
  }

  async getPlayer(playerId: string): Promise<Player> {
    return this.request<Player>(`/v1/players/${playerId}`);
  }

  async getPlayerStats(playerId: string, season?: number): Promise<PlayerStats> {
    const query = season ? `?season=${season}` : '';
    return this.request<PlayerStats>(`/v1/stats/player/${playerId}${query}`);
  }

  async getTeams(params?: { conference?: string; division?: string }): Promise<PaginatedResponse<Team>> {
    const searchParams = new URLSearchParams();

    if (params?.conference) searchParams.append('conference', params.conference);
    if (params?.division) searchParams.append('division', params.division);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Team>>(`/v1/teams${query ? `?${query}` : ''}`);
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.request<Team>(`/v1/teams/${teamId}`);
  }

  async getTeamStats(teamId: string, season?: number): Promise<TeamStats> {
    const query = season ? `?season=${season}` : '';
    return this.request<TeamStats>(`/v1/stats/team/${teamId}${query}`);
  }

  async getTeamRoster(teamId: string): Promise<PaginatedResponse<Player>> {
    return this.request<PaginatedResponse<Player>>(`/v1/teams/${teamId}/roster`);
  }

  async getGames(params?: {
    date?: string;
    teamId?: string;
    status?: string;
    limit?: number;
  }): Promise<PaginatedResponse<Game>> {
    const searchParams = new URLSearchParams();

    if (params?.date) searchParams.append('date', params.date);
    if (params?.teamId) searchParams.append('teamId', params.teamId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Game>>(`/v1/games${query ? `?${query}` : ''}`);
  }

  async getGame(gameId: string): Promise<Game> {
    return this.request<Game>(`/v1/games/${gameId}`);
  }

  async getHealth(): Promise<{ status: string; timestamp: string; version: string; uptime: number }> {
    return this.request<{ status: string; timestamp: string; version: string; uptime: number }>(
      '/health'
    );
  }

  async searchPlayers(query: string): Promise<PaginatedResponse<Player>> {
    const params = new URLSearchParams({ q: query });
    return this.request<PaginatedResponse<Player>>(`/v1/search/players?${params}`);
  }

  async searchTeams(query: string): Promise<PaginatedResponse<Team>> {
    const params = new URLSearchParams({ q: query });
    return this.request<PaginatedResponse<Team>>(`/v1/search/teams?${params}`);
  }

  /**
   * Clear the cache for a specific endpoint or all cache
   * @param endpoint - Optional endpoint to clear cache for. If not provided, clears all cache.
   */
  clearCache(endpoint?: string): void {
    if (endpoint) {
      const cacheKey = CacheKeyBuilder.create().add('GET').add(endpoint).build();
      this.cache.delete(cacheKey);
      logger.debug('Cache cleared for endpoint', { endpoint });
    } else {
      this.cache.clear();
      logger.debug('All cache cleared');
    }
  }

  /**
   * Clear cache by pattern
   * @param pattern - Pattern to match cache keys (supports wildcards with *)
   */
  clearCachePattern(pattern: string): void {
    const deletedCount = this.cache.deletePattern(pattern);
    logger.debug('Cache pattern cleared', { pattern, deletedCount });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

export const apiClient = new ApiClient();

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

export const isNetworkError = (error: unknown): boolean => isApiError(error) && error.code === 'NETWORK_ERROR';

export const isTimeoutError = (error: unknown): boolean => isApiError(error) && error.code === 'TIMEOUT';

// Export cache utilities
export { cacheManager, CacheKeyBuilder, CachePrefix } from './cache';
export type { CacheOptions } from './cache';

export { ApiError };
export default apiClient;
