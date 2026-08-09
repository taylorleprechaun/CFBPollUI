import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { TrackRecordWeek } from '../../../schemas';

import { TrackRecordTable } from '../../../components/track-record/track-record-table';

vi.mock('../../../components/track-record/track-record-week-card', () => ({
  TrackRecordWeekCard: ({ week }: { week: TrackRecordWeek }) => (
    <div data-testid="track-record-week-card" data-season={week.season} data-week={week.week} />
  ),
}));

function buildWeek(overrides: Partial<TrackRecordWeek> = {}): TrackRecordWeek {
  return {
    marginBias: 0.5,
    marginGameCount: 5,
    marginRMSE: 8.3,
    overUnder: { correct: 3, incorrect: 2, push: 0 },
    season: 2024,
    spread: { correct: 4, incorrect: 1, push: 0 },
    week: 3,
    winner: { correct: 5, incorrect: 0, push: 0 },
    ...overrides,
  };
}

function renderTable(props: React.ComponentProps<typeof TrackRecordTable>) {
  return render(
    <MemoryRouter>
      <TrackRecordTable {...props} />
    </MemoryRouter>
  );
}

describe('TrackRecordTable', () => {
  it('links the week label to that week on the public predictions page', () => {
    renderTable({ weeks: [buildWeek({ season: 2023, week: 4 })] });

    const link = screen.getByRole('link', { name: '2023 Week 5' });
    expect(link).toHaveAttribute('href', '/predictions?season=2023&week=4');
  });

  it('renders a skeleton when loading', () => {
    renderTable({ isLoading: true, weeks: [] });

    expect(screen.queryByRole('columnheader', { name: 'Week' })).not.toBeInTheDocument();
  });

  it('renders column headers', () => {
    renderTable({ weeks: [buildWeek()] });

    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('Spread')).toBeInTheDocument();
    expect(screen.getByText('O/U')).toBeInTheDocument();
    expect(screen.getByText('Margin RMSE')).toBeInTheDocument();
    expect(screen.getByText('Margin Bias')).toBeInTheDocument();
  });

  it('renders formatted margin RMSE and bias per week', () => {
    renderTable({ weeks: [buildWeek({ marginRMSE: 8.3, marginBias: -1.5 })] });

    expect(screen.getByText('8.3 pts')).toBeInTheDocument();
    expect(screen.getByText('-1.5 pts')).toBeInTheDocument();
  });

  it('renders formatted totals per category', () => {
    renderTable({ weeks: [buildWeek()] });

    expect(screen.getByText('5-0')).toBeInTheDocument();
    expect(screen.getByText('4-1')).toBeInTheDocument();
    expect(screen.getByText('3-2')).toBeInTheDocument();
  });

  it('renders N/A for a week with no margin data', () => {
    renderTable({ weeks: [buildWeek({ marginBias: null, marginGameCount: 0, marginRMSE: null })] });

    expect(screen.getAllByText('N/A')).toHaveLength(2);
  });

  it('renders no data rows when weeks is empty', () => {
    renderTable({ weeks: [] });

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('renders one row per week', () => {
    renderTable({
      weeks: [buildWeek({ season: 2024, week: 1 }), buildWeek({ season: 2024, week: 2 })],
    });

    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('renders the season and week label for each row', () => {
    renderTable({ weeks: [buildWeek({ season: 2023, week: 4 })] });

    expect(screen.getByText('2023 Week 5')).toBeInTheDocument();
  });

  it('wraps the table in a container hidden below the md breakpoint', () => {
    const { container } = renderTable({ weeks: [buildWeek()] });

    expect(container.querySelector('.hidden.md\\:block.overflow-x-auto table')).toBeInTheDocument();
  });

  describe('mobile card list', () => {
    it('renders no cards when weeks is empty', () => {
      renderTable({ weeks: [] });

      expect(screen.queryAllByTestId('track-record-week-card')).toHaveLength(0);
    });

    it('renders one TrackRecordWeekCard per week', () => {
      renderTable({
        weeks: [buildWeek({ season: 2024, week: 1 }), buildWeek({ season: 2024, week: 2 })],
      });

      const cards = screen.getAllByTestId('track-record-week-card');
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveAttribute('data-season', '2024');
      expect(cards[0]).toHaveAttribute('data-week', '1');
      expect(cards[1]).toHaveAttribute('data-week', '2');
    });
  });
});
