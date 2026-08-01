import { gradeClasses } from '../../lib/grade-classes';
import { TeamLogo } from '../rankings/team-logo';
import { TeamNameLabel } from './team-name-label';
import type { GamePredictionPublic } from '../../schemas';

interface WinnerPillProps {
  prediction: GamePredictionPublic;
  rankByTeam?: Map<string, number>;
  season?: number | null;
  showGrades?: boolean;
}

export function WinnerPill({ prediction: p, rankByTeam, season = null, showGrades = false }: WinnerPillProps) {
  return (
    <div className="flex items-center gap-2">
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
  );
}
