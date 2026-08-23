import { useEffect, useId, useRef, useState } from 'react';

import type { Week } from '../../types';

import { WEEK_GAP_TOOLTIP_SUMMARY } from '../../lib/week-gap-tooltip';
import { BUTTON_GHOST, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui/button-styles';
import { InfoTooltip } from '../ui/info-tooltip';

interface CompareSeasonWeeksModalProps {
  onCancel: () => void;
  onConfirm: (weeks: number[]) => void;
  season: number;
  weeks: Week[];
}

export function CompareSeasonWeeksModal({ onCancel, onConfirm, season, weeks }: CompareSeasonWeeksModalProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>(weeks.map((w) => w.weekNumber));

  const idPrefix = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;
    containerRef.current?.querySelector<HTMLElement>('button, input')?.focus();

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
        onCancel();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = containerRef.current?.querySelectorAll<HTMLElement>('button, input');
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  function handleToggleWeek(weekNumber: number) {
    setSelectedWeeks((prev) =>
      prev.includes(weekNumber) ? prev.filter((w) => w !== weekNumber) : [...prev, weekNumber]
    );
  }

  function handleDeselectAll() {
    setSelectedWeeks([]);
  }

  function handleSelectAll() {
    setSelectedWeeks(weeks.map((w) => w.weekNumber));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-season-weeks-title"
      onClick={onCancel}
    >
      <div
        ref={containerRef}
        className="bg-surface rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 mb-4">
          <h2 id="compare-season-weeks-title" className="text-lg font-semibold text-text-primary">
            Compare Season {season}
          </h2>
          <InfoTooltip statName="Week scheduling gap" summary={WEEK_GAP_TOOLTIP_SUMMARY} />
        </div>

        <fieldset className="mb-4">
          <legend className="sr-only">Weeks to include</legend>

          <div className="flex gap-2 mb-3">
            <button onClick={handleSelectAll} className={BUTTON_GHOST}>
              Select All
            </button>
            <button onClick={handleDeselectAll} className={BUTTON_GHOST}>
              Deselect All
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
            {weeks.map((week) => {
              const inputId = `${idPrefix}-week-${week.weekNumber}`;
              return (
                <div key={week.weekNumber} className="flex items-center gap-2">
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={selectedWeeks.includes(week.weekNumber)}
                    onChange={() => handleToggleWeek(week.weekNumber)}
                  />
                  <label htmlFor={inputId} className="text-sm text-text-primary">
                    {week.label}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className={BUTTON_SECONDARY}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedWeeks)}
            disabled={selectedWeeks.length === 0}
            className={BUTTON_PRIMARY}
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}
