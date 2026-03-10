import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerList from '../components/PlayerList';
import type { Player } from '../types/nba';

const players: Player[] = [
  { id: '1', firstName: 'LeBron', lastName: 'James', position: 'SF' },
  { id: '2', firstName: 'Stephen', lastName: 'Curry', position: 'PG' },
  { id: '3', firstName: 'Kevin', lastName: 'Durant', position: 'SF' },
];

describe('PlayerList', () => {
  it('renders all player cards', () => {
    render(<PlayerList players={players} />);
    expect(screen.getByText('LeBron James')).toBeInTheDocument();
    expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
    expect(screen.getByText('Kevin Durant')).toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    render(<PlayerList players={[]} loading />);
    expect(screen.getByText('Loading players...')).toBeInTheDocument();
  });

  it('does not render cards when loading', () => {
    render(<PlayerList players={players} loading />);
    expect(screen.queryByText('LeBron James')).not.toBeInTheDocument();
  });

  it('shows error message when error prop is set', () => {
    render(<PlayerList players={[]} error="Network error" />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows "No players found" when list is empty', () => {
    render(<PlayerList players={[]} />);
    expect(screen.getByText('No players found')).toBeInTheDocument();
  });

  it('shows filter hint when searchTerm causes empty result', () => {
    render(<PlayerList players={players} searchTerm="zzz" />);
    expect(screen.getByText('No players found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });

  it('shows filter hint when filterPosition causes empty result', () => {
    render(<PlayerList players={players} filterPosition="C" />);
    expect(screen.getByText('No players found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });

  it('does not show filter hint for completely empty list without active filters', () => {
    render(<PlayerList players={[]} />);
    expect(screen.queryByText('Try adjusting your search or filters')).not.toBeInTheDocument();
  });

  it('filters players by searchTerm (first name)', () => {
    render(<PlayerList players={players} searchTerm="LeBron" />);
    expect(screen.getByText('LeBron James')).toBeInTheDocument();
    expect(screen.queryByText('Stephen Curry')).not.toBeInTheDocument();
  });

  it('filters players by searchTerm (last name, case-insensitive)', () => {
    render(<PlayerList players={players} searchTerm="curry" />);
    expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
    expect(screen.queryByText('LeBron James')).not.toBeInTheDocument();
  });

  it('filters players by position', () => {
    render(<PlayerList players={players} filterPosition="PG" />);
    expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
    expect(screen.queryByText('LeBron James')).not.toBeInTheDocument();
  });

  it('filters combine searchTerm AND filterPosition', () => {
    render(<PlayerList players={players} searchTerm="Durant" filterPosition="SF" />);
    expect(screen.getByText('Kevin Durant')).toBeInTheDocument();
    expect(screen.queryByText('LeBron James')).not.toBeInTheDocument();
  });

  it('calls onPlayerClick when a player card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<PlayerList players={players} onPlayerClick={handleClick} />);
    await user.click(screen.getByText('LeBron James'));
    expect(handleClick).toHaveBeenCalledWith(players[0]);
  });

  it('applies custom className', () => {
    const { container } = render(<PlayerList players={players} className="custom-list" />);
    expect(container.firstChild).toHaveClass('custom-list');
  });
});
