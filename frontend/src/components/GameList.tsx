import React from 'react';
import GameCard from './GameCard';
import type { Game } from '../types/nba';

interface GameListProps {
  games: Game[];
  loading?: boolean;
  error?: string | null;
  onGameClick?: (game: Game) => void;
  filterStatus?: string;
  filterTeam?: string;
  className?: string;
}

const GameList: React.FC<GameListProps> = ({
  games,
  loading = false,
  error = null,
  onGameClick,
  filterStatus = '',
  filterTeam = '',
  className = ''
}) => {
  const filteredGames = games.filter(game => {
    const matchesStatus = filterStatus === '' || game.status === filterStatus;
    const matchesTeam = filterTeam === '' || 
      game.homeTeam.abbreviation === filterTeam || 
      game.awayTeam.abbreviation === filterTeam ||
      game.homeTeam.name.toLowerCase().includes(filterTeam.toLowerCase()) ||
      game.awayTeam.name.toLowerCase().includes(filterTeam.toLowerCase());
    return matchesStatus && matchesTeam;
  });

  // Sort games by date (most recent first)
  const sortedGames = [...filteredGames].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (loading) {
    return (
      <div className={`game-list ${className}`}>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading games...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`game-list ${className}`}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (sortedGames.length === 0) {
    return (
      <div className={`game-list ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg">No games found</div>
          {(filterStatus || filterTeam) && (
            <div className="text-gray-400 text-sm mt-2">
              Try adjusting your filters
            </div>
          )}
        </div>
      </div>
    );
  }

  // Group games by date
  const groupedGames = sortedGames.reduce((acc, game) => {
    const gameDate = new Date(game.date).toDateString();
    if (!acc[gameDate]) {
      acc[gameDate] = [];
    }
    acc[gameDate].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  return (
    <div className={`game-list ${className}`}>
      {Object.entries(groupedGames).map(([date, dateGames]) => (
        <div key={date} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dateGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={onGameClick}
                showDate={false} // Date is shown in group header
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameList;