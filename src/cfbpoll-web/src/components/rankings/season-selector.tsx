import { useId } from 'react';

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
      <label htmlFor={id} className="font-medium text-gray-700">
        Season:
      </label>
      <select
        id={id}
        value={selectedSeason ?? ''}
        onChange={(e) => onSeasonChange(Number(e.target.value))}
        disabled={isLoading}
        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
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
