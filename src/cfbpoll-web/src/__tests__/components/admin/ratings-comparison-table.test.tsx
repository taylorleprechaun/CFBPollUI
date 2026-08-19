import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { RankedTeam } from '../../../types';

import { RatingsComparisonTable } from '../../../components/admin';

vi.mock('../../../hooks/use-experimental-mutations', () => ({
  useExportExperimental: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const createMockTeam = (overrides: Partial<RankedTeam> = {}): RankedTeam => ({
  rank: 1,
  rankDelta: null,
  teamName: 'Iowa',
  logoURL: 'https://example.com/iowa.png',
  conference: 'Big Ten',
  division: '',
  wins: 5,
  losses: 1,
  record: '5-1',
  rating: 30.1234,
  weightedSOS: 0.5,
  sosRanking: 1,
  ...overrides,
});

function renderTable(entries: React.ComponentProps<typeof RatingsComparisonTable>['entries']) {
  return render(
    <MemoryRouter>
      <RatingsComparisonTable entries={entries} season={2024} token="test-token" week={5} />
    </MemoryRouter>
  );
}

describe('RatingsComparisonTable', () => {
  it('renders a download excel button per algorithm column', () => {
    renderTable([
      { algorithmVersion: 'V1', result: { algorithmVersion: 'V1', rankings: { season: 2024, week: 5, rankings: [createMockTeam()] } } },
      { algorithmVersion: 'V2', result: { algorithmVersion: 'V2', rankings: { season: 2024, week: 5, rankings: [createMockTeam({ teamName: 'Nebraska' })] } } },
    ]);

    expect(screen.getAllByText('Download Excel')).toHaveLength(2);
  });

  it('renders an em-dash placeholder for a row a shorter algorithm result set has no team for', () => {
    renderTable([
      {
        algorithmVersion: 'V1',
        result: {
          algorithmVersion: 'V1',
          rankings: { season: 2024, week: 5, rankings: [createMockTeam(), createMockTeam({ rank: 2, teamName: 'Nebraska' })] },
        },
      },
      { algorithmVersion: 'V2', result: { algorithmVersion: 'V2', rankings: { season: 2024, week: 5, rankings: [createMockTeam({ teamName: 'Michigan' })] } } },
    ]);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders rank-indexed rows with each algorithm column showing its own team at that rank', () => {
    renderTable([
      { algorithmVersion: 'V1', result: { algorithmVersion: 'V1', rankings: { season: 2024, week: 5, rankings: [createMockTeam({ teamName: 'Iowa' })] } } },
      { algorithmVersion: 'V2', result: { algorithmVersion: 'V2', rankings: { season: 2024, week: 5, rankings: [createMockTeam({ teamName: 'Nebraska' })] } } },
    ]);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Iowa')).toBeInTheDocument();
    expect(screen.getByText('Nebraska')).toBeInTheDocument();
  });
});
