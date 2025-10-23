import React from 'react';
import type { PlayerStats } from '../types/nba';

interface StatCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  type?: 'percentage' | 'decimal' | 'integer' | 'string';
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  subtitle, 
  type = 'decimal',
  trend,
  className = '' 
}) => {
  const formatValue = (val: number | string, type: string) => {
    if (typeof val === 'string') return val;
    
    switch (type) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'integer':
        return Math.round(val).toString();
      case 'decimal':
        return val.toFixed(1);
      default:
        return val.toString();
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗</span>;
      case 'down':
        return <span className="text-red-500">↘</span>;
      case 'neutral':
        return <span className="text-gray-500">→</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`stat-card bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900">
            {formatValue(value, type)}
          </div>
          <div className="text-sm font-medium text-gray-600 mt-1">
            {label}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">
              {subtitle}
            </div>
          )}
        </div>
        {trend && (
          <div className="ml-2">
            {getTrendIcon(trend)}
          </div>
        )}
      </div>
    </div>
  );
};

interface PlayerStatsGridProps {
  stats: PlayerStats;
  className?: string;
}

export const PlayerStatsGrid: React.FC<PlayerStatsGridProps> = ({ 
  stats, 
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      <StatCard
        label="Points Per Game"
        value={stats.pointsPerGame}
        type="decimal"
      />
      <StatCard
        label="Assists Per Game"
        value={stats.assistsPerGame}
        type="decimal"
      />
      <StatCard
        label="Rebounds Per Game"
        value={stats.reboundsPerGame}
        type="decimal"
      />
      <StatCard
        label="Field Goal %"
        value={stats.fieldGoalPercentage}
        type="percentage"
      />
      <StatCard
        label="3-Point %"
        value={stats.threePointPercentage}
        type="percentage"
      />
      <StatCard
        label="Free Throw %"
        value={stats.freeThrowPercentage}
        type="percentage"
      />
      <StatCard
        label="Games Played"
        value={stats.gamesPlayed}
        type="integer"
      />
      {stats.minutesPerGame && (
        <StatCard
          label="Minutes Per Game"
          value={stats.minutesPerGame}
          type="decimal"
        />
      )}
      {stats.stealsPerGame && (
        <StatCard
          label="Steals Per Game"
          value={stats.stealsPerGame}
          type="decimal"
        />
      )}
      {stats.blocksPerGame && (
        <StatCard
          label="Blocks Per Game"
          value={stats.blocksPerGame}
          type="decimal"
        />
      )}
      {stats.turnoversPerGame && (
        <StatCard
          label="Turnovers Per Game"
          value={stats.turnoversPerGame}
          type="decimal"
        />
      )}
    </div>
  );
};

export default StatCard;