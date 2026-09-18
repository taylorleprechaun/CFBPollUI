import { useEffect, useRef } from 'react';

import type { ScoreOverrideDisclosure } from '../../types';

import { getWeekLabel } from '../../lib/week-utils';
import { BUTTON_SECONDARY } from '../ui/button-styles';
import { TeamLogo } from './team-logo';

interface ScoreOverrideModalProps {
  onClose: () => void;
  scoreOverrides: ScoreOverrideDisclosure[];
}

export function ScoreOverrideModal({ onClose, scoreOverrides }: ScoreOverrideModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

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
      aria-labelledby="score-override-modal-title"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="bg-surface rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="score-override-modal-title" className="text-lg font-semibold text-text-primary mb-4">
          Manually Corrected Scores
        </h2>

        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {scoreOverrides.map((override) => (
            <li key={override.gameID} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <TeamLogo logoURL={override.awayTeamLogoURL ?? ''} teamName={override.awayTeam} />
                <span className="font-medium text-text-primary">{override.awayTeam}</span>
                <span className="text-text-muted">@</span>
                <TeamLogo logoURL={override.homeTeamLogoURL ?? ''} teamName={override.homeTeam} />
                <span className="font-medium text-text-primary">{override.homeTeam}</span>
                <span className="text-text-muted text-xs ml-auto">{getWeekLabel(override.week)}</span>
              </div>
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Score:</span>{' '}
                {override.originalAwayPoints}-{override.originalHomePoints} &rarr;{' '}
                {override.overrideAwayPoints}-{override.overrideHomePoints}
              </p>
              <p className="text-sm text-text-secondary">{override.reason}</p>
            </li>
          ))}
        </ul>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className={BUTTON_SECONDARY}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
