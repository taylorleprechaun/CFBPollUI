import { useState } from 'react';

import { InfoIcon } from '../ui/icons';
import { IncompleteGamesModal } from './incomplete-games-modal';

interface IncompleteWeekBannerProps {
  season: number;
  token: string | null;
  variant: 'predictions' | 'ratings';
  week: number;
}

const MESSAGES: Record<IncompleteWeekBannerProps['variant'], string> = {
  predictions: 'Warning: Last week’s games have not all been played yet, so predictions generated now would be based on incomplete data.',
  ratings: 'Warning: Last week’s games have not all been played yet, so ratings for this week are not ready to calculate.',
};

export function IncompleteWeekBanner({ season, token, variant, week }: IncompleteWeekBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <p className="text-amber-600 text-sm flex items-center gap-1.5">
        {MESSAGES[variant]}
        <button
          type="button"
          aria-label="Show which games are incomplete"
          onClick={() => setIsModalOpen(true)}
          className="text-amber-600 hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded-full shrink-0"
        >
          <InfoIcon />
        </button>
      </p>

      {isModalOpen && (
        <IncompleteGamesModal
          onClose={() => setIsModalOpen(false)}
          season={season}
          token={token}
          week={week}
        />
      )}
    </>
  );
}
