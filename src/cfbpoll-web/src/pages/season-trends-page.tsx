import { useMemo } from 'react';

import { ErrorAlert } from '../components/error';
import { SeasonTrendsChart } from '../components/season-trends/season-trends-chart';
import { useSeason } from '../contexts/season-context';
import { useDocumentTitle } from '../hooks/use-document-title';
import { usePreloadImages } from '../hooks/use-preload-images';
import { useSeasonTrends } from '../hooks/use-season-trends';

export function SeasonTrendsPage() {
  useDocumentTitle('Taylor Steinberg - Season Trends');

  const {
    seasons,
    seasonsLoading,
    selectedSeason,
    setSelectedSeason,
  } = useSeason();

  const maxSeason = seasons.length > 0 ? seasons[0] : null;

  const { data, isLoading, error, refetch } = useSeasonTrends(selectedSeason, maxSeason);

  const logoUrls = useMemo(
    () => data?.teams.map((t) => t.logoURL) ?? [],
    [data]
  );
  usePreloadImages(logoUrls);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Season Trends</h1>

      <div className="mb-6">
        <label htmlFor="season-select" className="block text-sm font-medium text-text-secondary mb-1">
          Season
        </label>
        <select
          id="season-select"
          className="bg-surface border border-border rounded-lg px-3 py-2 text-text-primary"
          value={selectedSeason ?? ''}
          onChange={(e) => setSelectedSeason(Number(e.target.value))}
          disabled={seasonsLoading}
        >
          {seasons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => refetch()} />}

      {isLoading && (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-text-muted">Loading...</div>
        </div>
      )}

      {data && (
        <div className="animate-fade-in">
          <SeasonTrendsChart data={data} />
        </div>
      )}
    </div>
  );
}
