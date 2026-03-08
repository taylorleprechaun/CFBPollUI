import { useMemo } from 'react';

import { getWeekLabel } from '../../lib/week-utils';
import { BUTTON_DANGER_GHOST, BUTTON_GHOST } from '../ui/button-styles';
import { ChevronIcon } from '../ui/chevron-icon';
import { EmptyState } from '../ui/empty-state';
import { SuccessCheckmark } from './success-checkmark';
import type { ActionFeedback } from './types';
import type { Snapshot } from '../../schemas/admin';

interface PersistedSnapshotsSectionProps {
  actionFeedback: ActionFeedback | null;
  collapsedSeasons: Set<number>;
  isActionPending: boolean;
  onClearFeedback: () => void;
  onCollapseAll: () => void;
  onDelete: (season: number, week: number, isPublished: boolean) => void;
  onExpandAll: () => void;
  onExport: (season: number, week: number) => void;
  onPublish: (season: number, week: number, source: 'preview' | 'snapshot') => void;
  onToggleSeason: (season: number) => void;
  snapshots: Snapshot[];
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
  snapshots,
}: PersistedSnapshotsSectionProps) {
  const groupedSnapshots = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => {
      if (a.season !== b.season) return b.season - a.season;
      return b.week - a.week;
    });

    const groups: { season: number; weeks: Snapshot[] }[] = [];
    for (const pw of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.season === pw.season) {
        last.weeks.push(pw);
      } else {
        groups.push({ season: pw.season, weeks: [pw] });
      }
    }
    return groups;
  }, [snapshots]);

  return (
    <div className="bg-surface shadow-md rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Persisted Snapshots</h2>
        {groupedSnapshots.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={onExpandAll}
              className="text-sm text-accent hover:text-accent-hover"
            >
              Expand All
            </button>
            <span className="text-border">|</span>
            <button
              onClick={onCollapseAll}
              className="text-sm text-accent hover:text-accent-hover"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>
      {groupedSnapshots.length === 0 ? (
        <EmptyState message="No persisted snapshots found." />
      ) : (
        <div className="space-y-2">
          {groupedSnapshots.map((group) => {
            const isCollapsed = collapsedSeasons.has(group.season);
            const contentId = `snapshots-season-${group.season}`;
            return (
              <div key={group.season} className="border border-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => onToggleSeason(group.season)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-surface-alt hover:bg-surface-elevated text-left font-medium text-text-primary"
                  aria-expanded={!isCollapsed}
                  aria-controls={contentId}
                >
                  <ChevronIcon open={!isCollapsed} size="w-4 h-4" />
                  <span>{group.season} Season</span>
                  <span className="text-sm font-normal text-text-muted">
                    ({group.weeks.length} snapshot{group.weeks.length !== 1 ? 's' : ''})
                  </span>
                </button>
                <div
                  id={contentId}
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isCollapsed ? '0fr' : '1fr' }}
                >
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-surface-alt border-b-2 border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Week</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Created</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-border">
                        {group.weeks.map((pw) => {
                          const publishKey = `snapshot-publish-${pw.season}-${pw.week}`;
                          return (
                            <tr key={`${pw.season}-${pw.week}`} className="even:bg-surface-alt/50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">{getWeekLabel(pw.week)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  pw.isPublished
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                                }`}>
                                  {pw.isPublished ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                                {new Date(pw.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                                  {!pw.isPublished && (
                                    <button
                                      onClick={() => onPublish(pw.season, pw.week, 'snapshot')}
                                      disabled={isActionPending}
                                      className={BUTTON_GHOST}
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
                                    className={BUTTON_GHOST}
                                  >
                                    Export
                                  </button>
                                  <button
                                    onClick={() => onDelete(pw.season, pw.week, pw.isPublished)}
                                    disabled={isActionPending}
                                    className={BUTTON_DANGER_GHOST}
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
