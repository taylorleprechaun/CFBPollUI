import type { GameOverride } from '../../../schemas/admin';

import { getWeekLabel } from '../../../lib/week-utils';
import { BUTTON_DANGER_GHOST, BUTTON_GHOST } from '../../ui/button-styles';
import { EmptyState } from '../../ui/empty-state';
import { TableSkeleton } from '../../ui/table-skeleton';

const COLUMN_COUNT = 6;

interface GameOverridesSectionProps {
  isDeleting: boolean;
  isLoading: boolean;
  onDelete: (gameOverride: GameOverride) => void;
  onEdit: (gameOverride: GameOverride) => void;
  overrides: GameOverride[];
}

export function GameOverridesSection({ isDeleting, isLoading, onDelete, onEdit, overrides }: GameOverridesSectionProps) {
  if (isLoading) {
    return <TableSkeleton columns={COLUMN_COUNT} />;
  }

  if (overrides.length === 0) {
    return <EmptyState message="No manual score overrides for this season." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface-alt border-b-2 border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Week</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Matchup</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Original</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Override</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Reason</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border">
          {overrides.map((gameOverride) => (
            <tr key={gameOverride.gameID} className="even:bg-surface-alt/50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">{getWeekLabel(gameOverride.week)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">
                {gameOverride.awayTeam} @ {gameOverride.homeTeam}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                {gameOverride.originalAwayPoints} - {gameOverride.originalHomePoints}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary font-medium">
                {gameOverride.overrideAwayPoints} - {gameOverride.overrideHomePoints}
              </td>
              <td className="px-4 py-3 text-sm text-text-muted max-w-xs truncate" title={gameOverride.reason}>
                {gameOverride.reason}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                <button onClick={() => onEdit(gameOverride)} className={BUTTON_GHOST}>
                  Edit
                </button>
                <button onClick={() => onDelete(gameOverride)} disabled={isDeleting} className={BUTTON_DANGER_GHOST}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
