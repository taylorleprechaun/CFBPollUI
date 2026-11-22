import { useEffect, useRef, useState } from 'react';

import type { GamePrediction } from '../../schemas/admin';

import { useAddNewPredictionGames } from '../../hooks/use-admin-mutations';
import { useNewPredictionGames } from '../../hooks/use-new-prediction-games';
import { toErrorMessage } from '../../lib/error-utils';
import { formatOverUnder, formatPick, formatSpread } from '../../lib/prediction-format-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui/button-styles';
import { LoadingSpinner } from '../ui/loading-spinner';

interface NewGamesModalProps {
  isPublished: boolean;
  onClose: () => void;
  season: number;
  token: string | null;
  week: number;
}

export function NewGamesModal({ isPublished, onClose, season, token, week }: NewGamesModalProps) {
  const [deselectedKeys, setDeselectedKeys] = useState<Set<string>>(() => new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  const { data, error, isLoading } = useNewPredictionGames(token, season, week);
  const addMutation = useAddNewPredictionGames(token);

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

  const games = data?.games ?? [];
  const waitingOnLines = data?.waitingOnLines ?? [];
  const selectedGames = games.filter((g) => !deselectedKeys.has(gameKey(g)));
  const gameCountLabel = `${selectedGames.length} Game${selectedGames.length === 1 ? '' : 's'}`;
  const confirmLabel = isPublished ? `Add & Publish ${gameCountLabel}` : `Add ${gameCountLabel}`;

  function handleToggle(key: string) {
    setDeselectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleConfirm() {
    try {
      await addMutation.mutateAsync({
        games: selectedGames.map((g) => ({ awayTeam: g.awayTeam, homeTeam: g.homeTeam })),
        season,
        week,
      });
      onClose();
    } catch {
      // The mutation's error state renders the message below.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-games-modal-title"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="bg-surface rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="new-games-modal-title" className="text-lg font-semibold text-text-primary mb-4">
          {season} {getWeekLabel(week)} - New Games
        </h2>

        {isLoading && <LoadingSpinner />}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to check for new games.
          </p>
        )}

        {data && games.length === 0 && waitingOnLines.length === 0 && (
          <p className="text-sm text-text-secondary">No new games found.</p>
        )}

        {games.length > 0 && (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {games.map((game) => {
              const key = gameKey(game);
              const checkboxId = `new-game-${key}`;

              return (
                <li key={key} className="border border-border rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <input
                      checked={!deselectedKeys.has(key)}
                      className="mt-1"
                      id={checkboxId}
                      onChange={() => handleToggle(key)}
                      type="checkbox"
                    />
                    <label htmlFor={checkboxId} className="flex-1 text-sm text-text-primary">
                      <span className="font-medium">
                        {game.awayTeam} {game.neutralSite ? 'vs' : '@'} {game.homeTeam}
                      </span>
                      <span className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs text-text-secondary">
                        <span>Pick: {formatPredictedScore(game)}</span>
                        <span>Spread: {formatSpread(game)} · {formatPick(game.mySpreadPick)}</span>
                        <span>O/U: {formatOverUnder(game.bettingOverUnder)} · {formatPick(game.myOverUnderPick)}</span>
                      </span>
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {waitingOnLines.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Waiting on lines</h3>
            <ul className="space-y-1">
              {waitingOnLines.map((game) => (
                <li key={`${game.awayTeam}|${game.homeTeam}`} className="text-sm text-text-muted">
                  {game.awayTeam} @ {game.homeTeam}
                  {game.startDate && ` · ${new Date(game.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {addMutation.error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-4">
            {toErrorMessage(addMutation.error, 'Adding games failed')}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className={BUTTON_SECONDARY}>
            Cancel
          </button>
          {games.length > 0 && (
            <button
              className={BUTTON_PRIMARY}
              disabled={selectedGames.length === 0 || addMutation.isPending}
              onClick={handleConfirm}
            >
              {addMutation.isPending ? 'Adding...' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatPredictedScore(game: GamePrediction): string {
  const homeWins = game.predictedWinner === game.homeTeam;
  const winnerScore = homeWins ? game.homeTeamScore : game.awayTeamScore;
  const loserScore = homeWins ? game.awayTeamScore : game.homeTeamScore;

  return `${game.predictedWinner} ${winnerScore}-${loserScore}`;
}

function gameKey(game: Pick<GamePrediction, 'awayTeam' | 'homeTeam'>): string {
  return `${game.awayTeam}|${game.homeTeam}`;
}
