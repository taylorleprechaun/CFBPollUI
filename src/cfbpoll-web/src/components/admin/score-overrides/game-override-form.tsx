import { useId, useState } from 'react';

import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../../ui/button-styles';

const INPUT_CLASS =
  'w-full px-3 py-2 border border-border bg-surface text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent';

export interface GameOverrideFormTarget {
  awayPoints: number;
  awayTeam: string;
  gameID: number;
  homePoints: number;
  homeTeam: string;
  reason: string;
}

interface GameOverrideFormProps {
  isSaving: boolean;
  onCancel: () => void;
  onSave: (overrideHomePoints: number, overrideAwayPoints: number, reason: string) => void;
  target: GameOverrideFormTarget;
}

export function GameOverrideForm({ isSaving, onCancel, onSave, target }: GameOverrideFormProps) {
  const [homePoints, setHomePoints] = useState(target.homePoints);
  const [awayPoints, setAwayPoints] = useState(target.awayPoints);
  const [reason, setReason] = useState(target.reason);

  const awayId = useId();
  const homeId = useId();
  const reasonId = useId();

  const canSave = reason.trim().length > 0 && !isSaving;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4 animate-fade-in">
      <h2 className="text-lg font-semibold text-text-primary">
        Override Score: {target.awayTeam} @ {target.homeTeam}
      </h2>

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
        <button
          onClick={() => onSave(homePoints, awayPoints, reason.trim())}
          disabled={!canSave}
          className={BUTTON_PRIMARY}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
