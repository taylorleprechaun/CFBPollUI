import { useCallback, useState } from 'react';

const STORAGE_KEY = 'cfbpoll_show_margin_stats';

export interface UseMarginStatsVisibilityResult {
  showMarginStats: boolean;
  toggleMarginStats: () => void;
}

export function useMarginStatsVisibility(): UseMarginStatsVisibilityResult {
  const [showMarginStats, setShowMarginStats] = useState<boolean>(getStoredVisibility);

  const toggleMarginStats = useCallback(() => {
    setShowMarginStats((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { showMarginStats, toggleMarginStats };
}

function getStoredVisibility(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}
