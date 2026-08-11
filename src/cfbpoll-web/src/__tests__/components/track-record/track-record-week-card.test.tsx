import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { TrackRecordWeek } from '../../../schemas';

import { TrackRecordWeekCard } from '../../../components/track-record/track-record-week-card';

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

function renderCard(week: TrackRecordWeek, showMarginStats = false) {
  return render(
    <MemoryRouter>
      <TrackRecordWeekCard week={week} showMarginStats={showMarginStats} />
    </MemoryRouter>
  );
}

describe('TrackRecordWeekCard', () => {
  it('colors the margin RMSE and bias values when shown', () => {
    renderCard(buildWeek({ marginRMSE: 15.0, marginBias: 0.5 }), true);

    expect(screen.getByText('15.0 pts')).toHaveClass('bg-green-100');
    expect(screen.getByText('+0.5 pts')).toHaveClass('bg-green-100');
  });

  it('colors the winner, spread, and over/under totals across the yellow and red bands too', () => {
    renderCard(
      buildWeek({
        winner: { correct: 1, incorrect: 2, push: 0 },
        spread: { correct: 1, incorrect: 1, push: 0 },
        overUnder: { correct: 2, incorrect: 2, push: 0 },
      })
    );

    expect(screen.getByText('1-2')).toHaveClass('bg-red-100');
    expect(screen.getByText('1-1')).toHaveClass('bg-yellow-100');
    expect(screen.getByText('2-2')).toHaveClass('bg-yellow-100');
  });

  it('colors the winner, spread, and over/under totals even when showMarginStats is false', () => {
    renderCard(buildWeek(), false);

    expect(screen.getByText('5-0')).toHaveClass('bg-green-100');
    expect(screen.getByText('4-1')).toHaveClass('bg-green-100');
    expect(screen.getByText('3-2')).toHaveClass('bg-green-100');
  });

  it('does not render margin RMSE/Bias rows when showMarginStats is false', () => {
    renderCard(buildWeek(), false);

    expect(screen.queryByText('Margin RMSE')).not.toBeInTheDocument();
    expect(screen.queryByText('Margin Bias')).not.toBeInTheDocument();
  });

  it('links the week label to that week on the public predictions page', () => {
    renderCard(buildWeek({ season: 2023, week: 4 }));

    const link = screen.getByRole('link', { name: '2023 Week 5' });
    expect(link).toHaveAttribute('href', '/predictions?season=2023&week=4');
  });

  it('renders N/A for a week with no margin data', () => {
    renderCard(buildWeek({ marginBias: null, marginGameCount: 0, marginRMSE: null }), true);

    expect(screen.getAllByText('N/A')).toHaveLength(2);
  });

  it('renders the formatted margin RMSE and bias', () => {
    renderCard(buildWeek({ marginRMSE: 8.3, marginBias: -1.5 }), true);

    expect(screen.getByText('8.3 pts')).toBeInTheDocument();
    expect(screen.getByText('-1.5 pts')).toBeInTheDocument();
  });

  it('renders the formatted totals per category', () => {
    renderCard(buildWeek());

    expect(screen.getByText('5-0')).toBeInTheDocument();
    expect(screen.getByText('4-1')).toBeInTheDocument();
    expect(screen.getByText('3-2')).toBeInTheDocument();
  });

  it('shows labeled rows for each category when showMarginStats is true', () => {
    renderCard(buildWeek(), true);

    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('Spread')).toBeInTheDocument();
    expect(screen.getByText('O/U')).toBeInTheDocument();
    expect(screen.getByText('Margin RMSE')).toBeInTheDocument();
    expect(screen.getByText('Margin Bias')).toBeInTheDocument();
  });
});
