import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerCard from '../components/PlayerCard';
import type { Player } from '../types/nba';

const basePlayer: Player = {
  id: '1',
  firstName: 'LeBron',
  lastName: 'James',
  position: 'SF',
};

describe('PlayerCard', () => {
  it('renders player full name', () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText('LeBron James')).toBeInTheDocument();
  });

  it('renders position badge', () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText('SF')).toBeInTheDocument();
  });

  it('applies correct color class for PG position', () => {
    const player = { ...basePlayer, position: 'PG' as const };
    render(<PlayerCard player={player} />);
    const badge = screen.getByText('PG');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('applies correct color class for SG position', () => {
    const player = { ...basePlayer, position: 'SG' as const };
    render(<PlayerCard player={player} />);
    const badge = screen.getByText('SG');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('applies correct color class for SF position', () => {
    const player = { ...basePlayer, position: 'SF' as const };
    render(<PlayerCard player={player} />);
    const badge = screen.getByText('SF');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('applies correct color class for PF position', () => {
    const player = { ...basePlayer, position: 'PF' as const };
    render(<PlayerCard player={player} />);
    const badge = screen.getByText('PF');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('applies correct color class for C position', () => {
    const player = { ...basePlayer, position: 'C' as const };
    render(<PlayerCard player={player} />);
    const badge = screen.getByText('C');
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
  });

  it('renders jersey number when provided', () => {
    const player = { ...basePlayer, number: 23 };
    render(<PlayerCard player={player} />);
    expect(screen.getByText('#23')).toBeInTheDocument();
  });

  it('does not render jersey number when omitted', () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
  });

  it('renders height when provided', () => {
    const player = { ...basePlayer, height: '6-9' };
    render(<PlayerCard player={player} />);
    expect(screen.getByText('Height:')).toBeInTheDocument();
    expect(screen.getByText('6-9')).toBeInTheDocument();
  });

  it('does not render height when omitted', () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.queryByText('Height:')).not.toBeInTheDocument();
  });

  it('renders weight with "lbs" suffix when provided', () => {
    const player = { ...basePlayer, weight: 250 };
    render(<PlayerCard player={player} />);
    expect(screen.getByText('Weight:')).toBeInTheDocument();
    expect(screen.getByText('250 lbs')).toBeInTheDocument();
  });

  it('does not render weight when omitted', () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.queryByText('Weight:')).not.toBeInTheDocument();
  });

  it('renders college when provided', () => {
    const player = { ...basePlayer, college: 'Duke' };
    render(<PlayerCard player={player} />);
    expect(screen.getByText('College:')).toBeInTheDocument();
    expect(screen.getByText('Duke')).toBeInTheDocument();
  });

  it('does not render college when omitted', () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.queryByText('College:')).not.toBeInTheDocument();
  });

  it('renders birth year when dateOfBirth is provided', () => {
    const player = { ...basePlayer, dateOfBirth: '1984-12-30' };
    render(<PlayerCard player={player} />);
    expect(screen.getByText('Born:')).toBeInTheDocument();
    expect(screen.getByText('1984')).toBeInTheDocument();
  });

  it('does not render born row when dateOfBirth is omitted', () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.queryByText('Born:')).not.toBeInTheDocument();
  });

  it('calls onClick with player when card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<PlayerCard player={basePlayer} onClick={handleClick} />);
    await user.click(screen.getByText('LeBron James'));
    expect(handleClick).toHaveBeenCalledOnce();
    expect(handleClick).toHaveBeenCalledWith(basePlayer);
  });

  it('does not throw when clicked without onClick handler', async () => {
    const user = userEvent.setup();
    render(<PlayerCard player={basePlayer} />);
    await user.click(screen.getByText('LeBron James'));
  });

  it('applies custom className to the card', () => {
    const { container } = render(<PlayerCard player={basePlayer} className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('applies gray color class for unknown position (default branch)', () => {
    const player = { ...basePlayer, position: 'G' as 'PG' };
    render(<PlayerCard player={player} />);
    const badge = screen.getByText('G');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });
});
