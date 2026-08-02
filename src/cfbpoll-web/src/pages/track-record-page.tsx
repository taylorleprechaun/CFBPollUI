import { useMemo, useState } from 'react';

import { ErrorAlert } from '../components/error';
import { SeasonSelector } from '../components/rankings/season-selector';
import { OverallRecordCard } from '../components/track-record/overall-record-card';
import { TrackRecordTable } from '../components/track-record/track-record-table';
import { EmptyState } from '../components/ui/empty-state';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useTrackRecord } from '../hooks/use-track-record';
import { sumTotals } from '../lib/track-record-utils';

export function TrackRecordPage() {
  useDocumentTitle('Taylor Steinberg - Track Record');

  const { data, isLoading, error, refetch } = useTrackRecord();

  const weeksDescending = useMemo(
    () => data ? [...data.weeks].sort((a, b) => b.season - a.season || b.week - a.week) : [],
    [data]
  );

  const seasons = useMemo(
    () => [...new Set(data?.weeks.map((w) => w.season) ?? [])].sort((a, b) => b - a),
    [data]
  );

  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const effectiveSeason = selectedSeason ?? seasons[0] ?? null;

  const seasonWeeksDescending = useMemo(
    () => weeksDescending.filter((w) => w.season === effectiveSeason),
    [weeksDescending, effectiveSeason]
  );

  const seasonOverallWinner = useMemo(
    () => sumTotals(seasonWeeksDescending.map((w) => w.winner)),
    [seasonWeeksDescending]
  );
  const seasonOverallSpread = useMemo(
    () => sumTotals(seasonWeeksDescending.map((w) => w.spread)),
    [seasonWeeksDescending]
  );
  const seasonOverallOverUnder = useMemo(
    () => sumTotals(seasonWeeksDescending.map((w) => w.overUnder)),
    [seasonWeeksDescending]
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Track Record</h1>

      {error && <ErrorAlert error={error} onRetry={() => refetch()} />}

      {isLoading && (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-text-muted">Loading...</div>
        </div>
      )}

      {data && data.weeks.length === 0 && (
        <EmptyState message="No graded predictions have been published yet." />
      )}

      {data && data.weeks.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-3">All-Time</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <OverallRecordCard label="Winner" totals={data.overallWinner} />
              <OverallRecordCard label="Spread" totals={data.overallSpread} />
              <OverallRecordCard label="Over/Under" totals={data.overallOverUnder} />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <h2 className="text-lg font-semibold text-text-primary">By Season</h2>
              <SeasonSelector
                seasons={seasons}
                selectedSeason={effectiveSeason}
                onSeasonChange={setSelectedSeason}
                isLoading={false}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <OverallRecordCard label="Winner" totals={seasonOverallWinner} />
              <OverallRecordCard label="Spread" totals={seasonOverallSpread} />
              <OverallRecordCard label="Over/Under" totals={seasonOverallOverUnder} />
            </div>
            <div className="bg-surface shadow-md rounded-xl overflow-hidden">
              <TrackRecordTable weeks={seasonWeeksDescending} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackRecordPage;
