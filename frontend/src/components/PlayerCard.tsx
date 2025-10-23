import React from 'react';
import type { Player } from '../types/nba';

interface PlayerCardProps {
  player: Player;
  onClick?: (player: Player) => void;
  className?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  onClick, 
  className = '' 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(player);
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'PG': return 'bg-blue-100 text-blue-800';
      case 'SG': return 'bg-green-100 text-green-800';
      case 'SF': return 'bg-yellow-100 text-yellow-800';
      case 'PF': return 'bg-red-100 text-red-800';
      case 'C': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className={`player-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {player.firstName} {player.lastName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPositionColor(player.position)}`}>
              {player.position}
            </span>
            {player.number && (
              <span className="text-sm text-gray-600">#{player.number}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3 space-y-1">
        {player.height && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Height:</span>
            <span className="font-medium">{player.height}</span>
          </div>
        )}
        {player.weight && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Weight:</span>
            <span className="font-medium">{player.weight} lbs</span>
          </div>
        )}
        {player.college && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">College:</span>
            <span className="font-medium">{player.college}</span>
          </div>
        )}
        {player.dateOfBirth && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Born:</span>
            <span className="font-medium">
              {new Date(player.dateOfBirth).getFullYear()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;