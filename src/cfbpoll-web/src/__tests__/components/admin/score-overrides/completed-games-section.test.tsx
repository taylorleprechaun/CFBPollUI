import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CompletedGamesSection } from '../../../../components/admin';

const iowaAtNebraska = {
  awayPoints: 21,
  awayTeam: 'Iowa',
  awayTeamLogoURL: 'https://example.com/iowa.png',
  gameID: 401234561,
  hasOverride: false,
  homePoints: 24,
  homeTeam: 'Nebraska',
  homeTeamLogoURL: 'https://example.com/nebraska.png',
  seasonType: 'regular',
};

const overriddenGame = {
  awayPoints: 20,
  awayTeam: 'Texas',
  awayTeamLogoURL: 'https://example.com/texas.png',
  gameID: 401234562,
  hasOverride: true,
  homePoints: 24,
  homeTeam: 'Oklahoma',
  homeTeamLogoURL: 'https://example.com/oklahoma.png',
  seasonType: 'regular',
};

describe('CompletedGamesSection', () => {
  it('calls onSelectGame with the clicked game', async () => {
    const onSelectGame = vi.fn();
    render(<CompletedGamesSection games={[iowaAtNebraska]} isLoading={false} onSelectGame={onSelectGame} />);

    await userEvent.click(screen.getByRole('button', { name: 'Override Score' }));

    expect(onSelectGame).toHaveBeenCalledWith(iowaAtNebraska);
  });

  it('disables the action button when the game is missing required fields', () => {
    const incompleteGame = { ...iowaAtNebraska, gameID: null };
    render(<CompletedGamesSection games={[incompleteGame]} isLoading={false} onSelectGame={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Override Score' })).toBeDisabled();
  });

  it('labels the action button "Edit Override" for a game that already has one', () => {
    render(<CompletedGamesSection games={[overriddenGame]} isLoading={false} onSelectGame={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Edit Override' })).toBeInTheDocument();
  });

  it('renders a fallback initial when a team has no logo URL', () => {
    const gameWithoutLogos = { ...iowaAtNebraska, awayTeamLogoURL: null, homeTeamLogoURL: null };
    render(<CompletedGamesSection games={[gameWithoutLogos]} isLoading={false} onSelectGame={vi.fn()} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders a skeleton while loading', () => {
    render(<CompletedGamesSection games={[iowaAtNebraska]} isLoading={true} onSelectGame={vi.fn()} />);

    expect(screen.queryByText('Iowa @ Nebraska')).not.toBeInTheDocument();
  });

  it('renders an empty state when there are no completed games', () => {
    render(<CompletedGamesSection games={[]} isLoading={false} onSelectGame={vi.fn()} />);

    expect(screen.getByText('No completed games found for this week.')).toBeInTheDocument();
  });

  it('renders team logos for both teams', () => {
    render(<CompletedGamesSection games={[iowaAtNebraska]} isLoading={false} onSelectGame={vi.fn()} />);

    expect(screen.getByRole('img', { name: 'Iowa logo' })).toHaveAttribute('src', 'https://example.com/iowa.png');
    expect(screen.getByRole('img', { name: 'Nebraska logo' })).toHaveAttribute('src', 'https://example.com/nebraska.png');
  });

  it('renders the matchup and score for each game', () => {
    render(<CompletedGamesSection games={[iowaAtNebraska]} isLoading={false} onSelectGame={vi.fn()} />);

    expect(screen.getByText('Iowa @ Nebraska')).toBeInTheDocument();
    expect(screen.getByText('21 - 24')).toBeInTheDocument();
  });
});
