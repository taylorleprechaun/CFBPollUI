import { Link } from 'react-router-dom';
import { gradeClasses } from '../../lib/grade-classes';
import { formatOverUnder, formatPick, formatSpread } from '../../lib/prediction-format-utils';
import { TeamLogo } from '../rankings/team-logo';
import { TableSkeleton } from '../ui/table-skeleton';

const COLUMN_COUNT = 6;

interface PredictionTableRow {
  actualAwayScore: number | null;
  actualHomeScore: number | null;
  actualOverUnderResult: string | null;
  actualSpreadCoveringTeam: string | null;
  actualWinner: string | null;
  awayLogoURL: string;
  awayTeam: string;
  awayTeamScore: number;
  bettingOverUnder: number | null;
  bettingSpread: number | null;
  homeLogoURL: string;
  homeTeam: string;
  homeTeamScore: number;
  myOverUnderPick: string;
  mySpreadPick: string;
  neutralSite: boolean;
  overUnderGrade: string;
  predictedWinner: string;
  spreadGrade: string;
  winnerGrade: string;
}

interface PredictionsTableProps {
  isLoading?: boolean;
  predictions: PredictionTableRow[];
  rankByTeam?: Map<string, number>;
  season?: number | null;
  showGrades?: boolean;
}

interface GradedPickProps {
  actualValue: string | null;
  grade: string;
  pick: string;
}

function GradedPick({ actualValue, grade, pick }: GradedPickProps) {
  return (
    <div className={`inline-flex flex-col gap-0.5 px-2 py-1 rounded-lg ${gradeClasses(grade)}`}>
      <span className="font-semibold">{formatPick(pick)}</span>
      {grade === 'Incorrect' && actualValue !== null && (
        <span className="text-xs">Correct: {actualValue}</span>
      )}
    </div>
  );
}

interface TeamNameLabelProps {
  className?: string;
  rank?: number;
  season?: number | null;
  teamName: string;
}

function TeamNameLabel({ className, rank, season, teamName }: TeamNameLabelProps) {
  const showRank = rank != null && rank >= 1 && rank <= 25;
  const label = (
    <>
      {showRank && <span className="text-xs">#{rank} </span>}
      {teamName}
    </>
  );

  if (season == null) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link
      to={`/team-details?team=${encodeURIComponent(teamName)}&season=${season}`}
      className={`hover:text-accent hover:underline ${className ?? ''}`}
    >
      {label}
    </Link>
  );
}

export function PredictionsTable({ isLoading = false, predictions, rankByTeam, season = null, showGrades = false }: PredictionsTableProps) {
  if (isLoading) {
    return <TableSkeleton columns={COLUMN_COUNT} />;
  }

  return (
    <table className="min-w-full divide-y divide-border">
      <thead className="bg-surface-alt">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Score</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Winner</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Spread</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Spread Pick</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">O/U</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">O/U Pick</th>
        </tr>
      </thead>
      <tbody className="bg-surface divide-y divide-border">
        {predictions.map((p) => (
          <tr key={`${p.awayTeam}-${p.homeTeam}`} className="even:bg-surface-alt/50">
            <td className="px-4 py-3 text-sm text-text-primary">
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
            </td>
            <td className="px-4 py-3 text-sm font-medium text-text-primary align-middle">
              <div className="flex flex-col gap-1">
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
                {showGrades && p.winnerGrade === 'Incorrect' && p.actualWinner !== null && (
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Actual: {p.actualWinner}</span>
                )}
              </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
              {formatSpread(p)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
              {showGrades ? (
                <GradedPick actualValue={p.actualSpreadCoveringTeam} grade={p.spreadGrade} pick={p.mySpreadPick} />
              ) : (
                formatPick(p.mySpreadPick)
              )}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right align-middle">
              {formatOverUnder(p.bettingOverUnder)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
              {showGrades ? (
                <GradedPick actualValue={p.actualOverUnderResult} grade={p.overUnderGrade} pick={p.myOverUnderPick} />
              ) : (
                formatPick(p.myOverUnderPick)
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
