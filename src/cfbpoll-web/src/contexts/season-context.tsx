import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useSeasons } from '../hooks/use-seasons';
import { SeasonContext, type SeasonContextValue } from '../hooks/use-season';

const STORAGE_KEY = 'cfbpoll_selected_season';

function readStoredSeason(): number | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = Number(stored);
    return Number.isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

export function SeasonProvider({ children }: { children: ReactNode }) {
  const {
    data: seasonsData,
    isLoading: seasonsLoading,
    error: seasonsError,
    refetch: refetchSeasons,
  } = useSeasons();

  const [selectedSeason, setSelectedSeasonState] = useState<number | null>(() => readStoredSeason());

  const setSelectedSeason = useCallback((season: number) => {
    setSelectedSeasonState(season);
    sessionStorage.setItem(STORAGE_KEY, String(season));
  }, []);

  if (seasonsData?.seasons?.length && selectedSeason === null) {
    setSelectedSeason(seasonsData.seasons[0]);
  }

  const value = useMemo<SeasonContextValue>(() => ({
    refetchSeasons,
    seasons: seasonsData?.seasons ?? [],
    seasonsError: seasonsError as Error | null,
    seasonsLoading,
    selectedSeason,
    setSelectedSeason,
  }), [refetchSeasons, seasonsData, seasonsError, seasonsLoading, selectedSeason, setSelectedSeason]);

  return (
    <SeasonContext.Provider value={value}>
      {children}
    </SeasonContext.Provider>
  );
}
