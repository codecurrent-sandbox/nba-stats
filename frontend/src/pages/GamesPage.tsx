import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameList from '../components/GameList';
import type { Game, Team } from '../types/nba';

const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeam, setFilterTeam] = useState('');

  const statuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchGames = async () => {
      try {
        setLoading(true);
        
        // Mock teams for game data
        const mockTeams: Team[] = [
          { id: '1', name: 'Lakers', abbreviation: 'LAL', city: 'Los Angeles', conference: 'Western' },
          { id: '2', name: 'Warriors', abbreviation: 'GSW', city: 'Golden State', conference: 'Western' },
          { id: '3', name: 'Celtics', abbreviation: 'BOS', city: 'Boston', conference: 'Eastern' },
          { id: '4', name: 'Heat', abbreviation: 'MIA', city: 'Miami', conference: 'Eastern' },
        ];

        // Mock game data
        const mockGames: Game[] = [
          {
            id: '1',
            homeTeam: mockTeams[0],
            awayTeam: mockTeams[1],
            date: '2025-10-23T20:00:00Z',
            homeScore: 108,
            awayScore: 112,
            status: 'completed',
            season: 2024
          },
          {
            id: '2',
            homeTeam: mockTeams[2],
            awayTeam: mockTeams[3],
            date: '2025-10-24T19:30:00Z',
            status: 'scheduled',
            season: 2024
          },
          {
            id: '3',
            homeTeam: mockTeams[1],
            awayTeam: mockTeams[2],
            date: '2025-10-22T21:00:00Z',
            homeScore: 95,
            awayScore: 89,
            status: 'completed',
            season: 2024
          }
        ];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));
        setGames(mockGames);
      } catch (err) {
        setError('Failed to load games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
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