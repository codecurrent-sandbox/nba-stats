import axios, { AxiosInstance, AxiosError } from 'axios';

const BALLDONTLIE_BASE_URL = 'https://api.balldontlie.io/v1';

interface BallDontLiePlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string | null;
  weight: string | null;
  jersey_number: string | null;
  college: string | null;
  country: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: BallDontLieTeam;
}

interface BallDontLieTeam {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

interface BallDontLieGame {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: BallDontLieTeam;
  visitor_team: BallDontLieTeam;
}

interface BallDontLieResponse<T> {
  data: T[];
  meta: {
    next_cursor?: number;
    per_page: number;
  };
}

export class BallDontLieAdapter {
  private client: AxiosInstance;
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NBA_API_KEY || null;
    
    this.client = axios.create({
      baseURL: BALLDONTLIE_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': this.apiKey })
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => this.handleError(error)
    );
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;
      
      console.error(`BallDontLie API Error [${status}]:`, message);
      
      throw new Error(`External API error: ${message}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('BallDontLie API: No response received', error.message);
      throw new Error('External API not responding');
    } else {
      // Something happened in setting up the request
      console.error('BallDontLie API Request Error:', error.message);
      throw new Error(`Request setup error: ${error.message}`);
    }
  }

  /**
   * Get all NBA teams
   */
  async getTeams(): Promise<any[]> {
    try {
      const response = await this.client.get<BallDontLieResponse<BallDontLieTeam>>('/teams');
      
      return response.data.data.map(team => ({
        id: team.id.toString(),
        name: team.name,
        fullName: team.full_name,
        abbreviation: team.abbreviation,
        city: team.city,
        conference: team.conference,
        division: team.division
      }));
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  /**
   * Get a specific team by ID
   */
  async getTeam(teamId: string): Promise<any> {
    try {
      const response = await this.client.get<BallDontLieTeam>(`/teams/${teamId}`);
      const team = response.data;
      
      return {
        id: team.id.toString(),
        name: team.name,
        fullName: team.full_name,
        abbreviation: team.abbreviation,
        city: team.city,
        conference: team.conference,
        division: team.division
      };
    } catch (error) {
      console.error(`Error fetching team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get players with optional filters
   */
  async getPlayers(params?: {
    cursor?: number;
    per_page?: number;
    search?: string;
  }): Promise<{ data: any[]; meta: any }> {
    try {
      const response = await this.client.get<BallDontLieResponse<BallDontLiePlayer>>('/players', {
        params: {
          cursor: params?.cursor || 0,
          per_page: params?.per_page || 25,
          search: params?.search
        }
      });

      const players = response.data.data.map(player => ({
        id: player.id.toString(),
        firstName: player.first_name,
        lastName: player.last_name,
        position: player.position || 'N/A',
        height: player.height,
        weight: player.weight,
        jerseyNumber: player.jersey_number,
        college: player.college,
        country: player.country,
        draftYear: player.draft_year,
        draftRound: player.draft_round,
        draftNumber: player.draft_number,
        team: player.team ? {
          id: player.team.id.toString(),
          name: player.team.name,
          abbreviation: player.team.abbreviation,
          city: player.team.city
        } : null
      }));

      return {
        data: players,
        meta: {
          next_cursor: response.data.meta.next_cursor,
          per_page: response.data.meta.per_page
        }
      };
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  }

  /**
   * Get a specific player by ID
   */
  async getPlayer(playerId: string): Promise<any> {
    try {
      const response = await this.client.get<BallDontLiePlayer>(`/players/${playerId}`);
      const player = response.data;

      return {
        id: player.id.toString(),
        firstName: player.first_name,
        lastName: player.last_name,
        position: player.position || 'N/A',
        height: player.height,
        weight: player.weight,
        jerseyNumber: player.jersey_number,
        college: player.college,
        country: player.country,
        draftYear: player.draft_year,
        draftRound: player.draft_round,
        draftNumber: player.draft_number,
        team: player.team ? {
          id: player.team.id.toString(),
          name: player.team.name,
          abbreviation: player.team.abbreviation,
          city: player.team.city
        } : null
      };
    } catch (error) {
      console.error(`Error fetching player ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get games with optional filters
   */
  async getGames(params?: {
    dates?: string[];
    seasons?: number[];
    team_ids?: number[];
    cursor?: number;
    per_page?: number;
  }): Promise<{ data: any[]; meta: any }> {
    try {
      const response = await this.client.get<BallDontLieResponse<BallDontLieGame>>('/games', {
        params: {
          'dates[]': params?.dates,
          'seasons[]': params?.seasons,
          'team_ids[]': params?.team_ids,
          cursor: params?.cursor || 0,
          per_page: params?.per_page || 25
        }
      });

      const games = response.data.data.map(game => ({
        id: game.id.toString(),
        date: game.date,
        season: game.season,
        status: game.status,
        period: game.period,
        time: game.time,
        postseason: game.postseason,
        homeTeam: {
          id: game.home_team.id.toString(),
          name: game.home_team.name,
          abbreviation: game.home_team.abbreviation,
          city: game.home_team.city
        },
        awayTeam: {
          id: game.visitor_team.id.toString(),
          name: game.visitor_team.name,
          abbreviation: game.visitor_team.abbreviation,
          city: game.visitor_team.city
        },
        homeScore: game.home_team_score,
        awayScore: game.visitor_team_score
      }));

      return {
        data: games,
        meta: {
          next_cursor: response.data.meta.next_cursor,
          per_page: response.data.meta.per_page
        }
      };
    } catch (error) {
      console.error('Error fetching games:', error);
      throw error;
    }
  }

  /**
   * Get a specific game by ID
   */
  async getGame(gameId: string): Promise<any> {
    try {
      const response = await this.client.get<BallDontLieGame>(`/games/${gameId}`);
      const game = response.data;

      return {
        id: game.id.toString(),
        date: game.date,
        season: game.season,
        status: game.status,
        period: game.period,
        time: game.time,
        postseason: game.postseason,
        homeTeam: {
          id: game.home_team.id.toString(),
          name: game.home_team.name,
          abbreviation: game.home_team.abbreviation,
          city: game.home_team.city
        },
        awayTeam: {
          id: game.visitor_team.id.toString(),
          name: game.visitor_team.name,
          abbreviation: game.visitor_team.abbreviation,
          city: game.visitor_team.city
        },
        homeScore: game.home_team_score,
        awayScore: game.visitor_team_score
      };
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Search for players by name
   */
  async searchPlayers(searchTerm: string): Promise<any[]> {
    try {
      const response = await this.getPlayers({ search: searchTerm, per_page: 100 });
      return response.data;
    } catch (error) {
      console.error('Error searching players:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ballDontLieAdapter = new BallDontLieAdapter();
