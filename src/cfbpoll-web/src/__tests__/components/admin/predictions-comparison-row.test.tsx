import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PredictionsComparisonRow as ComparisonRowData } from '../../../lib/predictions-comparison-utils';
import type { GamePredictionPublic } from '../../../schemas';

import { PredictionsComparisonRow } from '../../../components/admin';

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

const mockRow: ComparisonRowData = {
  base: mockPrediction,
  byVersion: { V1: mockPrediction },
  gameKey: 'Iowa-Nebraska',
};

describe('PredictionsComparisonRow', () => {
  it('renders a No data placeholder for a version with no prediction for this game', () => {
    render(<PredictionsComparisonRow row={mockRow} versions={['V1', 'V2']} />);

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders no score in the shared box before the game has been played', () => {
    render(<PredictionsComparisonRow row={mockRow} versions={['V1']} />);

    expect(screen.queryByText('21')).not.toBeInTheDocument();
    expect(screen.queryByText('24')).not.toBeInTheDocument();
  });

  it('renders one comparison column per version', () => {
    const twoVersionRow: ComparisonRowData = {
      base: mockPrediction,
      byVersion: { V1: mockPrediction, V2: mockPrediction },
      gameKey: 'Iowa-Nebraska',
    };
    render(<PredictionsComparisonRow row={twoVersionRow} versions={['V1', 'V2']} />);

    expect(screen.getAllByText('Winner')).toHaveLength(2);
  });

  it('renders the actual final score inline in the shared box, not a per-algorithm predicted score', () => {
    const finalRow: ComparisonRowData = {
      base: { ...mockPrediction, actualAwayScore: 17, actualHomeScore: 20 },
      byVersion: { V1: mockPrediction },
      gameKey: 'Iowa-Nebraska',
    };
    render(<PredictionsComparisonRow row={finalRow} versions={['V1']} />);

    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.queryByText(/Final:/)).not.toBeInTheDocument();
  });

  it('renders the shared game matchup from the base prediction', () => {
    render(<PredictionsComparisonRow row={mockRow} versions={['V1']} />);

    expect(screen.getByText('Iowa')).toBeInTheDocument();
    expect(screen.getAllByText('Nebraska').length).toBeGreaterThan(0);
  });
});
