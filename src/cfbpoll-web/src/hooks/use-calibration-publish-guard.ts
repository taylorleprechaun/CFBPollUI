import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { fetchPredictionCalibration } from '../services/admin-api';

interface PendingPublish {
  feedbackKeyPrefix: string;
  season: number;
  week: number;
}

/**
 * Checks a week's calibration before publishing its predictions. When the draft was generated with values that
 * differ from the ones now saved, publishing waits for confirmation, since publishing locks the week's values.
 * If the check itself fails, publishing goes ahead: the check is advisory and shouldn't block a publish.
 */
export function useCalibrationPublishGuard(token: string | null, onPublish: (season: number, week: number, feedbackKeyPrefix: string) => void) {
  const [pendingPublish, setPendingPublish] = useState<PendingPublish | null>(null);
  const queryClient = useQueryClient();

  async function requestPublish(season: number, week: number, feedbackKeyPrefix: string) {
    if (token) {
      try {
        const calibration = await queryClient.fetchQuery({
          queryFn: () => fetchPredictionCalibration(token, season, week),
          queryKey: ['prediction-calibration', season, week],
          staleTime: 0,
        });
        if (calibration.isSupported && calibration.draftUsesDifferentValues) {
          setPendingPublish({ feedbackKeyPrefix, season, week });
          return;
        }
      } catch {
        // Fall through to publishing; the check is advisory.
      }
    }

    onPublish(season, week, feedbackKeyPrefix);
  }

  function confirmPublish() {
    if (!pendingPublish) return;
    setPendingPublish(null);
    onPublish(pendingPublish.season, pendingPublish.week, pendingPublish.feedbackKeyPrefix);
  }

  return {
    cancelPublish: () => setPendingPublish(null),
    confirmPublish,
    pendingPublish,
    requestPublish,
  };
}
