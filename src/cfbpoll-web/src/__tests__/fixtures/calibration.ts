import type {
  PredictionCalibrationAnalysis,
  PredictionCalibrationBacktestWeek,
  PredictionCalibrationParameter,
  PredictionCalibrationResponse,
  PredictionRecordSummary,
} from '../../schemas/admin';

/**
 * Shared calibration test data. Parameters are generic placeholders: tests never use real parameter names.
 */
export const CALIBRATION_PARAMETERS: PredictionCalibrationParameter[] = [
  { defaultValue: 0, description: 'First parameter', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 },
  { defaultValue: 0, description: 'Second parameter', key: 'paramB', label: 'Param B', max: 8, min: -8, step: 0.5 },
];

export function buildAnalysis(overrides: Partial<PredictionCalibrationAnalysis> = {}): PredictionCalibrationAnalysis {
  return {
    backtestWeeks: [buildBacktestWeek(9, 30, 30)],
    candidateValues: null,
    suggestedValues: { paramA: 1.5, paramB: -0.5 },
    suggestionNotes: { paramA: 'Note for A.', paramB: 'Note for B.' },
    ...overrides,
  };
}

/**
 * A completed week where every record type has the given correct counts out of 50 graded games.
 */
export function buildBacktestWeek(week: number, usedCorrect: number, suggestedCorrect: number, candidateCorrect: number | null = null): PredictionCalibrationBacktestWeek {
  return {
    candidate: candidateCorrect === null ? null : buildRecordSummary(candidateCorrect, 50 - candidateCorrect),
    season: 2026,
    suggested: buildRecordSummary(suggestedCorrect, 50 - suggestedCorrect),
    suggestedValues: { paramA: week / 10, paramB: 0 },
    used: buildRecordSummary(usedCorrect, 50 - usedCorrect),
    usedValues: { paramA: 0, paramB: 0 },
    week,
  };
}

export function buildCalibration(overrides: Partial<PredictionCalibrationResponse> = {}): PredictionCalibrationResponse {
  return {
    carriedFromSeason: null,
    carriedFromWeek: null,
    draftUsesDifferentValues: false,
    isLocked: false,
    isStored: true,
    isSupported: true,
    parameters: CALIBRATION_PARAMETERS,
    season: 2026,
    source: 'Manual',
    updatedAt: '2026-11-01T12:00:00Z',
    values: { paramA: 1, paramB: 0 },
    week: 10,
    ...overrides,
  };
}

/**
 * A record summary with the same correct/incorrect counts for Winner, Spread and O/U.
 */
export function buildRecordSummary(correct: number, incorrect: number): PredictionRecordSummary {
  return {
    gradedGameCount: correct + incorrect,
    marginBias: null,
    marginMAE: null,
    marginRMSE: null,
    overUnder: { correct, incorrect, push: 0 },
    spread: { correct, incorrect, push: 0 },
    winner: { correct, incorrect, push: 0 },
  };
}
