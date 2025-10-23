import type { Player, Team, Game, PlayerStats, TeamStats, ApiResponse, PaginatedResponse } from '../types/nba';
import { logger } from '../logging/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(response.status, errorData.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Players
  async getPlayers(limit = 20, offset = 0): Promise<PaginatedResponse<Player>> {
    const startTime = Date.now();
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/players?limit=${limit}&offset=${offset}`
      );
      const data = await handleResponse<PaginatedResponse<Player>>(response);
      
      logger.trackApiCall('GET', '/players', response.status, Date.now() - startTime);
      return data;
    } catch (error) {
      logger.error('Failed to fetch players', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  async getPlayerById(id: string): Promise<Player> {
    const startTime = Date.now();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/players/${id}`);
      const data = await handleResponse<Player>(response);
      
      logger.trackApiCall('GET', `/players/${id}`, response.status, Date.now() - startTime);
      return data;
    } catch (error) {
      logger.error('Failed to fetch player', { playerId: id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  async getPlayerStats(playerId: string, season?: number): Promise<PlayerStats> {
    const startTime = Date.now();
    const url = season 
      ? `${API_BASE_URL}/stats/player/${playerId}?season=${season}`
      : `${API_BASE_URL}/stats/player/${playerId}`;
    
    try {
      const response = await fetchWithTimeout(url);
      const data = await handleResponse<PlayerStats>(response);
      
      logger.trackApiCall('GET', `/stats/player/${playerId}`, response.status, Date.now() - startTime);
      return data;
    } catch (error) {
      logger.error('Failed to fetch player stats', { playerId, season, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    const startTime = Date.now();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/teams`);
      const data = await handleResponse<{ items: Team[] }>(response);
      
      logger.trackApiCall('GET', '/teams', response.status, Date.now() - startTime);
      return data.items;
    } catch (error) {
      logger.error('Failed to fetch teams', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  async getTeamById(id: string): Promise<Team> {
    const startTime = Date.now();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/teams/${id}`);
      const data = await handleResponse<Team>(response);
      
      logger.trackApiCall('GET', `/teams/${id}`, response.status, Date.now() - startTime);
      return data;
    } catch (error) {
      logger.error('Failed to fetch team', { teamId: id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  async getTeamStats(teamId: string, season?: number): Promise<TeamStats> {
    const startTime = Date.now();
    const url = season 
      ? `${API_BASE_URL}/stats/team/${teamId}?season=${season}`
      : `${API_BASE_URL}/stats/team/${teamId}`;
    
    try {
      const response = await fetchWithTimeout(url);
      const data = await handleResponse<TeamStats>(response);
      
      logger.trackApiCall('GET', `/stats/team/${teamId}`, response.status, Date.now() - startTime);
      return data;
    } catch (error) {
      logger.error('Failed to fetch team stats', { teamId, season, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  // Games
  async getGames(date?: string, limit = 20): Promise<PaginatedResponse<Game>> {
    const startTime = Date.now();
    const url = date 
      ? `${API_BASE_URL}/games?date=${date}&limit=${limit}`
      : `${API_BASE_URL}/games?limit=${limit}`;
    
    try {
      const response = await fetchWithTimeout(url);
      const data = await handleResponse<PaginatedResponse<Game>>(response);
      
      logger.trackApiCall('GET', '/games', response.status, Date.now() - startTime);
      return data;
    } catch (error) {
      logger.error('Failed to fetch games', { date, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  async getGameById(id: string): Promise<Game> {
    const startTime = Date.now();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/games/${id}`);
      const data = await handleResponse<Game>(response);
      
      logger.trackApiCall('GET', `/games/${id}`, response.status, Date.now() - startTime);
      return data;
    } catch (error) {
      logger.error('Failed to fetch game', { gameId: id, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
      return handleResponse(response);
    } catch (error) {
      logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
};

export default api;
