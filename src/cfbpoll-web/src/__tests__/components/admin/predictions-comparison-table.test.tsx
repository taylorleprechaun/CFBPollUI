import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { GamePredictionPublic } from '../../../schemas';

import { PredictionsComparisonTable } from '../../../components/admin';

vi.mock('../../../components/admin/experimental-calibration-note', () => ({
  ExperimentalCalibrationNote: ({ season, week }: { season: number; week: number }) => <p>Calibration note for {season} week {week}</p>,
}));

const createMockPrediction = (overrides: Partial<GamePredictionPublic> = {}): GamePredictionPublic => ({
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
  ...overrides,
});

const emptySummary = {
  gradedGameCount: 0,
  marginBias: null,
  marginMAE: null,
  marginRMSE: null,
  overUnder: { correct: 0, incorrect: 0, push: 0 },
  spread: { correct: 0, incorrect: 0, push: 0 },
  winner: { correct: 0, incorrect: 0, push: 0 },
};

describe('PredictionsComparisonTable', () => {
  it('renders a column header for each algorithm version', () => {
    render(
      <PredictionsComparisonTable
        entries={[
          { algorithmVersion: 'V1', result: { algorithmVersion: 'V1', appliedCalibration: null, predictions: [createMockPrediction()], summary: emptySummary } },
          { algorithmVersion: 'V2', result: { algorithmVersion: 'V2', appliedCalibration: null, predictions: [createMockPrediction()], summary: emptySummary } },
        ]}
        season={2024}
        week={5}
      />
    );

    expect(screen.getByText('V1')).toBeInTheDocument();
    expect(screen.getByText('V2')).toBeInTheDocument();
  });

  it('renders a summary box per algorithm, aligned with its result columns', () => {
    render(
      <PredictionsComparisonTable
        entries={[
          { algorithmVersion: 'V1', result: { algorithmVersion: 'V1', appliedCalibration: null, predictions: [createMockPrediction()], summary: emptySummary } },
          { algorithmVersion: 'V2', result: { algorithmVersion: 'V2', appliedCalibration: null, predictions: [createMockPrediction()], summary: emptySummary } },
        ]}
        season={2024}
        week={5}
      />
    );

    expect(screen.getAllByText("This week hasn't been played yet - no actual results to grade against.")).toHaveLength(2);
  });

  it('renders one row per unique game across all algorithm result sets', () => {
    render(
      <PredictionsComparisonTable
        entries={[
          {
            algorithmVersion: 'V1',
            result: {
              algorithmVersion: 'V1',
              appliedCalibration: null,
              predictions: [createMockPrediction(), createMockPrediction({ awayTeam: 'Michigan', homeTeam: 'Ohio State' })],
              summary: emptySummary,
            },
          },
        ]}
        season={2024}
        week={5}
      />
    );

    expect(screen.getAllByText('Winner')).toHaveLength(2);
  });

  it('shows the calibration line only under a version that applied calibration', () => {
    render(
      <PredictionsComparisonTable
        entries={[
          { algorithmVersion: 'V1', result: { algorithmVersion: 'V1', appliedCalibration: null, predictions: [createMockPrediction()], summary: emptySummary } },
          { algorithmVersion: 'V2', result: { algorithmVersion: 'V2', appliedCalibration: { paramA: 2 }, predictions: [createMockPrediction()], summary: emptySummary } },
        ]}
        season={2024}
        week={5}
      />
    );

    const note = screen.getByText('Calibration note for 2024 week 5');
    expect(note.parentElement).toHaveTextContent(/^V2/);
  });
});
