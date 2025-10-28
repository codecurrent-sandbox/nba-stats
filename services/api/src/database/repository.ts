import { query } from './db.ts';

export interface Team {
  id: number;
  name: string;
  full_name?: string;
  abbreviation: string;
  city: string;
  conference?: string;
  division?: string;
}

export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position?: string;
  height?: string;
  weight?: string;
  jersey_number?: string;
  college?: string;
  country?: string;
  draft_year?: number;
  draft_round?: number;
  draft_number?: number;
  team_id?: number;
}

export interface Game {
  id: number;
  date: string;
  season?: number;
  status?: string;
  period?: number;
  time?: string;
  postseason?: boolean;
  home_team_id: number;
  visitor_team_id: number;
  home_team_score?: number;
  visitor_team_score?: number;
}

class Repository {
  // TEAMS
  async getAllTeams(): Promise<Team[]> {
    const result = await query('SELECT * FROM teams ORDER BY name');
    return result.rows;
  }

  async getTeamById(id: number): Promise<Team | null> {
    const result = await query('SELECT * FROM teams WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async upsertTeam(team: Team): Promise<Team> {
    const result = await query(
      `INSERT INTO teams (id, name, full_name, abbreviation, city, conference, division)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         full_name = EXCLUDED.full_name,
         abbreviation = EXCLUDED.abbreviation,
         city = EXCLUDED.city,
         conference = EXCLUDED.conference,
         division = EXCLUDED.division,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [team.id, team.name, team.full_name, team.abbreviation, team.city, team.conference, team.division]
    );
    return result.rows[0];
  }

  async upsertTeams(teams: Team[]): Promise<void> {
    for (const team of teams) {
      await this.upsertTeam(team);
    }
  }

  // PLAYERS
  async getAllPlayers(limit = 50): Promise<Player[]> {
    const result = await query('SELECT * FROM players ORDER BY last_name, first_name LIMIT $1', [limit]);
    return result.rows;
  }

  async getPlayerById(id: number): Promise<Player | null> {
    const result = await query('SELECT * FROM players WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    const result = await query('SELECT * FROM players WHERE team_id = $1 ORDER BY last_name', [teamId]);
    return result.rows;
  }

  async upsertPlayer(player: Player): Promise<Player> {
    const result = await query(
      `INSERT INTO players (id, first_name, last_name, position, height, weight, jersey_number, 
         college, country, draft_year, draft_round, draft_number, team_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         position = EXCLUDED.position,
         height = EXCLUDED.height,
         weight = EXCLUDED.weight,
         jersey_number = EXCLUDED.jersey_number,
         college = EXCLUDED.college,
         country = EXCLUDED.country,
         draft_year = EXCLUDED.draft_year,
         draft_round = EXCLUDED.draft_round,
         draft_number = EXCLUDED.draft_number,
         team_id = EXCLUDED.team_id,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        player.id, player.first_name, player.last_name, player.position,
        player.height, player.weight, player.jersey_number, player.college,
        player.country, player.draft_year, player.draft_round, player.draft_number,
        player.team_id
      ]
    );
    return result.rows[0];
  }

  async upsertPlayers(players: Player[]): Promise<void> {
    for (const player of players) {
      await this.upsertPlayer(player);
    }
  }

  // GAMES
  async getAllGames(limit = 50, season?: number): Promise<Game[]> {
    let queryText = 'SELECT * FROM games';
    const params: any[] = [];
    
    if (season) {
      queryText += ' WHERE season = $1';
      params.push(season);
    }
    
    queryText += ' ORDER BY date DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await query(queryText, params);
    return result.rows;
  }

  async getGameById(id: number): Promise<Game | null> {
    const result = await query('SELECT * FROM games WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async upsertGame(game: Game): Promise<Game> {
    const result = await query(
      `INSERT INTO games (id, date, season, status, period, time, postseason, 
         home_team_id, visitor_team_id, home_team_score, visitor_team_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         date = EXCLUDED.date,
         season = EXCLUDED.season,
         status = EXCLUDED.status,
         period = EXCLUDED.period,
         time = EXCLUDED.time,
         postseason = EXCLUDED.postseason,
         home_team_id = EXCLUDED.home_team_id,
         visitor_team_id = EXCLUDED.visitor_team_id,
         home_team_score = EXCLUDED.home_team_score,
         visitor_team_score = EXCLUDED.visitor_team_score,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        game.id, game.date, game.season, game.status, game.period, game.time,
        game.postseason, game.home_team_id, game.visitor_team_id,
        game.home_team_score, game.visitor_team_score
      ]
    );
    return result.rows[0];
  }

  async upsertGames(games: Game[]): Promise<void> {
    for (const game of games) {
      await this.upsertGame(game);
    }
  }

  // Utility: Check if we have data
  async hasTeams(): Promise<boolean> {
    const result = await query('SELECT COUNT(*) as count FROM teams');
    return parseInt(result.rows[0].count) > 0;
  }

  async hasPlayers(): Promise<boolean> {
    const result = await query('SELECT COUNT(*) as count FROM players');
    return parseInt(result.rows[0].count) > 0;
  }

  async hasGames(): Promise<boolean> {
    const result = await query('SELECT COUNT(*) as count FROM games');
    return parseInt(result.rows[0].count) > 0;
  }
}

export const repository = new Repository();
