import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrackRecordTable } from '../../../components/track-record/track-record-table';
import type { TrackRecordWeek } from '../../../schemas';

function buildWeek(overrides: Partial<TrackRecordWeek> = {}): TrackRecordWeek {
  return {
    overUnder: { correct: 3, incorrect: 2, push: 0 },
    season: 2024,
    spread: { correct: 4, incorrect: 1, push: 0 },
    week: 3,
    winner: { correct: 5, incorrect: 0, push: 0 },
    ...overrides,
  };
}

describe('TrackRecordTable', () => {
  it('renders a skeleton when loading', () => {
    render(<TrackRecordTable isLoading weeks={[]} />);

    expect(screen.queryByRole('columnheader', { name: 'Week' })).not.toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<TrackRecordTable weeks={[buildWeek()]} />);

    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('Spread')).toBeInTheDocument();
    expect(screen.getByText('O/U')).toBeInTheDocument();
  });

  it('renders the season and week label for each row', () => {
    render(<TrackRecordTable weeks={[buildWeek({ season: 2023, week: 4 })]} />);

    expect(screen.getByText('2023 Week 5')).toBeInTheDocument();
  });

  it('renders formatted totals per category', () => {
    render(<TrackRecordTable weeks={[buildWeek()]} />);

    expect(screen.getByText('5-0')).toBeInTheDocument();
    expect(screen.getByText('4-1')).toBeInTheDocument();
    expect(screen.getByText('3-2')).toBeInTheDocument();
  });

  it('renders one row per week', () => {
    render(
      <TrackRecordTable
        weeks={[buildWeek({ season: 2024, week: 1 }), buildWeek({ season: 2024, week: 2 })]}
      />
    );

    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('renders no data rows when weeks is empty', () => {
    render(<TrackRecordTable weeks={[]} />);

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });
});
