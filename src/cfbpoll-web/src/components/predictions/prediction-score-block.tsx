import type { GamePredictionPublic } from '../../schemas';

import { TeamLogo } from '../rankings/team-logo';
import { TeamNameLabel } from './team-name-label';

interface PredictionScoreBlockProps {
  prediction: GamePredictionPublic;
  rankByTeam?: Map<string, number>;
  season?: number | null;
  showGrades?: boolean;
  showPredictedScore?: boolean;
}

export function PredictionScoreBlock({ prediction: p, rankByTeam, season = null, showGrades = false, showPredictedScore = true }: PredictionScoreBlockProps) {
  const isFinal = showGrades && p.actualAwayScore !== null && p.actualHomeScore !== null;
  const awayScore = showPredictedScore ? p.awayTeamScore : isFinal ? p.actualAwayScore : null;
  const homeScore = showPredictedScore ? p.homeTeamScore : isFinal ? p.actualHomeScore : null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <TeamLogo logoURL={p.awayLogoURL} teamName={p.awayTeam} />
        <TeamNameLabel teamName={p.awayTeam} season={season} rank={rankByTeam?.get(p.awayTeam.toLowerCase())} />
        {awayScore !== null && <span className="font-semibold ml-auto">{awayScore}</span>}
      </div>
      <div className="flex items-center gap-2">
        <TeamLogo logoURL={p.homeLogoURL} teamName={p.homeTeam} />
        <TeamNameLabel teamName={p.homeTeam} season={season} rank={rankByTeam?.get(p.homeTeam.toLowerCase())} />
        {p.neutralSite && <span className="text-text-muted text-xs">(N)</span>}
        {homeScore !== null && <span className="font-semibold ml-auto">{homeScore}</span>}
      </div>
      {showPredictedScore && isFinal && (
        <span className="text-sm font-semibold text-text-primary">
          Final: {p.actualAwayScore}-{p.actualHomeScore}
        </span>
      )}
    </div>
  );
}
