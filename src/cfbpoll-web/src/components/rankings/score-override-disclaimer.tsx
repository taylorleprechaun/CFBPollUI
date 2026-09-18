import { useState } from 'react';

import type { ScoreOverrideDisclosure } from '../../types';

import { InfoIcon } from '../ui/icons';
import { ScoreOverrideModal } from './score-override-modal';

interface ScoreOverrideDisclaimerProps {
  scoreOverrides: ScoreOverrideDisclosure[];
}

export function ScoreOverrideDisclaimer({ scoreOverrides }: ScoreOverrideDisclaimerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (scoreOverrides.length === 0) {
    return null;
  }

  return (
    <>
      <p className="flex items-center gap-1.5 text-sm text-amber-600">
        Includes a manually corrected score
        <button
          type="button"
          aria-label="Show manually corrected scores"
          onClick={() => setIsModalOpen(true)}
          className="text-amber-600 hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded-full shrink-0"
        >
          <InfoIcon />
        </button>
      </p>

      {isModalOpen && (
        <ScoreOverrideModal onClose={() => setIsModalOpen(false)} scoreOverrides={scoreOverrides} />
      )}
    </>
  );
}
