import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { NBAContextState, NBAContextActions, Player, Team, Game, PlayerStats, TeamStats, LoadingState } from '../types/nba';

// Initial state
const initialState: NBAContextState = {
  players: [],
  teams: [],
  games: [],
  selectedPlayer: null,
  selectedTeam: null,
  playerStats: {},
  teamStats: {},
  loading: { isLoading: false, error: null }
};

// Action types
type NBAAction = 
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_TEAMS'; payload: Team[] }
  | { type: 'SET_GAMES'; payload: Game[] }
  | { type: 'SET_SELECTED_PLAYER'; payload: Player | null }
  | { type: 'SET_SELECTED_TEAM'; payload: Team | null }
  | { type: 'SET_PLAYER_STATS'; payload: { playerId: string; stats: PlayerStats } }
  | { type: 'SET_TEAM_STATS'; payload: { teamId: string; stats: TeamStats } }
  | { type: 'SET_LOADING'; payload: LoadingState };

// Reducer
const nbaReducer = (state: NBAContextState, action: NBAAction): NBAContextState => {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'SET_TEAMS':
      return { ...state, teams: action.payload };
    case 'SET_GAMES':
      return { ...state, games: action.payload };
    case 'SET_SELECTED_PLAYER':
      return { ...state, selectedPlayer: action.payload };
    case 'SET_SELECTED_TEAM':
      return { ...state, selectedTeam: action.payload };
    case 'SET_PLAYER_STATS':
      return {
        ...state,
        playerStats: {
          ...state.playerStats,
          [action.payload.playerId]: action.payload.stats
        }
      };
    case 'SET_TEAM_STATS':
      return {
        ...state,
        teamStats: {
          ...state.teamStats,
          [action.payload.teamId]: action.payload.stats
        }
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// Context
const NBAContext = createContext<{
  state: NBAContextState;
  actions: NBAContextActions;
} | null>(null);

// Provider component
interface NBAProviderProps {
  children: ReactNode;
}

export const NBAProvider: React.FC<NBAProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(nbaReducer, initialState);

  const actions: NBAContextActions = {
    setPlayers: (players: Player[]) => 
      dispatch({ type: 'SET_PLAYERS', payload: players }),
    setTeams: (teams: Team[]) => 
      dispatch({ type: 'SET_TEAMS', payload: teams }),
    setGames: (games: Game[]) => 
      dispatch({ type: 'SET_GAMES', payload: games }),
    setSelectedPlayer: (player: Player | null) => 
      dispatch({ type: 'SET_SELECTED_PLAYER', payload: player }),
    setSelectedTeam: (team: Team | null) => 
      dispatch({ type: 'SET_SELECTED_TEAM', payload: team }),
    setPlayerStats: (playerId: string, stats: PlayerStats) => 
      dispatch({ type: 'SET_PLAYER_STATS', payload: { playerId, stats } }),
    setTeamStats: (teamId: string, stats: TeamStats) => 
      dispatch({ type: 'SET_TEAM_STATS', payload: { teamId, stats } }),
    setLoading: (loading: LoadingState) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
  };

  return (
    <NBAContext.Provider value={{ state, actions }}>
      {children}
    </NBAContext.Provider>
  );
};

// Custom hook to use the NBA context
export const useNBA = () => {
  const context = useContext(NBAContext);
  if (!context) {
    throw new Error('useNBA must be used within an NBAProvider');
  }
  return context;
};

export default NBAContext;