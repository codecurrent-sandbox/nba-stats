import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameList from '../components/GameList';
import type { Game } from '../types/nba';
import { apiClient, getErrorMessage } from '../lib/apiClient';

const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeam, setFilterTeam] = useState('');

  const statuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];

  useEffect(() => {
    let cancelled = false;

    const fetchGames = async () => {
      try {
        setLoading(true);
        setError(null);

  const response = await apiClient.getGames({ limit: 50 });
        if (!cancelled) {
          setGames(response.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setGames([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchGames();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGameClick = (game: Game) => {
    navigate(`/games/${game.id}`);
  };

  return (
    <div className="games-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">NBA Games</h1>
        <p className="text-gray-600">
          View game schedules, live scores, and results
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Team
            </label>
            <input
              type="text"
              id="team"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              placeholder="Search by team name or abbreviation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Games</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Game List */}
      <GameList
        games={games}
        loading={loading}
        error={error}
        onGameClick={handleGameClick}
        filterStatus={filterStatus}
        filterTeam={filterTeam}
      />
    </div>
  );
};

export default GamesPage;