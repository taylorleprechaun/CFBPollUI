import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSeasons } from '../hooks/use-seasons';

interface SeasonContextValue {
  refetchSeasons: () => void;
  seasons: number[];
  seasonsError: Error | null;
  seasonsLoading: boolean;
  selectedSeason: number | null;
  setSelectedSeason: (season: number) => void;
}

const SeasonContext = createContext<SeasonContextValue | null>(null);

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

  const value = useMemo<SeasonContextValue>(() => ({
    refetchSeasons,
    seasons: seasonsData?.seasons ?? [],
    seasonsError: seasonsError as Error | null,
    seasonsLoading,
    selectedSeason,
    setSelectedSeason,
  }), [refetchSeasons, seasonsData, seasonsError, seasonsLoading, selectedSeason, setSelectedSeason]);

  useEffect(() => {
    if (seasonsData?.seasons?.length && selectedSeason === null) {
      const season = seasonsData.seasons[0];
      setSelectedSeasonState(season);
      sessionStorage.setItem(STORAGE_KEY, String(season));
    }
  }, [seasonsData, selectedSeason]);

  return (
    <SeasonContext.Provider value={value}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason(): SeasonContextValue {
  const context = useContext(SeasonContext);
  if (context === null) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
}
