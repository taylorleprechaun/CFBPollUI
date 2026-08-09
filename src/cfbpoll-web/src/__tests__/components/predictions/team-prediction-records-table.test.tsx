import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { TeamPredictionRecord } from '../../../types';

import { TeamPredictionRecordsTable } from '../../../components/predictions/team-prediction-records-table';

vi.mock('../../../components/predictions/team-prediction-record-card', () => ({
  TeamPredictionRecordCard: ({ record, season }: { record: TeamPredictionRecord; season: number }) => (
    <div data-testid="team-prediction-record-card" data-team-name={record.teamName} data-season={String(season)} />
  ),
}));

function buildRecord(overrides: Partial<TeamPredictionRecord> = {}): TeamPredictionRecord {
  return {
    actualLosses: 3,
    actualWins: 7,
    gradedGameCount: 10,
    logoURL: 'https://example.com/logo.png',
    predictedLosses: 2,
    predictedWins: 8,
    teamName: 'Notre Dame',
    ...overrides,
  };
}

function renderTable(records: TeamPredictionRecord[], overrides: { emptyMessage?: string; isLoading?: boolean; } = {}) {
  return render(
    <MemoryRouter>
      <TeamPredictionRecordsTable
        records={records}
        season={2024}
        isLoading={overrides.isLoading ?? false}
        emptyMessage={overrides.emptyMessage ?? 'No graded predictions have been published for this season yet.'}
      />
    </MemoryRouter>
  );
}

describe('TeamPredictionRecordsTable', () => {
  it('renders a loading skeleton instead of the table when isLoading is true', () => {
    renderTable([buildRecord()], { isLoading: true });

    expect(screen.queryByText('Notre Dame')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('team-prediction-record-card')).toHaveLength(0);
  });

  it('renders one TeamPredictionRecordCard per record, passing the team and season through', () => {
    renderTable([buildRecord({ teamName: 'Oklahoma' }), buildRecord({ teamName: 'Texas' })]);

    const cards = screen.getAllByTestId('team-prediction-record-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute('data-team-name', 'Oklahoma');
    expect(cards[0]).toHaveAttribute('data-season', '2024');
    expect(cards[1]).toHaveAttribute('data-team-name', 'Texas');
  });

  it('renders team names in the desktop table', () => {
    renderTable([buildRecord({ teamName: 'Florida' })]);

    expect(screen.getByText('Florida')).toBeInTheDocument();
  });

  it('renders the empty message when there are no records', () => {
    renderTable([], { emptyMessage: 'No graded predictions have been published for this season yet.' });

    expect(screen.getByText('No graded predictions have been published for this season yet.')).toBeInTheDocument();
  });

  it('wraps the table in a container hidden below the md breakpoint', () => {
    const { container } = renderTable([buildRecord()]);

    expect(container.querySelector('.hidden.md\\:block')).toBeInTheDocument();
  });
});
