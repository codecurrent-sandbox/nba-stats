import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamList from '../components/TeamList';
import type { Team } from '../types/nba';

const teams: Team[] = [
  { id: '1', name: 'Lakers', abbreviation: 'LAL', city: 'Los Angeles', conference: 'West', division: 'Pacific' },
  { id: '2', name: 'Celtics', abbreviation: 'BOS', city: 'Boston', conference: 'East', division: 'Atlantic' },
  { id: '3', name: 'Warriors', abbreviation: 'GSW', city: 'Golden State', conference: 'West', division: 'Pacific' },
];

describe('TeamList', () => {
  it('renders all team cards', () => {
    render(<TeamList teams={teams} />);
    expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
    expect(screen.getByText('Boston Celtics')).toBeInTheDocument();
    expect(screen.getByText('Golden State Warriors')).toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    render(<TeamList teams={[]} loading />);
    expect(screen.getByText('Loading teams...')).toBeInTheDocument();
  });

  it('does not render cards while loading', () => {
    render(<TeamList teams={teams} loading />);
    expect(screen.queryByText('Los Angeles Lakers')).not.toBeInTheDocument();
  });

  it('shows error message when error prop is set', () => {
    render(<TeamList teams={[]} error="Service unavailable" />);
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
  });

  it('shows "No teams found" for an empty list', () => {
    render(<TeamList teams={[]} />);
    expect(screen.getByText('No teams found')).toBeInTheDocument();
  });

  it('filters out teams with invalid conferences', () => {
    const invalidTeam: Team = { id: '99', name: 'Alien', abbreviation: 'ALN', city: 'Mars' };
    render(<TeamList teams={[...teams, invalidTeam]} />);
    expect(screen.queryByText('Mars Alien')).not.toBeInTheDocument();
  });

  it('shows filter hint when searchTerm causes empty result', () => {
    render(<TeamList teams={teams} searchTerm="zzz" />);
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });

  it('filters teams by searchTerm (team name, case-insensitive)', () => {
    render(<TeamList teams={teams} searchTerm="lakers" />);
    expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
    expect(screen.queryByText('Boston Celtics')).not.toBeInTheDocument();
  });

  it('filters teams by searchTerm (abbreviation)', () => {
    render(<TeamList teams={teams} searchTerm="BOS" />);
    expect(screen.getByText('Boston Celtics')).toBeInTheDocument();
    expect(screen.queryByText('Los Angeles Lakers')).not.toBeInTheDocument();
  });

  it('filters teams by conference', () => {
    render(<TeamList teams={teams} filterConference="East" />);
    expect(screen.getByText('Boston Celtics')).toBeInTheDocument();
    expect(screen.queryByText('Los Angeles Lakers')).not.toBeInTheDocument();
  });

  it('groups teams by conference when no filter is applied', () => {
    render(<TeamList teams={teams} />);
    expect(screen.getByText('West Conference')).toBeInTheDocument();
    expect(screen.getByText('East Conference')).toBeInTheDocument();
  });

  it('does not render conference headers when a conference filter is active', () => {
    render(<TeamList teams={teams} filterConference="West" />);
    expect(screen.queryByText('West Conference')).not.toBeInTheDocument();
  });

  it('calls onTeamClick when a team card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<TeamList teams={teams} onTeamClick={handleClick} />);
    await user.click(screen.getByText('Los Angeles Lakers'));
    expect(handleClick).toHaveBeenCalledWith(teams[0]);
  });

  it('applies custom className', () => {
    const { container } = render(<TeamList teams={teams} className="custom-list" />);
    expect(container.firstChild).toHaveClass('custom-list');
  });
});
