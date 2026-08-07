import type { GamePredictionPublic } from '../../schemas';

import { TeamLogo } from '../rankings/team-logo';
import { TeamNameLabel } from './team-name-label';

interface PredictionScoreBlockProps {
  prediction: GamePredictionPublic;
  rankByTeam?: Map<string, number>;
  season?: number | null;
  showGrades?: boolean;
}

export function PredictionScoreBlock({ prediction: p, rankByTeam, season = null, showGrades = false }: PredictionScoreBlockProps) {
  return (
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
  );
}
