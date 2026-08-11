import type { ComponentProps } from 'react';

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { RankedTeam } from '../types';

import { RankingsPreview } from '../components/home/rankings-preview';

const createMockTeam = (overrides: Partial<RankedTeam> = {}): RankedTeam => ({
  rank: 1,
  rankDelta: null,
  teamName: 'Nebraska',
  logoURL: 'https://example.com/nebraska.png',
  conference: 'Big Ten',
  division: '',
  wins: 4,
  losses: 0,
  record: '4-0',
  rating: 140.55,
  weightedSOS: 0.51,
  sosRanking: 20,
  details: null,
  ...overrides,
});

const mockRankings: RankedTeam[] = [
  createMockTeam({ rank: 1, rankDelta: 2, teamName: 'Nebraska', rating: 140.55 }),
  createMockTeam({ rank: 2, rankDelta: -1, teamName: 'Iowa', logoURL: 'https://example.com/iowa.png', record: '3-1', rating: 138.21 }),
  createMockTeam({ rank: 3, rankDelta: 0, teamName: 'Florida', logoURL: 'https://example.com/florida.png', record: '3-1', rating: 135.09 }),
];

function renderPreview(props: Partial<ComponentProps<typeof RankingsPreview>> = {}) {
  return render(
    <MemoryRouter>
      <RankingsPreview
        isLoading={false}
        rankings={mockRankings}
        season={2026}
        weekLabel="Week 4"
        {...props}
      />
    </MemoryRouter>
  );
}

describe('RankingsPreview', () => {
  it('omits the season/week label when season or week is null', () => {
    renderPreview({ season: null, weekLabel: null });

    expect(screen.queryByText(/Season/)).not.toBeInTheDocument();
  });

  it('renders down-arrow styling for negative rank deltas', () => {
    renderPreview();

    const iowaRow = screen.getByText('Iowa').closest('tr')!;
    const deltaText = within(iowaRow).getByText('1');
    expect(deltaText.closest('span')).toHaveClass('text-red-600');
  });

  it('renders team rows with record and rating', () => {
    renderPreview();

    expect(screen.getByText('Nebraska')).toBeInTheDocument();
    expect(screen.getByText('4-0')).toBeInTheDocument();
    expect(screen.getByText('140.5500')).toBeInTheDocument();
  });

  it('renders the empty state message when there are no rankings', () => {
    renderPreview({ rankings: [] });

    expect(screen.getByText(/haven.t been published yet/i)).toBeInTheDocument();
  });

  it('renders the loading skeleton when isLoading is true', () => {
    const { container } = renderPreview({ isLoading: true });

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('Nebraska')).not.toBeInTheDocument();
  });

  it('renders the season and week label when both are provided', () => {
    renderPreview({ season: 2026, weekLabel: 'Week 4' });

    expect(screen.getByText(/Season 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Week 4/)).toBeInTheDocument();
  });

  it('renders the View Full Rankings link pointing to /rankings', () => {
    renderPreview();

    expect(screen.getByRole('link', { name: /View Full Rankings/ })).toHaveAttribute('href', '/rankings');
  });

  it('renders up-arrow styling for positive rank deltas', () => {
    renderPreview();

    const nebraskaRow = screen.getByText('Nebraska').closest('tr')!;
    const deltaText = within(nebraskaRow).getByText('2');
    expect(deltaText.closest('span')).toHaveClass('text-green-600');
  });
});
