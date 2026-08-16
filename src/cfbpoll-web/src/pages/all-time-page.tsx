import { useMemo } from 'react';

import {
  allTimeRankColumn,
  rankColumn,
  ratingColumn,
  ratingZScoreColumn,
  recordColumn,
  seasonColumn,
  teamNameColumn,
  weightedSOSColumn,
} from '../components/all-time/all-time-columns';
import { AllTimeTable } from '../components/all-time/all-time-table';
import { ErrorAlert } from '../components/error';
import { CollapsibleSection } from '../components/ui/collapsible-section';
import { useAllTime } from '../hooks/use-all-time';
import { useDocumentTitle } from '../hooks/use-document-title';
import { usePreloadImages } from '../hooks/use-preload-images';
import { collectLogoUrls } from '../lib/logo-utils';

export function AllTimePage() {
  useDocumentTitle('Taylor Steinberg - All-Time Rankings');

  const { data, isLoading, error, refetch } = useAllTime();

  const allTimeLogoUrls = useMemo(
    () => data ? collectLogoUrls(data.bestTeams, data.worstTeams, data.hardestSchedules) : [],
    [data]
  );
  usePreloadImages(allTimeLogoUrls);

  const defaultColumns = useMemo(
    () => [allTimeRankColumn, teamNameColumn, seasonColumn, recordColumn, rankColumn, ratingZScoreColumn],
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
      <h1 className="text-3xl font-bold text-text-primary mb-2">All-Time Rankings</h1>
      <p className="text-text-secondary leading-relaxed mb-6">
        This covers every season back to 2002, so ratings are shown relative to that year&rsquo;s own field (a
        z-score) instead of a raw number. Otherwise a great team from a down year would look worse than a good team
        from a loaded one. Even so, take cross-era comparisons with a grain of salt: both the level of competition
        and the rating method have changed a lot since 2002.
      </p>

      {error && (
        <ErrorAlert error={error} onRetry={() => refetch()} />
      )}

      {sections.map((section) => (
        <CollapsibleSection key={section.title} title={section.title}>
          <div className="bg-surface shadow-md rounded-xl overflow-hidden animate-fade-in">
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

export default AllTimePage;
