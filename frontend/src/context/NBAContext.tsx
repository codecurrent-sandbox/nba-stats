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
  loading: {
    isLoading: false,
    error: null,
  },
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
  | { type: 'SET_LOADING'; payload: LoadingState }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'UPDATE_PLAYER'; payload: Player }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'ADD_TEAM'; payload: Team }
  | { type: 'UPDATE_TEAM'; payload: Team }
  | { type: 'ADD_GAME'; payload: Game }
  | { type: 'UPDATE_GAME'; payload: Game }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

// Reducer function
const nbaReducer = (state: NBAContextState, action: NBAAction): NBAContextState => {
  switch (action.type) {
    case 'SET_PLAYERS':
      return {
        ...state,
        players: action.payload,
      };

    case 'SET_TEAMS':
      return {
        ...state,
        teams: action.payload,
      };

    case 'SET_GAMES':
      return {
        ...state,
        games: action.payload,
      };

    case 'SET_SELECTED_PLAYER':
      return {
        ...state,
        selectedPlayer: action.payload,
      };

    case 'SET_SELECTED_TEAM':
      return {
        ...state,
        selectedTeam: action.payload,
      };

    case 'SET_PLAYER_STATS':
      return {
        ...state,
        playerStats: {
          ...state.playerStats,
          [action.payload.playerId]: action.payload.stats,
        },
      };

    case 'SET_TEAM_STATS':
      return {
        ...state,
        teamStats: {
          ...state.teamStats,
          [action.payload.teamId]: action.payload.stats,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'ADD_PLAYER':
      return {
        ...state,
        players: [...state.players, action.payload],
      };

    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.payload.id ? action.payload : player
        ),
        selectedPlayer: state.selectedPlayer?.id === action.payload.id ? action.payload : state.selectedPlayer,
      };

    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter(player => player.id !== action.payload),
        selectedPlayer: state.selectedPlayer?.id === action.payload ? null : state.selectedPlayer,
      };

    case 'ADD_TEAM':
      return {
        ...state,
        teams: [...state.teams, action.payload],
      };

    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map(team =>
          team.id === action.payload.id ? action.payload : team
        ),
        selectedTeam: state.selectedTeam?.id === action.payload.id ? action.payload : state.selectedTeam,
      };

    case 'ADD_GAME':
      return {
        ...state,
        games: [...state.games, action.payload],
      };

    case 'UPDATE_GAME':
      return {
        ...state,
        games: state.games.map(game =>
          game.id === action.payload.id ? action.payload : game
        ),
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          error: null,
        },
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

// Context type combining state and actions
interface NBAContextType extends NBAContextState {
  actions: NBAContextActions;
}

// Create context
const NBAContext = createContext<NBAContextType | undefined>(undefined);

// Provider component
interface NBAProviderProps {
  children: ReactNode;
}

export const NBAProvider: React.FC<NBAProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(nbaReducer, initialState);

  // Action creators
  const actions: NBAContextActions = {
    setPlayers: (players: Player[]) => {
      dispatch({ type: 'SET_PLAYERS', payload: players });
    },

    setTeams: (teams: Team[]) => {
      dispatch({ type: 'SET_TEAMS', payload: teams });
    },

    setGames: (games: Game[]) => {
      dispatch({ type: 'SET_GAMES', payload: games });
    },

    setSelectedPlayer: (player: Player | null) => {
      dispatch({ type: 'SET_SELECTED_PLAYER', payload: player });
    },

    setSelectedTeam: (team: Team | null) => {
      dispatch({ type: 'SET_SELECTED_TEAM', payload: team });
    },

    setPlayerStats: (playerId: string, stats: PlayerStats) => {
      dispatch({ type: 'SET_PLAYER_STATS', payload: { playerId, stats } });
    },

    setTeamStats: (teamId: string, stats: TeamStats) => {
      dispatch({ type: 'SET_TEAM_STATS', payload: { teamId, stats } });
    },

    setLoading: (loading: LoadingState) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    },
  };

  // Additional utility actions
  const utilityActions = {
    addPlayer: (player: Player) => {
      dispatch({ type: 'ADD_PLAYER', payload: player });
    },

    updatePlayer: (player: Player) => {
      dispatch({ type: 'UPDATE_PLAYER', payload: player });
    },

    removePlayer: (playerId: string) => {
      dispatch({ type: 'REMOVE_PLAYER', payload: playerId });
    },

    addTeam: (team: Team) => {
      dispatch({ type: 'ADD_TEAM', payload: team });
    },

    updateTeam: (team: Team) => {
      dispatch({ type: 'UPDATE_TEAM', payload: team });
    },

    addGame: (game: Game) => {
      dispatch({ type: 'ADD_GAME', payload: game });
    },

    updateGame: (game: Game) => {
      dispatch({ type: 'UPDATE_GAME', payload: game });
    },

    clearError: () => {
      dispatch({ type: 'CLEAR_ERROR' });
    },

    resetState: () => {
      dispatch({ type: 'RESET_STATE' });
    },
  };

  const contextValue: NBAContextType = {
    ...state,
    actions: { ...actions, ...utilityActions },
  };

  return (
    <NBAContext.Provider value={contextValue}>
      {children}
    </NBAContext.Provider>
  );
};

// Custom hook to use the NBA context
export const useNBA = (): NBAContextType => {
  const context = useContext(NBAContext);
  if (context === undefined) {
    throw new Error('useNBA must be used within an NBAProvider');
  }
  return context;
};

// Selector hooks for specific parts of the state
export const usePlayers = () => {
  const { players, loading } = useNBA();
  return { players, loading };
};

export const useTeams = () => {
  const { teams, loading } = useNBA();
  return { teams, loading };
};

export const useGames = () => {
  const { games, loading } = useNBA();
  return { games, loading };
};

export const useSelectedPlayer = () => {
  const { selectedPlayer, actions } = useNBA();
  return {
    selectedPlayer,
    setSelectedPlayer: actions.setSelectedPlayer,
  };
};

export const useSelectedTeam = () => {
  const { selectedTeam, actions } = useNBA();
  return {
    selectedTeam,
    setSelectedTeam: actions.setSelectedTeam,
  };
};

export const usePlayerStats = (playerId?: string) => {
  const { playerStats } = useNBA();
  return playerId ? playerStats[playerId] : null;
};

export const useTeamStats = (teamId?: string) => {
  const { teamStats } = useNBA();
  return teamId ? teamStats[teamId] : null;
};

// Export the context for advanced use cases
export { NBAContext };
export default NBAProvider;