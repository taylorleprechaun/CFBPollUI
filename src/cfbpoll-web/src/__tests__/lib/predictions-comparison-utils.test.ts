import { describe, expect, it } from 'vitest';

import type { GamePredictionPublic } from '../../schemas';

import { buildPredictionsComparisonRows } from '../../lib/predictions-comparison-utils';

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

describe('buildPredictionsComparisonRows', () => {
  it('includes a game present in only one algorithm result set', () => {
    const rows = buildPredictionsComparisonRows([
      {
        algorithmVersion: 'V1',
        result: {
          algorithmVersion: 'V1',
          predictions: [createMockPrediction(), createMockPrediction({ awayTeam: 'Michigan', homeTeam: 'Ohio State' })],
          summary: { gradedGameCount: 0, marginBias: null, marginMAE: null, marginRMSE: null, overUnder: { correct: 0, incorrect: 0, push: 0 }, spread: { correct: 0, incorrect: 0, push: 0 }, winner: { correct: 0, incorrect: 0, push: 0 } },
        },
      },
      {
        algorithmVersion: 'V2',
        result: {
          algorithmVersion: 'V2',
          predictions: [createMockPrediction()],
          summary: { gradedGameCount: 0, marginBias: null, marginMAE: null, marginRMSE: null, overUnder: { correct: 0, incorrect: 0, push: 0 }, spread: { correct: 0, incorrect: 0, push: 0 }, winner: { correct: 0, incorrect: 0, push: 0 } },
        },
      },
    ]);

    const michiganRow = rows.find((row) => row.gameKey === 'Michigan-Ohio State');
    expect(michiganRow?.byVersion.V1).toBeDefined();
    expect(michiganRow?.byVersion.V2).toBeUndefined();
  });

  it('keys rows by away-home team pair', () => {
    const rows = buildPredictionsComparisonRows([
      {
        algorithmVersion: 'V1',
        result: {
          algorithmVersion: 'V1',
          predictions: [createMockPrediction()],
          summary: { gradedGameCount: 0, marginBias: null, marginMAE: null, marginRMSE: null, overUnder: { correct: 0, incorrect: 0, push: 0 }, spread: { correct: 0, incorrect: 0, push: 0 }, winner: { correct: 0, incorrect: 0, push: 0 } },
        },
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].gameKey).toBe('Iowa-Nebraska');
    expect(rows[0].base.awayTeam).toBe('Iowa');
  });

  it('merges predictions for the same game from multiple algorithms into byVersion', () => {
    const rows = buildPredictionsComparisonRows([
      {
        algorithmVersion: 'V1',
        result: {
          algorithmVersion: 'V1',
          predictions: [createMockPrediction({ predictedWinner: 'Iowa' })],
          summary: { gradedGameCount: 0, marginBias: null, marginMAE: null, marginRMSE: null, overUnder: { correct: 0, incorrect: 0, push: 0 }, spread: { correct: 0, incorrect: 0, push: 0 }, winner: { correct: 0, incorrect: 0, push: 0 } },
        },
      },
      {
        algorithmVersion: 'V2',
        result: {
          algorithmVersion: 'V2',
          predictions: [createMockPrediction({ predictedWinner: 'Nebraska' })],
          summary: { gradedGameCount: 0, marginBias: null, marginMAE: null, marginRMSE: null, overUnder: { correct: 0, incorrect: 0, push: 0 }, spread: { correct: 0, incorrect: 0, push: 0 }, winner: { correct: 0, incorrect: 0, push: 0 } },
        },
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].byVersion.V1?.predictedWinner).toBe('Iowa');
    expect(rows[0].byVersion.V2?.predictedWinner).toBe('Nebraska');
  });

  it('returns an empty array when given no entries', () => {
    expect(buildPredictionsComparisonRows([])).toEqual([]);
  });
});
