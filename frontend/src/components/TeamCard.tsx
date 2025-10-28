import React from 'react';
import type { Team } from '../types/nba';

interface TeamCardProps {
  team: Team;
  onClick?: (team: Team) => void;
  showStats?: boolean;
  className?: string;
}

const TeamCard: React.FC<TeamCardProps> = ({ 
  team, 
  onClick, 
  showStats = false, 
  className = '' 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(team);
    }
  };

  const getConferenceColor = (conference?: string) => {
    switch (conference) {
      case 'East': return 'bg-blue-100 text-blue-800';
      case 'West': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className={`team-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        {team.logoUrl && (
          <div className="flex-shrink-0">
            <img 
              src={team.logoUrl} 
              alt={`${team.city} ${team.name} logo`}
              className="w-16 h-16 object-contain"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {team.city} {team.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-1 text-xs font-bold rounded bg-gray-200 text-gray-800">
              {team.abbreviation}
            </span>
            {team.conference && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConferenceColor(team.conference)}`}>
                {team.conference}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3 space-y-1">
        {team.founded && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Founded:</span>
            <span className="font-medium">{team.founded}</span>
          </div>
        )}
        {team.division && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Division:</span>
            <span className="font-medium">{team.division}</span>
          </div>
        )}
      </div>
      
      {showStats && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            Click to view detailed stats and roster
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCard;