import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import type { StaleScoreOverride } from '../../schemas/admin';

import { getStaleScoreOverrideKindLabel } from '../../lib/stale-score-overrides';
import { getWeekLabel } from '../../lib/week-utils';
import { BUTTON_SECONDARY } from '../ui/button-styles';

interface StaleScoreOverridesModalProps {
  differences: StaleScoreOverride[];
  isPublished: boolean;
  onClose: () => void;
  season: number;
  week: number;
}

export function StaleScoreOverridesModal({ differences, isPublished, onClose, season, week }: StaleScoreOverridesModalProps) {
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
      aria-labelledby="stale-score-overrides-modal-title"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="bg-surface rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="stale-score-overrides-modal-title" className="text-lg font-semibold text-text-primary mb-1">
          Score Override Changes
        </h2>
        <p className="text-sm text-text-muted mb-4">
          {season} {getWeekLabel(week)} ({isPublished ? 'published' : 'draft'})
        </p>

        <p className="text-sm text-text-secondary mb-4">
          {isPublished
            ? 'This ranking was calculated before these score override changes, so its numbers and public disclosure reflect the overrides as they were then. That is expected for a published week. Recalculating would apply the current overrides and reset it to a draft.'
            : 'This ranking was calculated with a different set of score overrides than currently apply to it. Recalculate it so the numbers reflect them before publishing.'}
        </p>

        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {differences.map((difference) => (
            <li key={difference.gameID} className="border border-border rounded-lg p-3 text-sm">
              <span className="font-medium text-text-primary">
                {difference.awayTeam} @ {difference.homeTeam}
              </span>
              <span className="block text-text-muted">{getStaleScoreOverrideKindLabel(difference.kind)}</span>
            </li>
          ))}
        </ul>

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
