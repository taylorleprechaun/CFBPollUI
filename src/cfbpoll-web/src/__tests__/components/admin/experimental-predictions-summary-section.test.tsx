import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ExperimentalPredictionsSummarySection } from '../../../components/admin';

const gradedSummary = {
  gradedGameCount: 4,
  marginBias: -3.5,
  marginMAE: 6.25,
  marginRMSE: 7.5,
  overUnder: { correct: 2, incorrect: 1, push: 1 },
  spread: { correct: 2, incorrect: 2, push: 0 },
  winner: { correct: 3, incorrect: 1, push: 0 },
};

const ungradedSummary = {
  gradedGameCount: 0,
  marginBias: null,
  marginMAE: null,
  marginRMSE: null,
  overUnder: { correct: 0, incorrect: 0, push: 0 },
  spread: { correct: 0, incorrect: 0, push: 0 },
  winner: { correct: 0, incorrect: 0, push: 0 },
};

describe('ExperimentalPredictionsSummarySection', () => {
  it('renders margin bias, MAE, and RMSE stat cards', () => {
    render(<ExperimentalPredictionsSummarySection summary={gradedSummary} />);

    expect(screen.getByText('Margin Bias')).toBeInTheDocument();
    expect(screen.getByText('-3.5 pts')).toBeInTheDocument();
    expect(screen.getByText('Margin MAE')).toBeInTheDocument();
    expect(screen.getByText('6.3 pts')).toBeInTheDocument();
    expect(screen.getByText('Margin RMSE')).toBeInTheDocument();
    expect(screen.getByText('7.5 pts')).toBeInTheDocument();
  });

  it('renders record cards for winner, spread, and over/under totals', () => {
    render(<ExperimentalPredictionsSummarySection summary={gradedSummary} />);

    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('3-1')).toBeInTheDocument();
    expect(screen.getByText('Spread')).toBeInTheDocument();
    expect(screen.getByText('Over/Under')).toBeInTheDocument();
    expect(screen.getByText('2-1-1')).toBeInTheDocument();
  });

  it('shows a not-yet-played message when gradedGameCount is zero', () => {
    render(<ExperimentalPredictionsSummarySection summary={ungradedSummary} />);

    expect(screen.getByText(/hasn't been played yet/)).toBeInTheDocument();
    expect(screen.queryByText('Margin Bias')).not.toBeInTheDocument();
  });
});
