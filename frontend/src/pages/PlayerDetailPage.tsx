import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Player, PlayerStats } from '../types/nba';
import { PlayerStatsGrid } from '../components/StatCard';
import { apiClient, getErrorMessage } from '../lib/apiClient';

const PlayerDetailPage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch player data
        const playerResponse = await apiClient.getPlayer(playerId);
        setPlayer(playerResponse);
        
        // Stats not available on free plan
        setPlayerStats(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setPlayer(null);
        setPlayerStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading player details...</span>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">
          {error || 'Player not found'}
        </div>
        <Link to="/players" className="text-blue-600 hover:text-blue-800">
          ← Back to Players
        </Link>
      </div>
    );
  }

  return (
    <div className="player-detail-page">
      <div className="mb-6">
        <Link to="/players" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Players
        </Link>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {player.firstName} {player.lastName}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${{
                  'PG': 'bg-blue-100 text-blue-800',
                  'SG': 'bg-green-100 text-green-800',
                  'SF': 'bg-yellow-100 text-yellow-800',
                  'PF': 'bg-red-100 text-red-800',
                  'C': 'bg-purple-100 text-purple-800'
                }[player.position] || 'bg-gray-100 text-gray-800'}`}>
                  {player.position}
                </span>
                {player.number && (
                  <span className="text-lg font-semibold text-gray-700">
                    #{player.number}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            {player.height && (
              <div>
                <div className="text-sm text-gray-600">Height</div>
                <div className="text-lg font-semibold">{player.height}</div>
              </div>
            )}
            {player.weight && (
              <div>
                <div className="text-sm text-gray-600">Weight</div>
                <div className="text-lg font-semibold">{player.weight} lbs</div>
              </div>
            )}
            {player.college && (
              <div>
                <div className="text-sm text-gray-600">College</div>
                <div className="text-lg font-semibold">{player.college}</div>
              </div>
            )}
            {player.dateOfBirth && (
              <div>
                <div className="text-sm text-gray-600">Born</div>
                <div className="text-lg font-semibold">
                  {new Date(player.dateOfBirth).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {playerStats && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            2024 Season Statistics
          </h2>
          <PlayerStatsGrid stats={playerStats} />
        </div>
      )}
    </div>
  );
};

export default PlayerDetailPage;