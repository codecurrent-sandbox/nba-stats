/**
 * API Provider Adapter - Abstraction layer for external API providers
 * 
 * This module provides an extensible adapter pattern for different API providers,
 * allowing for easy switching between implementations and multiple provider support.
 */

import type {
  Player,
  Team,
  Game,
  PlayerStats,
  TeamStats,
  PaginatedResponse
} from '../types/nba';

/**
 * Configuration for an API provider
 */
export interface ApiProviderConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Query parameters for filtering and pagination
 */
export interface QueryParams {
  limit?: number;
  offset?: number;
  [key: string]: any;
}

/**
 * Response envelope for API calls
 */
export interface ApiProviderResponse<T> {
  data: T;
  status: number;
  timestamp: string;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Base interface for all API providers
 */
export interface IApiProvider {
  /**
   * Get configuration
   */
  getConfig(): ApiProviderConfig;

  /**
   * Check provider health
   */
  health(): Promise<{
    status: string;
    uptime: number;
    version: string;
  }>;

  // Player endpoints
  getPlayers(params?: QueryParams): Promise<PaginatedResponse<Player>>;
  getPlayer(playerId: string): Promise<Player>;
  getPlayerStats(playerId: string, season?: number): Promise<PlayerStats>;

  // Team endpoints
  getTeams(params?: QueryParams): Promise<PaginatedResponse<Team>>;
  getTeam(teamId: string): Promise<Team>;
  getTeamStats(teamId: string, season?: number): Promise<TeamStats>;
  getTeamRoster(teamId: string): Promise<PaginatedResponse<Player>>;

  // Game endpoints
  getGames(params?: QueryParams): Promise<PaginatedResponse<Game>>;
  getGame(gameId: string): Promise<Game>;

  // Search endpoints
  searchPlayers(query: string): Promise<PaginatedResponse<Player>>;
  searchTeams(query: string): Promise<PaginatedResponse<Team>>;
}

/**
 * Provider configuration interface for initialization
 */
export interface ProviderConfig extends ApiProviderConfig {
  name: string;
  type: 'nba-official' | 'external' | 'mock' | string;
}

/**
 * Provider factory for creating provider instances
 */
export class ApiProviderFactory {
  private static providers: Map<string, IApiProvider> = new Map();
  private static defaultProvider: string | null = null;

  /**
   * Register a provider
   */
  static registerProvider(name: string, provider: IApiProvider): void {
    this.providers.set(name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  /**
   * Get a provider by name
   */
  static getProvider(name?: string): IApiProvider {
    const providerName = name || this.defaultProvider;
    
    if (!providerName) {
      throw new Error('No providers registered');
    }

    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found`);
    }

    return provider;
  }

  /**
   * Get all registered providers
   */
  static getAllProviders(): Map<string, IApiProvider> {
    return new Map(this.providers);
  }

  /**
   * Set default provider
   */
  static setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider '${name}' not found`);
    }
    this.defaultProvider = name;
  }

  /**
   * Remove a provider
   */
  static removeProvider(name: string): boolean {
    const removed = this.providers.delete(name);
    
    if (this.defaultProvider === name) {
      this.defaultProvider = this.providers.keys().next().value || null;
    }

    return removed;
  }

  /**
   * Clear all providers
   */
  static clear(): void {
    this.providers.clear();
    this.defaultProvider = null;
  }
}

/**
 * Abstract base provider for common functionality
 */
export abstract class BaseApiProvider implements IApiProvider {
  protected config: ApiProviderConfig;
  protected name: string;

  constructor(name: string, config: ApiProviderConfig) {
    this.name = name;
    this.config = config;
  }

  getConfig(): ApiProviderConfig {
    return { ...this.config };
  }

