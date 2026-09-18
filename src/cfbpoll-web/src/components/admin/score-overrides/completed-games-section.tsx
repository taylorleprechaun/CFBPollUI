import type { CompletedGame } from '../../../schemas/admin';

import { TeamLogo } from '../../rankings/team-logo';
import { BUTTON_GHOST } from '../../ui/button-styles';
import { EmptyState } from '../../ui/empty-state';
import { TableSkeleton } from '../../ui/table-skeleton';

const COLUMN_COUNT = 4;

interface CompletedGamesSectionProps {
  games: CompletedGame[];
  isLoading: boolean;
  onSelectGame: (game: CompletedGame) => void;
}

export function CompletedGamesSection({ games, isLoading, onSelectGame }: CompletedGamesSectionProps) {
  if (isLoading) {
    return <TableSkeleton columns={COLUMN_COUNT} />;
  }

  if (games.length === 0) {
    return <EmptyState message="No completed games found for this week." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface-alt border-b-2 border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Matchup</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Score</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border">
          {games.map((game) => {
            const canOverride = game.gameID !== null
              && game.homeTeam !== null
              && game.awayTeam !== null
              && game.homePoints !== null
              && game.awayPoints !== null;

            return (
              <tr key={game.gameID ?? `${game.homeTeam}-${game.awayTeam}`} className="even:bg-surface-alt/50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">
                  <div className="flex items-center gap-2">
                    <TeamLogo logoURL={game.awayTeamLogoURL ?? ''} teamName={game.awayTeam ?? 'TBD'} />
                    <span>{game.awayTeam ?? 'TBD'} @ {game.homeTeam ?? 'TBD'}</span>
                    <TeamLogo logoURL={game.homeTeamLogoURL ?? ''} teamName={game.homeTeam ?? 'TBD'} />
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                  {game.awayPoints ?? '—'} - {game.homePoints ?? '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                  {game.hasOverride ? 'Overridden' : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onSelectGame(game)}
                    disabled={!canOverride}
                    className={BUTTON_GHOST}
                  >
                    {game.hasOverride ? 'Edit Override' : 'Override Score'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
