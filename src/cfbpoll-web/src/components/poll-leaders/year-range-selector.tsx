interface YearRangeSelectorProps {
  maxAvailable: number;
  maxSeason: number;
  minAvailable: number;
  minSeason: number;
  onMaxSeasonChange: (season: number) => void;
  onMinSeasonChange: (season: number) => void;
}

export function YearRangeSelector({
  maxAvailable,
  maxSeason,
  minAvailable,
  minSeason,
  onMaxSeasonChange,
  onMinSeasonChange,
}: YearRangeSelectorProps) {
  const range = maxAvailable - minAvailable;
  const leftPercent = range === 0 ? 0 : ((minSeason - minAvailable) / range) * 100;
  const rightPercent = range === 0 ? 100 : ((maxSeason - minAvailable) / range) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm font-medium text-text-secondary">
        <span>{minSeason}</span>
        <span>{maxSeason}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 rounded bg-border" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 rounded bg-blue-500"
          style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
        />
        <input
          aria-label="Minimum year"
          aria-valuemax={maxAvailable}
          aria-valuemin={minAvailable}
          aria-valuenow={minSeason}
          className="dual-range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
          max={maxAvailable}
          min={minAvailable}
          onChange={(e) => onMinSeasonChange(Math.min(Number(e.target.value), maxSeason))}
          step={1}
          type="range"
          value={minSeason}
        />
        <input
          aria-label="Maximum year"
          aria-valuemax={maxAvailable}
          aria-valuemin={minAvailable}
          aria-valuenow={maxSeason}
          className="dual-range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
          max={maxAvailable}
          min={minAvailable}
          onChange={(e) => onMaxSeasonChange(Math.max(Number(e.target.value), minSeason))}
          step={1}
          type="range"
          value={maxSeason}
        />
      </div>
    </div>
  );
}
