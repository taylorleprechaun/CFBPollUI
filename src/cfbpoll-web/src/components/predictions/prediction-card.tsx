import type { ReactNode } from 'react';

import type { GamePredictionPublic } from '../../schemas';

import { formatOverUnder, formatPick, formatSpread } from '../../lib/prediction-format-utils';
import { GradedPick } from './graded-pick';
import { PredictionScoreBlock } from './prediction-score-block';
import { WinnerPill } from './winner-pill';

interface PredictionCardProps {
  prediction: GamePredictionPublic;
  rankByTeam?: Map<string, number>;
  season?: number | null;
  showGrades?: boolean;
}

export interface FactRowProps {
  label: string;
  secondary?: ReactNode;
  value: ReactNode;
}

export function FactRow({ label, secondary, value }: FactRowProps) {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-sm text-text-secondary text-right">
          {value}
          {secondary}
        </div>
      </div>
    </div>
  );
}

export function PredictionCard({ prediction: p, rankByTeam, season = null, showGrades = false }: PredictionCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl divide-y divide-border">
      <div className="px-4 py-2">
        <PredictionScoreBlock prediction={p} rankByTeam={rankByTeam} season={season} showGrades={showGrades} />
      </div>

      <FactRow
        label="Winner"
        value={<WinnerPill prediction={p} rankByTeam={rankByTeam} season={season} showGrades={showGrades} />}
      />

      <FactRow
        label="Spread"
        value={formatSpread(p)}
        secondary={
          showGrades ? (
            <GradedPick grade={p.spreadGrade} pick={p.mySpreadPick} />
          ) : (
            <span>Pick: {formatPick(p.mySpreadPick)}</span>
          )
        }
      />

      <FactRow
        label="O/U"
        value={formatOverUnder(p.bettingOverUnder)}
        secondary={
          showGrades ? (
            <GradedPick grade={p.overUnderGrade} pick={p.myOverUnderPick} />
          ) : (
            <span>Pick: {formatPick(p.myOverUnderPick)}</span>
          )
        }
      />
    </div>
  );
}
