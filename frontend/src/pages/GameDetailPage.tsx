import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Game } from '../types/nba';
import { apiClient, getErrorMessage } from '../lib/apiClient';

const GameDetailPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const gameResponse = await apiClient.getGame(gameId);
        setGame(gameResponse);
      } catch (err) {
        setError(getErrorMessage(err));
        setGame(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading game details...</span>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">
          {error || 'Game not found'}
        </div>
        <Link to="/games" className="text-blue-600 hover:text-blue-800">
          ← Back to Games
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'final':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="game-detail-page">
      <div className="mb-6">
        <Link to="/games" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Games
        </Link>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Game Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Game Details</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(game.status)}`}>
                {game.status}
              </span>
            </div>
            <div className="text-gray-600">
              {formatDate(game.date)}
              {game.season && <span className="ml-4">Season: {game.season}</span>}
            </div>
          </div>

          {/* Matchup */}
          <div className="grid grid-cols-3 gap-8 items-center mb-8">
            {/* Away Team */}
            <div className="text-center">
              <Link 
                to={`/teams/${game.awayTeam.id}`}
                className="block hover:bg-gray-50 rounded-lg p-4 transition-colors"
              >
                <div className="text-sm text-gray-500 mb-2">Away</div>
                {game.awayTeam.logoUrl && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={game.awayTeam.logoUrl} 
                      alt={`${game.awayTeam.city} ${game.awayTeam.name} logo`}
                      className="w-24 h-24 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {game.awayTeam.city} {game.awayTeam.name}
                </div>
                <div className="text-gray-600">{game.awayTeam.abbreviation}</div>
                {game.awayScore !== undefined && (
                  <div className="text-4xl font-bold text-blue-600 mt-4">
                    {game.awayScore}
                  </div>
                )}
              </Link>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400">VS</div>
            </div>

            {/* Home Team */}
            <div className="text-center">
              <Link 
                to={`/teams/${game.homeTeam.id}`}
                className="block hover:bg-gray-50 rounded-lg p-4 transition-colors"
              >
                <div className="text-sm text-gray-500 mb-2">Home</div>
                {game.homeTeam.logoUrl && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={game.homeTeam.logoUrl} 
                      alt={`${game.homeTeam.city} ${game.homeTeam.name} logo`}
                      className="w-24 h-24 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {game.homeTeam.city} {game.homeTeam.name}
                </div>
                <div className="text-gray-600">{game.homeTeam.abbreviation}</div>
                {game.homeScore !== undefined && (
                  <div className="text-4xl font-bold text-red-600 mt-4">
                    {game.homeScore}
                  </div>
                )}
              </Link>
            </div>
          </div>

          {/* Winner/Result */}
          {game.status.toLowerCase() === 'completed' || game.status.toLowerCase() === 'final' && game.homeScore !== undefined && game.awayScore !== undefined && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Final Score</div>
              <div className="text-xl font-semibold text-gray-900">
                {game.homeScore > game.awayScore 
                  ? `${game.homeTeam.name} win ${game.homeScore} - ${game.awayScore}`
                  : game.awayScore > game.homeScore
                  ? `${game.awayTeam.name} win ${game.awayScore} - ${game.homeScore}`
                  : `Tie ${game.homeScore} - ${game.awayScore}`
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetailPage;
