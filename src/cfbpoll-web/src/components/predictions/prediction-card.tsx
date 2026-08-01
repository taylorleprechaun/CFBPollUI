import type { ReactNode } from 'react';

import { gradeClasses } from '../../lib/grade-classes';
import { formatOverUnder, formatPick, formatSpread } from '../../lib/prediction-format-utils';
import { TeamLogo } from '../rankings/team-logo';
import { GradedPick } from './graded-pick';
import { TeamNameLabel } from './team-name-label';
import type { GamePredictionPublic } from '../../schemas';

interface PredictionCardProps {
  prediction: GamePredictionPublic;
  rankByTeam?: Map<string, number>;
  season?: number | null;
  showGrades?: boolean;
}

interface FactRowProps {
  label: string;
  secondary?: ReactNode;
  value: ReactNode;
}

function FactRow({ label, secondary, value }: FactRowProps) {
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <TeamLogo logoURL={p.awayLogoURL} teamName={p.awayTeam} />
            <TeamNameLabel teamName={p.awayTeam} season={season} rank={rankByTeam?.get(p.awayTeam.toLowerCase())} />
            <span className="font-semibold ml-auto">{p.awayTeamScore}</span>
          </div>
          <div className="flex items-center gap-2">
            <TeamLogo logoURL={p.homeLogoURL} teamName={p.homeTeam} />
            <TeamNameLabel teamName={p.homeTeam} season={season} rank={rankByTeam?.get(p.homeTeam.toLowerCase())} />
            {p.neutralSite && <span className="text-text-muted text-xs">(N)</span>}
            <span className="font-semibold ml-auto">{p.homeTeamScore}</span>
          </div>
          {showGrades && p.actualHomeScore !== null && p.actualAwayScore !== null && (
            <span className="text-sm font-semibold text-text-primary">
              Final: {p.actualAwayScore}-{p.actualHomeScore}
            </span>
          )}
        </div>
      </div>

      <FactRow
        label="Winner"
        value={
          <div className="flex items-center justify-end gap-2">
            <TeamLogo
              logoURL={p.predictedWinner === p.homeTeam ? p.homeLogoURL : p.awayLogoURL}
              teamName={p.predictedWinner}
            />
            <TeamNameLabel
              className={showGrades ? `px-2 py-1 rounded-lg font-semibold ${gradeClasses(p.winnerGrade)}` : undefined}
              teamName={p.predictedWinner}
              season={season}
              rank={rankByTeam?.get(p.predictedWinner.toLowerCase())}
            />
          </div>
        }
        secondary={
          showGrades && p.winnerGrade === 'Incorrect' && p.actualWinner !== null ? (
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Actual: {p.actualWinner}</span>
          ) : undefined
        }
      />

      <FactRow
        label="Spread"
        value={formatSpread(p)}
        secondary={
          showGrades ? (
            <GradedPick actualValue={p.actualSpreadCoveringTeam} grade={p.spreadGrade} pick={p.mySpreadPick} />
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
            <GradedPick actualValue={p.actualOverUnderResult} grade={p.overUnderGrade} pick={p.myOverUnderPick} />
          ) : (
            <span>Pick: {formatPick(p.myOverUnderPick)}</span>
          )
        }
      />
    </div>
  );
}
