import React from 'react';
import type { Game } from '../types/nba';

interface GameCardProps {
  game: Game;
  onClick?: (game: Game) => void;
  showDate?: boolean;
  className?: string;
}

const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  onClick, 
  showDate = true, 
  className = '' 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(game);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getWinner = () => {
    if (game.status !== 'completed' || game.homeScore === undefined || game.awayScore === undefined) {
      return null;
    }
    return game.homeScore > game.awayScore ? 'home' : 'away';
  };

  const winner = getWinner();
  const { date, time } = formatGameDate(game.date);

  return (
    <div 
      className={`game-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {showDate && (
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            {date} • {time}
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(game.status)}`}>
            {game.status.replace('-', ' ')}
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        {/* Away Team */}
        <div className={`flex-1 text-center ${winner === 'away' ? 'font-semibold' : ''}`}>
          <div className="text-sm font-medium text-gray-900">
            {game.awayTeam.city}
          </div>
          <div className="text-lg font-bold">
            {game.awayTeam.abbreviation}
          </div>
          {game.awayScore !== undefined && (
            <div className={`text-xl font-bold ${winner === 'away' ? 'text-green-600' : 'text-gray-600'}`}>
              {game.awayScore}
            </div>
          )}
        </div>
        
        {/* VS or Score Divider */}
        <div className="px-4">
          <div className="text-gray-400 font-medium">
            {game.status === 'scheduled' ? 'VS' : '@'}
          </div>
        </div>
        
        {/* Home Team */}
        <div className={`flex-1 text-center ${winner === 'home' ? 'font-semibold' : ''}`}>
          <div className="text-sm font-medium text-gray-900">
            {game.homeTeam.city}
          </div>
          <div className="text-lg font-bold">
            {game.homeTeam.abbreviation}
          </div>
          {game.homeScore !== undefined && (
            <div className={`text-xl font-bold ${winner === 'home' ? 'text-green-600' : 'text-gray-600'}`}>
              {game.homeScore}
            </div>
          )}
        </div>
      </div>
      
      {game.season && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 text-center">
            {game.season} Season
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCard;