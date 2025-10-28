import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerList from '../components/PlayerList';
import type { Player } from '../types/nba';
import { apiClient, getErrorMessage } from '../lib/apiClient';

const PlayersPage: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');

  const positions = ['C', 'F', 'G', 'C-F', 'G-F'];

  useEffect(() => {
    let cancelled = false;

    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);

  const response = await apiClient.getPlayers({ limit: 50 });
        if (!cancelled) {
          setPlayers(response.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setPlayers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPlayers();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePlayerClick = (player: Player) => {
    navigate(`/players/${player.id}`);
  };

  return (
    <div className="players-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">NBA Players</h1>
        <p className="text-gray-600">
          Explore profiles and statistics of NBA players
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Players
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Position
            </label>
            <select
              id="position"
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Positions</option>
              {positions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Player List */}
      <PlayerList
        players={players}
        loading={loading}
        error={error}
        onPlayerClick={handlePlayerClick}
        searchTerm={searchTerm}
        filterPosition={filterPosition}
      />
    </div>
  );
};

export default PlayersPage;