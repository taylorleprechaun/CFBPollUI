import { useEffect, useRef } from 'react';

import { useIncompleteGames } from '../../hooks/use-incomplete-games';
import { getWeekLabel } from '../../lib/week-utils';
import { BUTTON_SECONDARY } from '../ui/button-styles';
import { LoadingSpinner } from '../ui/loading-spinner';

interface IncompleteGamesModalProps {
  onClose: () => void;
  season: number;
  token: string | null;
  week: number;
}

export function IncompleteGamesModal({ onClose, season, token, week }: IncompleteGamesModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  const { data, error, isLoading } = useIncompleteGames(token, season, week, true);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;
    containerRef.current?.querySelector<HTMLElement>('button')?.focus();

    return () => {
      const el = previouslyFocusedRef.current;
      if (el instanceof HTMLElement) {
        el.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incomplete-games-modal-title"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="bg-surface rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="incomplete-games-modal-title" className="text-lg font-semibold text-text-primary mb-4">
          {season} {getWeekLabel(week)} - Incomplete Games
        </h2>

        {isLoading && <LoadingSpinner />}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load incomplete games.
          </p>
        )}

        {data && data.games.length === 0 && (
          <p className="text-sm text-text-secondary">No incomplete games found for this week.</p>
        )}

        {data && data.games.length > 0 && (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {data.games.map((game, index) => (
              <li
                key={`${game.homeTeam}-${game.awayTeam}-${index}`}
                className="text-sm text-text-primary border border-border rounded-lg p-2"
              >
                <div className="font-medium">
                  {game.awayTeam ?? 'TBD'} @ {game.homeTeam ?? 'TBD'}
                </div>
                <div className="text-text-muted text-xs">{formatKickoff(game.startDate, game.startTimeTbd)}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className={BUTTON_SECONDARY}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function formatKickoff(startDate: string | null, startTimeTbd: boolean): string {
  if (!startDate) return 'Date TBD';

  const date = new Date(startDate);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = startTimeTbd
    ? 'TBA'
    : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return `${dateStr}, ${timeStr}`;
}
