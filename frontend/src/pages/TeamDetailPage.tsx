import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Team, TeamStats } from '../types/nba';
import { apiClient, getErrorMessage } from '../lib/apiClient';

const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch team data
        const teamResponse = await apiClient.getTeam(teamId);
        setTeam(teamResponse);
        
        // Stats not available on free plan
        setTeamStats(null);
      } catch (err) {
        setError(getErrorMessage(err));
        setTeam(null);
        setTeamStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading team details...</span>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">
          {error || 'Team not found'}
        </div>
        <Link to="/teams" className="text-blue-600 hover:text-blue-800">
          ← Back to Teams
        </Link>
      </div>
    );
  }

  const getConferenceColor = (conference?: string) => {
    switch (conference) {
      case 'Eastern': return 'bg-blue-100 text-blue-800';
      case 'Western': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="team-detail-page">
      <div className="mb-6">
        <Link to="/teams" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Teams
        </Link>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {team.city} {team.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                {team.conference && (
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getConferenceColor(team.conference)}`}>
                    {team.conference} Conference
                  </span>
                )}
                <span className="text-lg font-semibold text-gray-700">
                  {team.abbreviation}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div>
              <div className="text-sm text-gray-600">Team Name</div>
              <div className="text-lg font-semibold">{team.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">City</div>
              <div className="text-lg font-semibold">{team.city}</div>
            </div>
            {team.division && (
              <div>
                <div className="text-sm text-gray-600">Division</div>
                <div className="text-lg font-semibold">{team.division}</div>
              </div>
            )}
            {team.founded && (
              <div>
                <div className="text-sm text-gray-600">Founded</div>
                <div className="text-lg font-semibold">{team.founded}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {teamStats && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {teamStats.season} Season Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Games Played</div>
              <div className="text-2xl font-bold text-gray-900">{teamStats.gamesPlayed}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Wins</div>
              <div className="text-2xl font-bold text-green-600">{teamStats.wins}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Losses</div>
              <div className="text-2xl font-bold text-red-600">{teamStats.losses}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Win %</div>
              <div className="text-2xl font-bold text-blue-600">
                {(teamStats.winPercentage * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">PPG</div>
              <div className="text-2xl font-bold text-gray-900">
                {teamStats.pointsPerGame.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Opp PPG</div>
              <div className="text-2xl font-bold text-gray-900">
                {teamStats.pointsAgainst.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">FG%</div>
              <div className="text-2xl font-bold text-gray-900">
                {(teamStats.fieldGoalPercentage * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">3P%</div>
              <div className="text-2xl font-bold text-gray-900">
                {(teamStats.threePointPercentage * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailPage;
