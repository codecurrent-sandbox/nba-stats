import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameCard from '../components/GameCard';
import type { Game, Team } from '../types/nba';

const homeTeam: Team = {
  id: 'h1',
  name: 'Lakers',
  abbreviation: 'LAL',
  city: 'Los Angeles',
};

const awayTeam: Team = {
  id: 'a1',
  name: 'Celtics',
  abbreviation: 'BOS',
  city: 'Boston',
};

const scheduledGame: Game = {
  id: 'g1',
  homeTeam,
  awayTeam,
  date: '2025-01-15T19:30:00.000Z',
  status: 'scheduled',
};

const completedGame: Game = {
  id: 'g2',
  homeTeam,
  awayTeam,
  date: '2025-01-10T19:30:00.000Z',
  homeScore: 110,
  awayScore: 105,
  status: 'completed',
};

describe('GameCard', () => {
  it('renders home team abbreviation', () => {
    render(<GameCard game={scheduledGame} />);
    expect(screen.getByText('LAL')).toBeInTheDocument();
  });

  it('renders away team abbreviation', () => {
    render(<GameCard game={scheduledGame} />);
    expect(screen.getByText('BOS')).toBeInTheDocument();
  });

  it('renders home team city', () => {
    render(<GameCard game={scheduledGame} />);
    expect(screen.getByText('Los Angeles')).toBeInTheDocument();
  });

  it('renders away team city', () => {
    render(<GameCard game={scheduledGame} />);
    expect(screen.getByText('Boston')).toBeInTheDocument();
  });

  it('shows "VS" divider for a scheduled game', () => {
    render(<GameCard game={scheduledGame} />);
    expect(screen.getByText('VS')).toBeInTheDocument();
  });

  it('shows "@" divider for a non-scheduled game', () => {
    render(<GameCard game={completedGame} />);
    expect(screen.getByText('@')).toBeInTheDocument();
  });

  it('renders scores for a completed game', () => {
    render(<GameCard game={completedGame} />);
    expect(screen.getByText('110')).toBeInTheDocument();
    expect(screen.getByText('105')).toBeInTheDocument();
  });

  it('does not render scores for a scheduled game', () => {
    render(<GameCard game={scheduledGame} />);
    expect(screen.queryByText('110')).not.toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<GameCard game={scheduledGame} />);
    expect(screen.getByText('scheduled')).toBeInTheDocument();
  });

  it('renders "in progress" status badge (hyphen replaced by space)', () => {
    const game: Game = { ...scheduledGame, status: 'in-progress' };
    render(<GameCard game={game} />);
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });

  it('applies green badge for completed status', () => {
    render(<GameCard game={completedGame} />);
    const badge = screen.getByText('completed');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('applies blue badge for scheduled status', () => {
    render(<GameCard game={scheduledGame} />);
    const badge = screen.getByText('scheduled');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('applies yellow badge for in-progress status', () => {
    const game: Game = { ...scheduledGame, status: 'in-progress' };
    render(<GameCard game={game} />);
    const badge = screen.getByText('in progress');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('applies red badge for cancelled status', () => {
    const game: Game = { ...scheduledGame, status: 'cancelled' };
    render(<GameCard game={game} />);
    const badge = screen.getByText('cancelled');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('applies gray badge for unknown/default status', () => {
    const game: Game = { ...scheduledGame, status: 'postponed' as 'scheduled' };
    render(<GameCard game={game} />);
    const badge = screen.getByText('postponed');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('shows date/time row when showDate is true (default)', () => {
    render(<GameCard game={scheduledGame} />);
    // status badge is inside the date row — just verify it is present
    expect(screen.getByText('scheduled')).toBeInTheDocument();
  });

  it('hides the date/time row when showDate is false', () => {
    render(<GameCard game={scheduledGame} showDate={false} />);
    expect(screen.queryByText('scheduled')).not.toBeInTheDocument();
  });

  it('renders season information when provided', () => {
    const game = { ...completedGame, season: 2025 };
    render(<GameCard game={game} />);
    expect(screen.getByText('2025 Season')).toBeInTheDocument();
  });

  it('does not render season row when season is absent', () => {
    render(<GameCard game={completedGame} />);
    expect(screen.queryByText(/Season/)).not.toBeInTheDocument();
  });

  it('highlights winning team score in green', () => {
    render(<GameCard game={completedGame} />);
    const winnerScore = screen.getByText('110');
    expect(winnerScore).toHaveClass('text-green-600');
  });

  it('calls onClick with game when card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<GameCard game={scheduledGame} onClick={handleClick} />);
    await user.click(screen.getByText('LAL'));
    expect(handleClick).toHaveBeenCalledOnce();
    expect(handleClick).toHaveBeenCalledWith(scheduledGame);
  });

  it('does not throw when clicked without onClick handler', async () => {
    const user = userEvent.setup();
    render(<GameCard game={scheduledGame} />);
    await user.click(screen.getByText('LAL'));
  });

  it('applies custom className to the card', () => {
    const { container } = render(<GameCard game={scheduledGame} className="custom-game" />);
    expect(container.firstChild).toHaveClass('custom-game');
  });

  it('renders logos for both teams when logoUrl is set', () => {
    const game: Game = {
      ...completedGame,
      homeTeam: { ...homeTeam, logoUrl: 'https://example.com/lal.png' },
      awayTeam: { ...awayTeam, logoUrl: 'https://example.com/bos.png' },
    };
    render(<GameCard game={game} />);
    expect(screen.getByAltText('Boston Celtics logo')).toHaveAttribute('src', 'https://example.com/bos.png');
    expect(screen.getByAltText('Los Angeles Lakers logo')).toHaveAttribute('src', 'https://example.com/lal.png');
  });

  it('hides team logo on image load error', () => {
    const game: Game = {
      ...completedGame,
      homeTeam: { ...homeTeam, logoUrl: 'https://example.com/lal.png' },
      awayTeam: { ...awayTeam, logoUrl: 'https://example.com/bos.png' },
    };
    render(<GameCard game={game} />);
    const imgs = screen.getAllByRole('img');
    imgs.forEach((img) => {
      fireEvent.error(img);
      expect(img).toHaveStyle({ display: 'none' });
    });
  });

  it('highlights away team score in green when away team wins', () => {
    const game: Game = { ...completedGame, homeScore: 100, awayScore: 115 };
    render(<GameCard game={game} />);
    const winnerScore = screen.getByText('115');
    expect(winnerScore).toHaveClass('text-green-600');
  });
});
