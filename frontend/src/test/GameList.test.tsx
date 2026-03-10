import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameList from '../components/GameList';
import type { Game, Team } from '../types/nba';

const teamA: Team = { id: 't1', name: 'Lakers', abbreviation: 'LAL', city: 'Los Angeles' };
const teamB: Team = { id: 't2', name: 'Celtics', abbreviation: 'BOS', city: 'Boston' };
const teamC: Team = { id: 't3', name: 'Warriors', abbreviation: 'GSW', city: 'Golden State' };

const games: Game[] = [
  {
    id: 'g1',
    homeTeam: teamA,
    awayTeam: teamB,
    date: '2025-01-15T20:00:00.000Z',
    homeScore: 110,
    awayScore: 105,
    status: 'completed',
  },
  {
    id: 'g2',
    homeTeam: teamC,
    awayTeam: teamA,
    date: '2025-01-16T21:00:00.000Z',
    status: 'scheduled',
  },
];

describe('GameList', () => {
  it('renders all game cards', () => {
    render(<GameList games={games} />);
    expect(screen.getAllByText('LAL').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('BOS')).toBeInTheDocument();
    expect(screen.getByText('GSW')).toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    render(<GameList games={[]} loading />);
    expect(screen.getByText('Loading games...')).toBeInTheDocument();
  });

  it('does not render cards while loading', () => {
    render(<GameList games={games} loading />);
    expect(screen.queryByText('LAL')).not.toBeInTheDocument();
  });

  it('shows error message when error prop is set', () => {
    render(<GameList games={[]} error="Failed to load games" />);
    expect(screen.getByText('Failed to load games')).toBeInTheDocument();
  });

  it('shows "No games found" for an empty list', () => {
    render(<GameList games={[]} />);
    expect(screen.getByText('No games found')).toBeInTheDocument();
  });

  it('shows filter hint when filterStatus causes empty result', () => {
    render(<GameList games={games} filterStatus="cancelled" />);
    expect(screen.getByText('No games found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('shows filter hint when filterTeam causes empty result', () => {
    render(<GameList games={games} filterTeam="XYZ" />);
    expect(screen.getByText('No games found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('does not show filter hint for empty list without active filters', () => {
    render(<GameList games={[]} />);
    expect(screen.queryByText('Try adjusting your filters')).not.toBeInTheDocument();
  });

  it('filters games by status', () => {
    render(<GameList games={games} filterStatus="completed" />);
    expect(screen.getByText('BOS')).toBeInTheDocument();
    expect(screen.queryByText('GSW')).not.toBeInTheDocument();
  });

  it('filters games by team abbreviation', () => {
    render(<GameList games={games} filterTeam="BOS" />);
    expect(screen.getByText('BOS')).toBeInTheDocument();
    expect(screen.queryByText('GSW')).not.toBeInTheDocument();
  });

  it('filters games by team name (partial, case-insensitive)', () => {
    render(<GameList games={games} filterTeam="warriors" />);
    expect(screen.getByText('GSW')).toBeInTheDocument();
    expect(screen.queryByText('BOS')).not.toBeInTheDocument();
  });

  it('groups games by date and renders a date heading', () => {
    render(<GameList games={games} />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('groups multiple games with the same date under a single heading', () => {
    const sameDay: Game[] = [
      { ...games[0], id: 'g-a', date: '2025-02-01T18:00:00.000Z' },
      { ...games[1], id: 'g-b', date: '2025-02-01T21:00:00.000Z' },
    ];
    render(<GameList games={sameDay} />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(1);
  });

  it('sorts games so the most recent date appears first', () => {
    render(<GameList games={games} />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    // g2 (Jan 16) should come before g1 (Jan 15)
    expect(headings[0].textContent).toMatch(/16/);
  });

  it('calls onGameClick when a game card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<GameList games={[games[0]]} onGameClick={handleClick} />);
    await user.click(screen.getByText('LAL'));
    expect(handleClick).toHaveBeenCalledWith(games[0]);
  });

  it('applies custom className', () => {
    const { container } = render(<GameList games={games} className="custom-list" />);
    expect(container.firstChild).toHaveClass('custom-list');
  });
});
