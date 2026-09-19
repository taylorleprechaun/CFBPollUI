import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import type { GamePredictionPublic } from '../../schemas';

import { TeamLogo } from '../rankings/team-logo';
import { BUTTON_SECONDARY } from '../ui/button-styles';

interface OfficialScoreModalProps {
  onClose: () => void;
  prediction: GamePredictionPublic;
}

// Rendered through a portal because the predictions views place this inside sticky, z-indexed
// containers, which would otherwise clip the modal or paint later siblings over it.
export function OfficialScoreModal({ onClose, prediction: p }: OfficialScoreModalProps) {
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="official-score-modal-title"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="bg-surface rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="official-score-modal-title" className="text-lg font-semibold text-text-primary mb-4">
          Graded on the Official Score
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <TeamLogo logoURL={p.awayLogoURL} teamName={p.awayTeam} />
            <span className="font-medium text-text-primary">{p.awayTeam}</span>
            <span className="text-text-muted">@</span>
            <TeamLogo logoURL={p.homeLogoURL} teamName={p.homeTeam} />
            <span className="font-medium text-text-primary">{p.homeTeam}</span>
          </div>
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Official final:</span>{' '}
            {p.actualAwayScore}-{p.actualHomeScore}
          </p>
          <p className="text-sm text-text-secondary">
            This pick was graded on the officially recorded score, which is what sportsbooks settle on.
            Elsewhere on the site this game is treated as a manually corrected result.
          </p>
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Reason for the correction:</span>{' '}
            {p.scoreOverrideReason}
          </p>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className={BUTTON_SECONDARY}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
