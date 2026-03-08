import { useId } from 'react';
import { SELECT_BASE } from '../ui/button-styles';

interface SeasonSelectorProps {
  seasons: number[];
  selectedSeason: number | null;
  onSeasonChange: (season: number) => void;
  isLoading: boolean;
}

export function SeasonSelector({
  seasons,
  selectedSeason,
  onSeasonChange,
  isLoading,
}: SeasonSelectorProps) {
  const id = useId();

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor={id} className="font-medium text-text-secondary">
        Season:
      </label>
      <select
        id={id}
        value={selectedSeason ?? ''}
        onChange={(e) => onSeasonChange(Number(e.target.value))}
        disabled={isLoading}
        className={`block w-32 ${SELECT_BASE}`}
      >
        {isLoading ? (
          <option>Loading...</option>
        ) : (
          seasons.map((season) => (
            <option key={season} value={season}>
              {season}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
