import { TeamLogo } from '../rankings/team-logo';
import { TableSkeleton } from '../ui/table-skeleton';
import type { GamePredictionPublic } from '../../schemas';

const COLUMN_COUNT = 6;

interface PredictionsTableProps {
  isLoading?: boolean;
  predictions: GamePredictionPublic[];
}

function formatSpread(prediction: GamePredictionPublic): string {
  if (prediction.bettingSpread === null || prediction.bettingSpread === undefined) return 'N/A';
  const spread = prediction.bettingSpread;
  const sign = spread > 0 ? '+' : '';
  return `${prediction.homeTeam} ${sign}${spread}`;
}

function formatOverUnder(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toString();
}

function formatPick(pick: string): string {
  return pick || 'N/A';
}

export function PredictionsTable({ isLoading = false, predictions }: PredictionsTableProps) {
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
                  <span>{p.awayTeam}</span>
                  <span className="font-semibold ml-auto">{p.awayTeamScore}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TeamLogo logoURL={p.homeLogoURL} teamName={p.homeTeam} />
                  <span>{p.homeTeam}</span>
                  {p.neutralSite && <span className="text-text-muted text-xs">(N)</span>}
                  <span className="font-semibold ml-auto">{p.homeTeamScore}</span>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-sm font-medium text-text-primary align-middle">
              <div className="flex items-center gap-2">
                <TeamLogo
                  logoURL={p.predictedWinner === p.homeTeam ? p.homeLogoURL : p.awayLogoURL}
                  teamName={p.predictedWinner}
                />
                <span>{p.predictedWinner}</span>
              </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
              {formatSpread(p)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
              {formatPick(p.mySpreadPick)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right align-middle">
              {formatOverUnder(p.bettingOverUnder)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
              {formatPick(p.myOverUnderPick)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
