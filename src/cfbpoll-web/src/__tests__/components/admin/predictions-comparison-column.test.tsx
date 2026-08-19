import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { GamePredictionPublic } from '../../../schemas';

import { PredictionsComparisonColumn } from '../../../components/admin';

const mockPrediction: GamePredictionPublic = {
  actualAwayScore: null,
  actualHomeScore: null,
  actualOverUnderResult: null,
  actualSpreadCoveringTeam: null,
  actualWinner: null,
  awayLogoURL: 'https://example.com/iowa.png',
  awayTeam: 'Iowa',
  awayTeamScore: 21,
  bettingOverUnder: 45.5,
  bettingSpread: -3.5,
  homeLogoURL: 'https://example.com/nebraska.png',
  homeTeam: 'Nebraska',
  homeTeamScore: 24,
  myOverUnderPick: 'Over',
  mySpreadPick: 'Nebraska',
  neutralSite: false,
  overUnderGrade: 'Ungraded',
  predictedMargin: 3,
  predictedWinner: 'Nebraska',
  spreadGrade: 'Ungraded',
  winnerGrade: 'Ungraded',
};

describe('PredictionsComparisonColumn', () => {
  it('renders a No data placeholder when no prediction is provided for this column', () => {
    render(<PredictionsComparisonColumn prediction={undefined} />);

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders the O/U pick when a prediction is provided', () => {
    render(<PredictionsComparisonColumn prediction={mockPrediction} />);

    expect(screen.getByText('O/U')).toBeInTheDocument();
    expect(screen.getByText('45.5')).toBeInTheDocument();
  });

  it('renders the spread pick when a prediction is provided', () => {
    render(<PredictionsComparisonColumn prediction={mockPrediction} />);

    expect(screen.getByText('Spread')).toBeInTheDocument();
    expect(screen.getByText('Nebraska -3.5')).toBeInTheDocument();
  });

  it('renders the winner pick when a prediction is provided', () => {
    render(<PredictionsComparisonColumn prediction={mockPrediction} />);

    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('Nebraska', { selector: 'span.rounded-lg' })).toBeInTheDocument();
  });

  it('renders this algorithm\'s own predicted score', () => {
    render(<PredictionsComparisonColumn prediction={mockPrediction} />);

    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('21-24')).toBeInTheDocument();
  });
});
