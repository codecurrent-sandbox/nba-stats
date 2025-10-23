import type { Player, Team, Game, PlayerStats, TeamStats, ApiResponse, PaginatedResponse } from '../types/nba';
import { logger } from '../logging/logger';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

interface RequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class NBAApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { timeout = DEFAULT_TIMEOUT, headers = {}, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestStart = Date.now();

    try {
      logger.debug('API Request', {
        method: fetchOptions.method || 'GET',
        url,
        headers: { ...this.defaultHeaders, ...headers }
      });

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - requestStart;

      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status}`;
        let errorCode = `HTTP_${response.status}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorCode = errorData.code || errorCode;
        } catch {
          // If we can't parse error response, use default message
        }

        logger.trackApiCall('GET', url, response.status, duration, { error: errorMessage });
        throw new ApiError(errorMessage, response.status, errorCode);
      }

      const data = await response.json();
      logger.trackApiCall('GET', url, response.status, duration);
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - requestStart;

      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        logger.error('API Request Timeout', { url, timeout });
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }

      logger.error('API Request Failed', { 
        url, 
        error: error.message, 
        duration 
      });
      
      throw new ApiError(
        'Network error occurred',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  // Player endpoints
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

    const endpoint = `/v1/players${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<PaginatedResponse<Player>>(endpoint);
  }

  async getPlayer(playerId: string): Promise<ApiResponse<Player>> {
    return this.request<ApiResponse<Player>>(`/v1/players/${playerId}`);
  }

  async getPlayerStats(
    playerId: string, 
    season?: number
  ): Promise<ApiResponse<PlayerStats>> {
    const endpoint = `/v1/stats/player/${playerId}${season ? `?season=${season}` : ''}`;
    return this.request<ApiResponse<PlayerStats>>(endpoint);
  }

  // Team endpoints
  async getTeams(params?: {
    conference?: string;
    division?: string;
  }): Promise<PaginatedResponse<Team>> {
    const searchParams = new URLSearchParams();
    
    if (params?.conference) searchParams.append('conference', params.conference);
    if (params?.division) searchParams.append('division', params.division);

    const endpoint = `/v1/teams${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<PaginatedResponse<Team>>(endpoint);
  }

  async getTeam(teamId: string): Promise<ApiResponse<Team>> {
    return this.request<ApiResponse<Team>>(`/v1/teams/${teamId}`);
  }

  async getTeamStats(
    teamId: string, 
    season?: number
  ): Promise<ApiResponse<TeamStats>> {
    const endpoint = `/v1/stats/team/${teamId}${season ? `?season=${season}` : ''}`;
    return this.request<ApiResponse<TeamStats>>(endpoint);
  }

  async getTeamRoster(teamId: string): Promise<PaginatedResponse<Player>> {
    return this.request<PaginatedResponse<Player>>(`/v1/teams/${teamId}/roster`);
  }

  // Game endpoints
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

    const endpoint = `/v1/games${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<PaginatedResponse<Game>>(endpoint);
  }

  async getGame(gameId: string): Promise<ApiResponse<Game>> {
    return this.request<ApiResponse<Game>>(`/v1/games/${gameId}`);
  }

  // Health endpoint
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    version: string;
    uptime: number;
  }> {
    return this.request<{
      status: string;
      timestamp: string;
      version: string;
      uptime: number;
    }>('/health');
  }

  // Search endpoints
  async searchPlayers(query: string): Promise<PaginatedResponse<Player>> {
    const searchParams = new URLSearchParams({ q: query });
    return this.request<PaginatedResponse<Player>>(`/v1/search/players?${searchParams}`);
  }

  async searchTeams(query: string): Promise<PaginatedResponse<Team>> {
    const searchParams = new URLSearchParams({ q: query });
    return this.request<PaginatedResponse<Team>>(`/v1/search/teams?${searchParams}`);
  }
}

// Create singleton instance
export const nbaApi = new NBAApiClient();

// Export utility functions for error handling
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

export const isNetworkError = (error: unknown): boolean => {
  return isApiError(error) && error.code === 'NETWORK_ERROR';
};

export const isTimeoutError = (error: unknown): boolean => {
  return isApiError(error) && error.code === 'TIMEOUT';
};

// Export the ApiError class for type checking
export { ApiError };

// Export default
export default nbaApi;