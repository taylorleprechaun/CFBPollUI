import { useMemo } from 'react';
import {
  AllTimeTable,
  allTimeRankColumn,
  teamNameColumn,
  seasonColumn,
  recordColumn,
  rankColumn,
  ratingColumn,
  weightedSOSColumn,
} from '../components/all-time/all-time-table';
import { ErrorAlert } from '../components/error';
import { CollapsibleSection } from '../components/ui/collapsible-section';
import { useAllTime } from '../hooks/use-all-time';
import { useDocumentTitle } from '../hooks/use-document-title';

export function AllTimePage() {
  useDocumentTitle('Taylor Steinberg - All-Time Rankings');

  const { data, isLoading, error, refetch } = useAllTime();

  const defaultColumns = useMemo(
    () => [allTimeRankColumn, teamNameColumn, seasonColumn, recordColumn, rankColumn, ratingColumn, weightedSOSColumn],
    []
  );

  const hardestSchedulesColumns = useMemo(
    () => [allTimeRankColumn, teamNameColumn, seasonColumn, recordColumn, rankColumn, weightedSOSColumn, ratingColumn],
    []
  );

  const sections = useMemo(() => [
    { title: 'Best Teams', entries: data?.bestTeams ?? [], columns: defaultColumns },
    { title: 'Worst Teams', entries: data?.worstTeams ?? [], columns: defaultColumns },
    { title: 'Hardest Schedules', entries: data?.hardestSchedules ?? [], columns: hardestSchedulesColumns },
  ], [data, defaultColumns, hardestSchedulesColumns]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All-Time Rankings</h1>

      {error && (
        <ErrorAlert error={error} onRetry={() => refetch()} />
      )}

      {sections.map((section) => (
        <CollapsibleSection key={section.title} title={section.title}>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <AllTimeTable
              columns={section.columns}
              entries={section.entries}
              isLoading={isLoading}
            />
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
}
