import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navigation from '../components/Navigation';

const renderNav = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navigation />
    </MemoryRouter>
  );

describe('Navigation', () => {
  it('renders the NBA Stats brand link', () => {
    renderNav();
    expect(screen.getAllByText('NBA Stats').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all nav links', () => {
    renderNav();
    expect(screen.getAllByRole('link', { name: /Home/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /Players/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /Teams/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /Games/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('renders nav icons for each item', () => {
    renderNav();
    expect(screen.getAllByText('🏠').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('👤').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('🏀').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('📅').length).toBeGreaterThanOrEqual(1);
  });

  it('applies active class to the Home link when on "/"', () => {
    renderNav('/');
    // Desktop nav links come first in DOM order
    const homeLinks = screen.getAllByRole('link', { name: /Home/i });
    expect(homeLinks[0]).toHaveClass('border-blue-500', 'text-gray-900');
  });

  it('does not apply active class to Players link when on "/"', () => {
    renderNav('/');
    const playerLinks = screen.getAllByRole('link', { name: /Players/i });
    expect(playerLinks[0]).toHaveClass('border-transparent', 'text-gray-500');
  });

  it('applies active class to the Players link when on "/players"', () => {
    renderNav('/players');
    const playerLinks = screen.getAllByRole('link', { name: /Players/i });
    expect(playerLinks[0]).toHaveClass('border-blue-500', 'text-gray-900');
  });

  it('applies active class to the Teams link when on "/teams"', () => {
    renderNav('/teams');
    const teamLinks = screen.getAllByRole('link', { name: /Teams/i });
    expect(teamLinks[0]).toHaveClass('border-blue-500', 'text-gray-900');
  });

  it('applies active class to the Games link when on "/games"', () => {
    renderNav('/games');
    const gameLinks = screen.getAllByRole('link', { name: /Games/i });
    expect(gameLinks[0]).toHaveClass('border-blue-500', 'text-gray-900');
  });

  it('renders the dashboard subtitle text', () => {
    renderNav();
    expect(screen.getByText('NBA Statistics Dashboard')).toBeInTheDocument();
  });

  it('links have correct href attributes', () => {
    renderNav();
    const homeLinks = screen.getAllByRole('link', { name: /Home/i });
    expect(homeLinks[0]).toHaveAttribute('href', '/');

    const playerLinks = screen.getAllByRole('link', { name: /Players/i });
    expect(playerLinks[0]).toHaveAttribute('href', '/players');
  });
});
