import React from 'react';
import PlayerCard from './PlayerCard';
import type { Player } from '../types/nba';

interface PlayerListProps {
  players: Player[];
  loading?: boolean;
  error?: string | null;
  onPlayerClick?: (player: Player) => void;
  searchTerm?: string;
  filterPosition?: string;
  className?: string;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  loading = false,
  error = null,
  onPlayerClick,
  searchTerm = '',
  filterPosition = '',
  className = ''
}) => {
  const filteredPlayers = players.filter(player => {
    const matchesSearch = searchTerm === '' || 
      `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = filterPosition === '' || player.position === filterPosition;
    return matchesSearch && matchesPosition;
  });

  if (loading) {
    return (
      <div className={`player-list ${className}`}>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading players...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`player-list ${className}`}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (filteredPlayers.length === 0) {
    return (
      <div className={`player-list ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg">No players found</div>
          {(searchTerm || filterPosition) && (
            <div className="text-gray-400 text-sm mt-2">
              Try adjusting your search or filters
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`player-list ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onClick={onPlayerClick}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerList;