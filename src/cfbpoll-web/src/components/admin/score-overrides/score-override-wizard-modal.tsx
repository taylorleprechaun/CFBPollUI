import { useEffect, useId, useRef, useState } from 'react';

import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../../ui/button-styles';

const INPUT_CLASS =
  'w-full px-3 py-2 border border-border bg-surface text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent';

export interface ScoreOverrideTarget {
  awayPoints: number;
  awayTeam: string;
  gameID: number;
  homePoints: number;
  homeTeam: string;
  reason: string;
}

type WizardStep = 'edit' | 'review';

interface ScoreOverrideWizardModalProps {
  isEditing: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: (overrideHomePoints: number, overrideAwayPoints: number, reason: string) => void;
  target: ScoreOverrideTarget;
}

export function ScoreOverrideWizardModal({ isEditing, isSaving, onCancel, onConfirm, target }: ScoreOverrideWizardModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  const [step, setStep] = useState<WizardStep>('edit');
  const [homePoints, setHomePoints] = useState(target.homePoints);
  const [awayPoints, setAwayPoints] = useState(target.awayPoints);
  const [reason, setReason] = useState(target.reason);
  const [understood, setUnderstood] = useState(false);
  const [typedScore, setTypedScore] = useState('');

  const awayId = useId();
  const homeId = useId();
  const reasonId = useId();
  const typedScoreId = useId();
  const understoodId = useId();

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;
    containerRef.current?.querySelector<HTMLElement>('input, textarea')?.focus();

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
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const scoreChanged = homePoints !== target.homePoints || awayPoints !== target.awayPoints;
  const canProceedToReview = isEditing
    ? reason.trim().length > 0 && reason.trim() !== target.reason
    : reason.trim().length > 0 && scoreChanged;

  const expectedTypedScore = `${awayPoints}-${homePoints}`;
  const canConfirm = isEditing
    ? understood && !isSaving
    : understood && typedScore.trim() === expectedTypedScore && !isSaving;

  function handleConfirm() {
    onConfirm(homePoints, awayPoints, reason.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-override-wizard-title"
      onClick={onCancel}
    >
      <div
        ref={containerRef}
        className="bg-surface rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="score-override-wizard-title" className="text-lg font-semibold text-text-primary">
          Override Score: {target.awayTeam} @ {target.homeTeam}
        </h2>

        {step === 'edit' && (
          <>
            {isEditing ? (
              <p className="text-sm text-text-secondary">
                Current override score:{' '}
                <span className="font-medium text-text-primary">
                  {target.awayTeam} {awayPoints} - {homePoints} {target.homeTeam}
                </span>
              </p>
            ) : (
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label htmlFor={awayId} className="block text-sm font-medium text-text-secondary mb-1">
                    {target.awayTeam} Score
                  </label>
                  <input
                    id={awayId}
                    type="number"
                    value={awayPoints}
                    onChange={(e) => setAwayPoints(Number(e.target.value))}
                    className={`w-24 ${INPUT_CLASS}`}
                  />
                </div>
                <div>
                  <label htmlFor={homeId} className="block text-sm font-medium text-text-secondary mb-1">
                    {target.homeTeam} Score
                  </label>
                  <input
                    id={homeId}
                    type="number"
                    value={homePoints}
                    onChange={(e) => setHomePoints(Number(e.target.value))}
                    className={`w-24 ${INPUT_CLASS}`}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor={reasonId} className="block text-sm font-medium text-text-secondary mb-1">
                Reason
              </label>
              <textarea
                id={reasonId}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={INPUT_CLASS}
                placeholder="Explain why this score is being corrected..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={onCancel} className={BUTTON_SECONDARY}>
                Cancel
              </button>
              <button onClick={() => setStep('review')} disabled={!canProceedToReview} className={BUTTON_PRIMARY}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <div className="text-sm text-text-secondary space-y-1">
              {isEditing ? (
                <p>
                  <span className="font-medium text-text-primary">Score:</span> {awayPoints}-{homePoints} (unchanged)
                </p>
              ) : (
                <>
                  <p>
                    <span className="font-medium text-text-primary">{target.awayTeam}:</span>{' '}
                    {target.awayPoints} &rarr; {awayPoints}
                  </p>
                  <p>
                    <span className="font-medium text-text-primary">{target.homeTeam}:</span>{' '}
                    {target.homePoints} &rarr; {homePoints}
                  </p>
                </>
              )}
              <p className="pt-1">
                <span className="font-medium text-text-primary">Reason:</span> {reason.trim()}
              </p>
            </div>

            <p className="text-amber-600 text-sm">
              This does not retroactively update rankings or predictions that have already been published.
              It only affects new calculations and anything explicitly recalculated afterward.
            </p>

            <div className="flex items-start gap-2">
              <input
                id={understoodId}
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor={understoodId} className="text-sm text-text-secondary">
                I understand this does not retroactively update published results.
              </label>
            </div>

            {!isEditing && (
              <div>
                <label htmlFor={typedScoreId} className="block text-sm font-medium text-text-secondary mb-1">
                  Type {expectedTypedScore} to confirm
                </label>
                <input
                  id={typedScoreId}
                  type="text"
                  value={typedScore}
                  onChange={(e) => setTypedScore(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setStep('edit')} className={BUTTON_SECONDARY}>
                Back
              </button>
              <button onClick={handleConfirm} disabled={!canConfirm} className={BUTTON_PRIMARY}>
                {isSaving ? 'Saving...' : 'Confirm Override'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
