import { useMemo } from 'react';
import { getWeekLabel } from '../../lib/week-utils';
import { ChevronIcon } from '../ui/chevron-icon';
import { SuccessCheckmark } from './success-checkmark';
import type { PersistedWeek } from '../../schemas/admin';
import type { ActionFeedback } from './types';

interface PersistedSnapshotsSectionProps {
  actionFeedback: ActionFeedback | null;
  collapsedSeasons: Set<number>;
  isActionPending: boolean;
  onClearFeedback: () => void;
  onCollapseAll: () => void;
  onDelete: (season: number, week: number, published: boolean) => void;
  onExpandAll: () => void;
  onExport: (season: number, week: number) => void;
  onPublish: (season: number, week: number, source: 'preview' | 'snapshot') => void;
  onToggleSeason: (season: number) => void;
  persistedWeeks: PersistedWeek[];
}

export function PersistedSnapshotsSection({
  actionFeedback,
  collapsedSeasons,
  isActionPending,
  onClearFeedback,
  onCollapseAll,
  onDelete,
  onExpandAll,
  onExport,
  onPublish,
  onToggleSeason,
  persistedWeeks,
}: PersistedSnapshotsSectionProps) {
  const groupedPersistedWeeks = useMemo(() => {
    const sorted = [...persistedWeeks].sort((a, b) => {
      if (a.season !== b.season) return b.season - a.season;
      return b.week - a.week;
    });

    const groups: { season: number; weeks: PersistedWeek[] }[] = [];
    for (const pw of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.season === pw.season) {
        last.weeks.push(pw);
      } else {
        groups.push({ season: pw.season, weeks: [pw] });
      }
    }
    return groups;
  }, [persistedWeeks]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Persisted Snapshots</h2>
        {groupedPersistedWeeks.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={onExpandAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Expand All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={onCollapseAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>
      {groupedPersistedWeeks.length === 0 ? (
        <p className="text-gray-500">No persisted snapshots found.</p>
      ) : (
        <div className="space-y-2">
          {groupedPersistedWeeks.map((group) => {
            const isCollapsed = collapsedSeasons.has(group.season);
            return (
              <div key={group.season} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => onToggleSeason(group.season)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left font-medium text-gray-900"
                >
                  <ChevronIcon open={!isCollapsed} size="w-4 h-4" />
                  <span>{group.season} Season</span>
                  <span className="text-sm font-normal text-gray-500">
                    ({group.weeks.length} snapshot{group.weeks.length !== 1 ? 's' : ''})
                  </span>
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isCollapsed ? '0fr' : '1fr' }}
                >
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.weeks.map((pw) => {
                          const publishKey = `snapshot-publish-${pw.season}-${pw.week}`;
                          return (
                            <tr key={`${pw.season}-${pw.week}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getWeekLabel(pw.week)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  pw.published
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {pw.published ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(pw.createdAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                                  {!pw.published && (
                                    <button
                                      onClick={() => onPublish(pw.season, pw.week, 'snapshot')}
                                      disabled={isActionPending}
                                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                    >
                                      Publish
                                    </button>
                                  )}
                                  {actionFeedback?.key === publishKey && actionFeedback.type === 'success' && (
                                    <SuccessCheckmark onDone={onClearFeedback} />
                                  )}
                                  {actionFeedback?.key === publishKey && actionFeedback.type === 'error' && (
                                    <span className="text-red-600 text-sm">{actionFeedback.message}</span>
                                  )}
                                  <button
                                    onClick={() => onExport(pw.season, pw.week)}
                                    disabled={isActionPending}
                                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                  >
                                    Export
                                  </button>
                                  <button
                                    onClick={() => onDelete(pw.season, pw.week, pw.published)}
                                    disabled={isActionPending}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
