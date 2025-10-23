import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamList from '../components/TeamList';
import type { Team } from '../types/nba';
import { apiClient, getErrorMessage } from '../lib/apiClient';

const TeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConference, setFilterConference] = useState('');

  const conferences = ['Eastern', 'Western'];

  useEffect(() => {
    let cancelled = false;

    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);

  const response = await apiClient.getTeams();
        if (!cancelled) {
          setTeams(response.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setTeams([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTeamClick = (team: Team) => {
    navigate(`/teams/${team.id}`);
  };

  return (
    <div className="teams-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">NBA Teams</h1>
        <p className="text-gray-600">
          Explore NBA teams, their rosters, and statistics
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Teams
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by team name or city..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="conference" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Conference
            </label>
            <select
              id="conference"
              value={filterConference}
              onChange={(e) => setFilterConference(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Conferences</option>
              {conferences.map(conference => (
                <option key={conference} value={conference}>{conference}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Team List */}
      <TeamList
        teams={teams}
        loading={loading}
        error={error}
        onTeamClick={handleTeamClick}
        searchTerm={searchTerm}
        filterConference={filterConference}
      />
    </div>
  );
};

export default TeamsPage;