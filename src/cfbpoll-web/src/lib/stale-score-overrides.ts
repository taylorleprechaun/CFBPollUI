import type { StaleScoreOverride } from '../schemas/admin';

const KIND_LABELS: Record<StaleScoreOverride['kind'], string> = {
  Added: 'Added since calculation',
  Changed: 'Score changed since calculation',
  Removed: 'Removed since calculation',
};

export function formatStaleScoreOverride(difference: StaleScoreOverride): string {
  return `${difference.awayTeam} @ ${difference.homeTeam} (${getStaleScoreOverrideKindLabel(difference.kind)})`;
}

export function getStaleScoreOverrideKindLabel(kind: StaleScoreOverride['kind']): string {
  return KIND_LABELS[kind];
}
