import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { SeasonExperimentalPredictionsWeek } from '../../../schemas/admin';

import { SeasonPredictionsWeekTable } from '../../../components/admin';

function buildWeek(overrides: Partial<SeasonExperimentalPredictionsWeek> = {}): SeasonExperimentalPredictionsWeek {
  return {
    summary: {
      gradedGameCount: 5,
      marginBias: 0.5,
      marginMAE: 6.2,
      marginRMSE: 8.3,
      overUnder: { correct: 3, incorrect: 2, push: 0 },
      spread: { correct: 4, incorrect: 1, push: 0 },
      winner: { correct: 5, incorrect: 0, push: 0 },
    },
    week: 5,
    ...overrides,
  };
}

describe('SeasonPredictionsWeekTable', () => {
  it('colors the margin RMSE and bias values', () => {
    render(<SeasonPredictionsWeekTable weeks={[buildWeek({ summary: { ...buildWeek().summary, marginRMSE: 15.0, marginBias: 0.5 } })]} />);

    expect(screen.getByText('15.0 pts')).toHaveClass('bg-green-100');
    expect(screen.getByText('+0.5 pts')).toHaveClass('bg-green-100');
  });

  it('colors the winner, spread, and over/under totals across the red band', () => {
    render(
      <SeasonPredictionsWeekTable
        weeks={[
          buildWeek({
            summary: {
              ...buildWeek().summary,
              overUnder: { correct: 2, incorrect: 2, push: 0 },
              spread: { correct: 1, incorrect: 1, push: 0 },
              winner: { correct: 1, incorrect: 2, push: 0 },
            },
          }),
        ]}
      />
    );

    expect(screen.getByText('1-2')).toHaveClass('bg-red-100');
    expect(screen.getByText('1-1')).toHaveClass('bg-yellow-100');
    expect(screen.getByText('2-2')).toHaveClass('bg-yellow-100');
  });

  it('renders column headers', () => {
    render(<SeasonPredictionsWeekTable weeks={[buildWeek()]} />);

    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('Spread')).toBeInTheDocument();
    expect(screen.getByText('O/U')).toBeInTheDocument();
    expect(screen.getByText('Margin RMSE')).toBeInTheDocument();
    expect(screen.getByText('Margin Bias')).toBeInTheDocument();
  });

  it('renders no data rows when weeks is empty', () => {
    render(<SeasonPredictionsWeekTable weeks={[]} />);

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('renders one row per week', () => {
    render(<SeasonPredictionsWeekTable weeks={[buildWeek({ week: 5 }), buildWeek({ week: 6 })]} />);

    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('renders the week label for each row', () => {
    render(<SeasonPredictionsWeekTable weeks={[buildWeek({ week: 4 })]} />);

    expect(screen.getByText('Week 5')).toBeInTheDocument();
  });
});
