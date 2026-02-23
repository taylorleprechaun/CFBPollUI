import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ErrorAlert } from '../components/error';
import { PollLeadersChart } from '../components/poll-leaders/poll-leaders-chart';
import { YearRangeSelector } from '../components/poll-leaders/year-range-selector';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { useDocumentTitle } from '../hooks/use-document-title';
import { usePollLeaders } from '../hooks/use-poll-leaders';

const SLIDER_DEBOUNCE_MS = 300;

export function PollLeadersPage() {
  useDocumentTitle('Taylor Steinberg - Poll Leaders');

  const [searchParams, setSearchParams] = useSearchParams();

  const minSeasonParam = searchParams.get('minSeason');
  const maxSeasonParam = searchParams.get('maxSeason');
  const rawMode = searchParams.get('mode');
  const modeParam = rawMode === 'final' ? 'final' : 'all';
  const rawTopN = searchParams.get('topN');
  const topNParam = rawTopN === '5' ? '5' : '10';

  const minSeason = minSeasonParam ? Number(minSeasonParam) : undefined;
  const maxSeason = maxSeasonParam ? Number(maxSeasonParam) : undefined;

  const debouncedMinSeason = useDebouncedValue(minSeason, SLIDER_DEBOUNCE_MS);
  const debouncedMaxSeason = useDebouncedValue(maxSeason, SLIDER_DEBOUNCE_MS);

  const { data, isLoading, error, refetch } = usePollLeaders(debouncedMinSeason, debouncedMaxSeason);

  useEffect(() => {
    if (data && !minSeasonParam && !maxSeasonParam) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('minSeason', String(data.minAvailableSeason));
        next.set('maxSeason', String(data.maxAvailableSeason));
        return next;
      }, { replace: true });
    }
  }, [data, minSeasonParam, maxSeasonParam, setSearchParams]);

  const handleMinSeasonChange = (season: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('minSeason', String(season));
      return next;
    });
  };

  const handleMaxSeasonChange = (season: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('maxSeason', String(season));
      return next;
    });
  };

  const handleModeChange = (mode: 'all' | 'final') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('mode', mode);
      return next;
    });
  };

  const handleTopNChange = (topN: '5' | '10') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('topN', topN);
      return next;
    });
  };

  const activeData = data
    ? modeParam === 'final'
      ? data.finalWeeksOnly
      : data.allWeeks
    : [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Poll Leaders</h1>

      {error && <ErrorAlert error={error} onRetry={() => refetch()} />}

      {isLoading && (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}

      {data && (
        <PollLeadersChart
          data={activeData}
          mode={modeParam}
          onModeChange={handleModeChange}
          onTopNChange={handleTopNChange}
          topN={topNParam}
        >
          <YearRangeSelector
            maxAvailable={data.maxAvailableSeason}
            maxSeason={maxSeason ?? data.maxAvailableSeason}
            minAvailable={data.minAvailableSeason}
            minSeason={minSeason ?? data.minAvailableSeason}
            onMaxSeasonChange={handleMaxSeasonChange}
            onMinSeasonChange={handleMinSeasonChange}
          />
        </PollLeadersChart>
      )}
    </div>
  );
}
