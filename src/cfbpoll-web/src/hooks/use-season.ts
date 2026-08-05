import { createContext, useContext } from 'react';

export interface SeasonContextValue {
  refetchSeasons: () => void;
  seasons: number[];
  seasonsError: Error | null;
  seasonsLoading: boolean;
  selectedSeason: number | null;
  setSelectedSeason: (season: number) => void;
}

export const SeasonContext = createContext<SeasonContextValue | null>(null);

export function useSeason(): SeasonContextValue {
  const context = useContext(SeasonContext);
  if (context === null) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
}
