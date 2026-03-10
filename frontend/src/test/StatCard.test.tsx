import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard, { PlayerStatsGrid } from '../components/StatCard';
import type { PlayerStats } from '../types/nba';

const baseStats: PlayerStats = {
  playerId: 'p1',
  season: 2025,
  gamesPlayed: 70,
  pointsPerGame: 27.5,
  assistsPerGame: 8.2,
  reboundsPerGame: 7.4,
  fieldGoalPercentage: 52.3,
  threePointPercentage: 38.1,
  freeThrowPercentage: 85.0,
};

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label="Points Per Game" value={27.5} />);
    expect(screen.getByText('Points Per Game')).toBeInTheDocument();
  });

  it('formats decimal value with one decimal place (default type)', () => {
    render(<StatCard label="PPG" value={27.5} />);
    expect(screen.getByText('27.5')).toBeInTheDocument();
  });

  it('formats percentage value with one decimal and % sign', () => {
    render(<StatCard label="FG%" value={52.3} type="percentage" />);
    expect(screen.getByText('52.3%')).toBeInTheDocument();
  });

  it('formats integer value by rounding', () => {
    render(<StatCard label="Games" value={70.9} type="integer" />);
    expect(screen.getByText('71')).toBeInTheDocument();
  });

  it('renders string value as-is', () => {
    render(<StatCard label="Season" value="2024-25" type="string" />);
    expect(screen.getByText('2024-25')).toBeInTheDocument();
  });

  it('renders a string value passed as number type but string actual', () => {
    render(<StatCard label="Name" value="Rookie" />);
    expect(screen.getByText('Rookie')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<StatCard label="PPG" value={27.5} subtitle="This season" />);
    expect(screen.getByText('This season')).toBeInTheDocument();
  });

  it('does not render subtitle when omitted', () => {
    render(<StatCard label="PPG" value={27.5} />);
    expect(screen.queryByText('This season')).not.toBeInTheDocument();
  });

  it('renders up trend arrow', () => {
    render(<StatCard label="PPG" value={27.5} trend="up" />);
    expect(screen.getByText('↗')).toBeInTheDocument();
  });

  it('renders down trend arrow', () => {
    render(<StatCard label="PPG" value={27.5} trend="down" />);
    expect(screen.getByText('↘')).toBeInTheDocument();
  });

  it('renders neutral trend arrow', () => {
    render(<StatCard label="PPG" value={27.5} trend="neutral" />);
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('does not render trend arrow when trend is absent', () => {
    render(<StatCard label="PPG" value={27.5} />);
    expect(screen.queryByText('↗')).not.toBeInTheDocument();
    expect(screen.queryByText('↘')).not.toBeInTheDocument();
    expect(screen.queryByText('→')).not.toBeInTheDocument();
  });

  it('applies custom className to the card', () => {
    const { container } = render(<StatCard label="PPG" value={27.5} className="my-stat" />);
    expect(container.firstChild).toHaveClass('my-stat');
  });

  it('renders a numeric value with unknown type using toString (default branch)', () => {
    // type cast to bypass TS to hit the switch default branch
    render(<StatCard label="Test" value={42} type={'other' as 'decimal'} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('getTrendIcon returns null for unknown trend value (default branch)', () => {
    // Pass a truthy but unrecognised trend to hit the switch default
    render(<StatCard label="PPG" value={27.5} trend={'sideways' as 'up'} />);
    // No trend arrow should appear
    expect(screen.queryByText('↗')).not.toBeInTheDocument();
    expect(screen.queryByText('↘')).not.toBeInTheDocument();
    expect(screen.queryByText('→')).not.toBeInTheDocument();
  });
});

describe('PlayerStatsGrid', () => {
  it('renders Points Per Game card', () => {
    render(<PlayerStatsGrid stats={baseStats} />);
    expect(screen.getByText('Points Per Game')).toBeInTheDocument();
    expect(screen.getByText('27.5')).toBeInTheDocument();
  });

  it('renders all core stat labels', () => {
    render(<PlayerStatsGrid stats={baseStats} />);
    expect(screen.getByText('Assists Per Game')).toBeInTheDocument();
    expect(screen.getByText('Rebounds Per Game')).toBeInTheDocument();
    expect(screen.getByText('Field Goal %')).toBeInTheDocument();
    expect(screen.getByText('3-Point %')).toBeInTheDocument();
    expect(screen.getByText('Free Throw %')).toBeInTheDocument();
    expect(screen.getByText('Games Played')).toBeInTheDocument();
  });

  it('renders optional steals stat when provided', () => {
    const stats = { ...baseStats, stealsPerGame: 1.5 };
    render(<PlayerStatsGrid stats={stats} />);
    expect(screen.getByText('Steals Per Game')).toBeInTheDocument();
  });

  it('does not render steals stat when absent', () => {
    render(<PlayerStatsGrid stats={baseStats} />);
    expect(screen.queryByText('Steals Per Game')).not.toBeInTheDocument();
  });

  it('renders optional blocks stat when provided', () => {
    const stats = { ...baseStats, blocksPerGame: 0.8 };
    render(<PlayerStatsGrid stats={stats} />);
    expect(screen.getByText('Blocks Per Game')).toBeInTheDocument();
  });

  it('renders optional turnovers stat when provided', () => {
    const stats = { ...baseStats, turnoversPerGame: 2.1 };
    render(<PlayerStatsGrid stats={stats} />);
    expect(screen.getByText('Turnovers Per Game')).toBeInTheDocument();
  });

  it('renders optional minutes stat when provided', () => {
    const stats = { ...baseStats, minutesPerGame: 36.2 };
    render(<PlayerStatsGrid stats={stats} />);
    expect(screen.getByText('Minutes Per Game')).toBeInTheDocument();
  });

  it('applies custom className to the grid', () => {
    const { container } = render(<PlayerStatsGrid stats={baseStats} className="custom-grid" />);
    expect(container.firstChild).toHaveClass('custom-grid');
  });
});
