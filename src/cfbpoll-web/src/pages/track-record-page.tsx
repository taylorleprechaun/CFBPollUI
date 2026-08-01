import { useMemo } from 'react';

import { ErrorAlert } from '../components/error';
import { OverallRecordCard } from '../components/track-record/overall-record-card';
import { TrackRecordTable } from '../components/track-record/track-record-table';
import { EmptyState } from '../components/ui/empty-state';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useTrackRecord } from '../hooks/use-track-record';

export function TrackRecordPage() {
  useDocumentTitle('Taylor Steinberg - Track Record');

  const { data, isLoading, error, refetch } = useTrackRecord();

  const weeksDescending = useMemo(
    () => data ? [...data.weeks].reverse() : [],
    [data]
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <OverallRecordCard label="Winner" totals={data.overallWinner} />
            <OverallRecordCard label="Spread" totals={data.overallSpread} />
            <OverallRecordCard label="Over/Under" totals={data.overallOverUnder} />
          </div>

          <div className="bg-surface shadow-md rounded-xl overflow-hidden">
            <TrackRecordTable weeks={weeksDescending} />
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackRecordPage;
