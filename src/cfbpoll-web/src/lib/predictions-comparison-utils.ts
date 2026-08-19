import type { AlgorithmVersion } from '../components/admin/algorithm-versions';
import type { GamePredictionPublic } from '../schemas';
import type { ExperimentalPredictionsResponse } from '../schemas/admin';

export interface PredictionsComparisonEntry {
  algorithmVersion: AlgorithmVersion;
  result: ExperimentalPredictionsResponse;
}

export interface PredictionsComparisonRow {
  base: GamePredictionPublic;
  byVersion: Partial<Record<AlgorithmVersion, GamePredictionPublic>>;
  gameKey: string;
}

export function buildPredictionsComparisonRows(entries: PredictionsComparisonEntry[]): PredictionsComparisonRow[] {
  const rowsByKey = new Map<string, PredictionsComparisonRow>();

  for (const entry of entries) {
    for (const prediction of entry.result.predictions) {
      const key = gameKey(prediction);
      const existingRow = rowsByKey.get(key);

      if (existingRow) {
        existingRow.byVersion[entry.algorithmVersion] = prediction;
        continue;
      }

      rowsByKey.set(key, { base: prediction, byVersion: { [entry.algorithmVersion]: prediction }, gameKey: key });
    }
  }

  return Array.from(rowsByKey.values());
}

function gameKey(prediction: GamePredictionPublic): string {
  return `${prediction.awayTeam}-${prediction.homeTeam}`;
}
