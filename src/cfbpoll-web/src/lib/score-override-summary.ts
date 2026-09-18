import type { ScoreOverrideDisclosure } from '../types';

import { getWeekLabel } from './week-utils';

export function formatScoreOverrideSummary(override: ScoreOverrideDisclosure): string {
  return (
    `${override.awayTeam} @ ${override.homeTeam} (${getWeekLabel(override.week)}): ` +
    `${override.originalAwayPoints}-${override.originalHomePoints} corrected to ` +
    `${override.overrideAwayPoints}-${override.overrideHomePoints} - ${override.reason}`
  );
}
