import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamCard from '../components/TeamCard';
import type { Team } from '../types/nba';

const baseTeam: Team = {
  id: '1',
  name: 'Lakers',
  abbreviation: 'LAL',
  city: 'Los Angeles',
  conference: 'West',
  division: 'Pacific',
};

describe('TeamCard', () => {
  it('renders team city and name', () => {
    render(<TeamCard team={baseTeam} />);
    expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
  });

  it('renders team abbreviation', () => {
    render(<TeamCard team={baseTeam} />);
    expect(screen.getByText('LAL')).toBeInTheDocument();
  });

  it('renders conference badge for West', () => {
    render(<TeamCard team={baseTeam} />);
    const badge = screen.getByText('West');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders conference badge for East with correct color', () => {
    const team = { ...baseTeam, conference: 'East' as const };
    render(<TeamCard team={team} />);
    const badge = screen.getByText('East');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('does not render conference badge when conference is absent', () => {
    const team: Team = { id: '2', name: 'Team', abbreviation: 'TM', city: 'City' };
    render(<TeamCard team={team} />);
    expect(screen.queryByText('East')).not.toBeInTheDocument();
    expect(screen.queryByText('West')).not.toBeInTheDocument();
  });

  it('renders division when provided', () => {
    render(<TeamCard team={baseTeam} />);
    expect(screen.getByText('Division:')).toBeInTheDocument();
    expect(screen.getByText('Pacific')).toBeInTheDocument();
  });

  it('does not render division row when omitted', () => {
    const team = { ...baseTeam, division: undefined };
    render(<TeamCard team={team} />);
    expect(screen.queryByText('Division:')).not.toBeInTheDocument();
  });

  it('renders founded year when provided', () => {
    const team = { ...baseTeam, founded: 1947 };
    render(<TeamCard team={team} />);
    expect(screen.getByText('Founded:')).toBeInTheDocument();
    expect(screen.getByText('1947')).toBeInTheDocument();
  });

  it('does not render founded row when omitted', () => {
    render(<TeamCard team={baseTeam} />);
    expect(screen.queryByText('Founded:')).not.toBeInTheDocument();
  });

  it('renders logo image when logoUrl is provided', () => {
    const team = { ...baseTeam, logoUrl: 'https://example.com/lal.png' };
    render(<TeamCard team={team} />);
    const img = screen.getByAltText('Los Angeles Lakers logo');
    expect(img).toHaveAttribute('src', 'https://example.com/lal.png');
  });

  it('does not render logo when logoUrl is absent', () => {
    render(<TeamCard team={baseTeam} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders "Click to view detailed stats and roster" when showStats is true', () => {
    render(<TeamCard team={baseTeam} showStats />);
    expect(screen.getByText('Click to view detailed stats and roster')).toBeInTheDocument();
  });

  it('does not render stats hint when showStats is false (default)', () => {
    render(<TeamCard team={baseTeam} />);
    expect(screen.queryByText('Click to view detailed stats and roster')).not.toBeInTheDocument();
  });

  it('calls onClick with the team when card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<TeamCard team={baseTeam} onClick={handleClick} />);
    await user.click(screen.getByText('Los Angeles Lakers'));
    expect(handleClick).toHaveBeenCalledOnce();
    expect(handleClick).toHaveBeenCalledWith(baseTeam);
  });

  it('does not throw when clicked without onClick handler', async () => {
    const user = userEvent.setup();
    render(<TeamCard team={baseTeam} />);
    await user.click(screen.getByText('Los Angeles Lakers'));
  });

  it('applies custom className to the card', () => {
    const { container } = render(<TeamCard team={baseTeam} className="custom-team" />);
    expect(container.firstChild).toHaveClass('custom-team');
  });

  it('applies gray color class for unknown conference value (default branch)', () => {
    const team = { ...baseTeam, conference: 'North' as 'East' };
    render(<TeamCard team={team} />);
    const badge = screen.getByText('North');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('hides team logo on image load error', () => {
    const team = { ...baseTeam, logoUrl: 'https://example.com/lal.png' };
    render(<TeamCard team={team} />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(img).toHaveStyle({ display: 'none' });
  });
});
