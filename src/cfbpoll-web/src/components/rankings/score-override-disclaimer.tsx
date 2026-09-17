import type { ScoreOverrideDisclosure } from '../../types';

import { getWeekLabel } from '../../lib/week-utils';
import { InfoTooltip } from '../ui/info-tooltip';

interface ScoreOverrideDisclaimerProps {
  scoreOverrides: ScoreOverrideDisclosure[];
}

export function ScoreOverrideDisclaimer({ scoreOverrides }: ScoreOverrideDisclaimerProps) {
  if (scoreOverrides.length === 0) {
    return null;
  }

  const summary = scoreOverrides
    .map((o) => `${o.awayTeam} @ ${o.homeTeam} (${getWeekLabel(o.week)}): ${o.reason}`)
    .join(' ');

  return (
    <div className="flex items-center gap-1.5 text-sm text-amber-600">
      <span>Includes a manually corrected score</span>
      <InfoTooltip statName="Manual score override" summary={summary} />
    </div>
  );
}