  abstract health(): Promise<{ status: string; uptime: number; version: string }>;
  abstract getPlayers(params?: QueryParams): Promise<PaginatedResponse<Player>>;
  abstract getPlayer(playerId: string): Promise<Player>;
  abstract getPlayerStats(playerId: string, season?: number): Promise<PlayerStats>;
  abstract getTeams(params?: QueryParams): Promise<PaginatedResponse<Team>>;
  abstract getTeam(teamId: string): Promise<Team>;
  abstract getTeamStats(teamId: string, season?: number): Promise<TeamStats>;
  abstract getTeamRoster(teamId: string): Promise<PaginatedResponse<Player>>;
  abstract getGames(params?: QueryParams): Promise<PaginatedResponse<Game>>;
  abstract getGame(gameId: string): Promise<Game>;
  abstract searchPlayers(query: string): Promise<PaginatedResponse<Player>>;
  abstract searchTeams(query: string): Promise<PaginatedResponse<Team>>;
}

/**
 * Provider adapter that wraps an existing API client
 */
export class ApiClientAdapter extends BaseApiProvider {
  constructor(name: string, config: ApiProviderConfig) {
    super(name, config);
  }

  async health(): Promise<{ status: string; uptime: number; version: string }> {
    try {
      const response = await fetch(`${this.config.baseURL}/health`, {
        headers: this.config.headers,
        signal: AbortSignal.timeout(this.config.timeout || 10000)
      });

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPlayers(params?: QueryParams): Promise<PaginatedResponse<Player>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.position) searchParams.append('position', params.position);
    if (params?.teamId) searchParams.append('teamId', params.teamId);

    const query = searchParams.toString();
    return this.makeRequest<PaginatedResponse<Player>>(
      `/v1/players${query ? `?${query}` : ''}`
    );
  }

  async getPlayer(playerId: string): Promise<Player> {
    return this.makeRequest<Player>(`/v1/players/${playerId}`);
  }

  async getPlayerStats(playerId: string, season?: number): Promise<PlayerStats> {
    const query = season ? `?season=${season}` : '';
    return this.makeRequest<PlayerStats>(`/v1/stats/player/${playerId}${query}`);
  }

  async getTeams(params?: QueryParams): Promise<PaginatedResponse<Team>> {
    const searchParams = new URLSearchParams();
    if (params?.conference) searchParams.append('conference', params.conference);
    if (params?.division) searchParams.append('division', params.division);

    const query = searchParams.toString();
    return this.makeRequest<PaginatedResponse<Team>>(
      `/v1/teams${query ? `?${query}` : ''}`
    );
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.makeRequest<Team>(`/v1/teams/${teamId}`);
  }

  async getTeamStats(teamId: string, season?: number): Promise<TeamStats> {
    const query = season ? `?season=${season}` : '';
    return this.makeRequest<TeamStats>(`/v1/stats/team/${teamId}${query}`);
  }

  async getTeamRoster(teamId: string): Promise<PaginatedResponse<Player>> {
    return this.makeRequest<PaginatedResponse<Player>>(`/v1/teams/${teamId}/roster`);
  }

  async getGames(params?: QueryParams): Promise<PaginatedResponse<Game>> {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.append('date', params.date);
    if (params?.teamId) searchParams.append('teamId', params.teamId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.makeRequest<PaginatedResponse<Game>>(
      `/v1/games${query ? `?${query}` : ''}`
    );
  }

  async getGame(gameId: string): Promise<Game> {
    return this.makeRequest<Game>(`/v1/games/${gameId}`);
  }

  async searchPlayers(query: string): Promise<PaginatedResponse<Player>> {
    const params = new URLSearchParams({ q: query });
    return this.makeRequest<PaginatedResponse<Player>>(`/v1/search/players?${params}`);
  }

  async searchTeams(query: string): Promise<PaginatedResponse<Team>> {
    const params = new URLSearchParams({ q: query });
    return this.makeRequest<PaginatedResponse<Team>>(`/v1/search/teams?${params}`);
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    const timeout = this.config.timeout || 10000;

    try {
      const response = await fetch(url, {
        headers: this.config.headers || {},
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract data if wrapped in response envelope
      if (data && typeof data === 'object' && 'data' in data) {
        return data.data;
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`API call failed: ${message}`);
    }
  }
}

export default ApiProviderFactory;
