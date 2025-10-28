import React from 'react';
import TeamCard from './TeamCard';
import type { Team } from '../types/nba';

interface TeamListProps {
  teams: Team[];
  loading?: boolean;
  error?: string | null;
  onTeamClick?: (team: Team) => void;
  searchTerm?: string;
  filterConference?: string;
  className?: string;
}

const TeamList: React.FC<TeamListProps> = ({
  teams,
  loading = false,
  error = null,
  onTeamClick,
  searchTerm = '',
  filterConference = '',
  className = ''
}) => {
  const filteredTeams = teams.filter(team => {
    // Only show teams with valid conferences (East or West)
    const hasValidConference = team.conference === 'East' || team.conference === 'West';
    if (!hasValidConference) return false;
    
    const matchesSearch = searchTerm === '' || 
      `${team.city} ${team.name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.abbreviation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConference = filterConference === '' || team.conference === filterConference;
    return matchesSearch && matchesConference;
  });

  if (loading) {
    return (
      <div className={`team-list ${className}`}>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading teams...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`team-list ${className}`}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (filteredTeams.length === 0) {
    return (
      <div className={`team-list ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg">No teams found</div>
          {(searchTerm || filterConference) && (
            <div className="text-gray-400 text-sm mt-2">
              Try adjusting your search or filters
            </div>
          )}
        </div>
      </div>
    );
  }

  // Group teams by conference if no filter is applied
  const groupedTeams = filterConference === '' ? 
    filteredTeams.reduce((acc, team) => {
      const conference = team.conference || 'Unknown';
      if (!acc[conference]) {
        acc[conference] = [];
      }
      acc[conference].push(team);
      return acc;
    }, {} as Record<string, Team[]>) : 
    { All: filteredTeams };

  return (
    <div className={`team-list ${className}`}>
      {Object.entries(groupedTeams).map(([conference, conferenceTeams]) => (
        <div key={conference} className="mb-8">
          {filterConference === '' && (
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {conference} Conference
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {conferenceTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onClick={onTeamClick}
                showStats={true}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamList;