// NBA Data Types for TypeScript

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  number?: number;
  height?: string;
  weight?: number;
  dateOfBirth?: string;
  college?: string;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  founded?: number;
  conference?: 'Eastern' | 'Western';
  division?: string;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  season?: number;
}

export interface PlayerStats {
  playerId: string;
  season: number;
  gamesPlayed: number;
  pointsPerGame: number;
  assistsPerGame: number;
  reboundsPerGame: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  stealsPerGame?: number;
  blocksPerGame?: number;
  turnoversPerGame?: number;
  minutesPerGame?: number;
}

export interface TeamStats {
  teamId: string;
  season: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  pointsPerGame: number;
  pointsAgainst: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface NBAContextState {
  players: Player[];
  teams: Team[];
  games: Game[];
  selectedPlayer: Player | null;
  selectedTeam: Team | null;
  playerStats: Record<string, PlayerStats>;
  teamStats: Record<string, TeamStats>;
  loading: LoadingState;
}

export interface NBAContextActions {
  setPlayers: (players: Player[]) => void;
  setTeams: (teams: Team[]) => void;
  setGames: (games: Game[]) => void;
  setSelectedPlayer: (player: Player | null) => void;
  setSelectedTeam: (team: Team | null) => void;
  setPlayerStats: (playerId: string, stats: PlayerStats) => void;
  setTeamStats: (teamId: string, stats: TeamStats) => void;
  setLoading: (loading: LoadingState) => void;
}