import type { Player, Team, Game, PlayerStats, ApiResponse, PaginatedResponse } from '../types/nba';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Player endpoints
  async getPlayers(params?: {
    limit?: number;
    offset?: number;
    position?: string;
    team?: string;
  }): Promise<PaginatedResponse<Player>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.position) searchParams.append('position', params.position);
    if (params?.team) searchParams.append('team', params.team);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Player>>(`/players${query ? `?${query}` : ''}`);
  }

  async getPlayer(id: string): Promise<ApiResponse<Player>> {
    return this.request<ApiResponse<Player>>(`/players/${id}`);
  }

  async getPlayerStats(
    playerId: string,
    season?: number
  ): Promise<ApiResponse<PlayerStats>> {
    const query = season ? `?season=${season}` : '';
    return this.request<ApiResponse<PlayerStats>>(`/stats/player/${playerId}${query}`);
  }

  // Team endpoints
  async getTeams(): Promise<PaginatedResponse<Team>> {
    return this.request<PaginatedResponse<Team>>('/teams');
  }

  async getTeam(id: string): Promise<ApiResponse<Team>> {
    return this.request<ApiResponse<Team>>(`/teams/${id}`);
  }

  async getTeamPlayers(teamId: string): Promise<PaginatedResponse<Player>> {
    return this.request<PaginatedResponse<Player>>(`/teams/${teamId}/players`);
  }

  // Game endpoints
  async getGames(params?: {
    limit?: number;
    date?: string;
    team?: string;
    status?: string;
  }): Promise<PaginatedResponse<Game>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.date) searchParams.append('date', params.date);
    if (params?.team) searchParams.append('team', params.team);
    if (params?.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Game>>(`/games${query ? `?${query}` : ''}`);
  }

  async getGame(id: string): Promise<ApiResponse<Game>> {
    return this.request<ApiResponse<Game>>(`/games/${id}`);
  }

  // Health endpoint
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Create and export a singleton instance
export const apiClient = new APIClient();
export default apiClient;