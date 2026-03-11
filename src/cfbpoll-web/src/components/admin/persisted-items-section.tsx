import { type ReactNode, useMemo } from 'react';

import { groupBySeasonDescending } from '../../lib/group-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { BUTTON_DANGER_GHOST, BUTTON_GHOST } from '../ui/button-styles';
import { ChevronIcon } from '../ui/chevron-icon';
import { EmptyState } from '../ui/empty-state';
import { SuccessCheckmark } from './success-checkmark';
import type { ActionFeedback } from './types';

interface PersistedItemsSectionProps<T extends { createdAt: string; isPublished: boolean; season: number; week: number }> {
  actionFeedback: ActionFeedback | null;
  collapsedSeasons: Set<number>;
  contentIdPrefix: string;
  emptyMessage: string;
  extraColumnHeaders?: ReactNode;
  feedbackKeyPrefix: string;
  isActionPending: boolean;
  itemLabel: string;
  items: T[];
  onClearFeedback: () => void;
  onCollapseAll: () => void;
  onDelete: (season: number, week: number, isPublished: boolean) => void;
  onExpandAll: () => void;
  onExport?: (season: number, week: number) => void;
  onPublish: (season: number, week: number) => void;
  onToggleSeason: (season: number) => void;
  renderExtraCells?: (item: T) => ReactNode;
  title: string;
}

export function PersistedItemsSection<T extends { createdAt: string; isPublished: boolean; season: number; week: number }>({
  actionFeedback,
  collapsedSeasons,
  contentIdPrefix,
  emptyMessage,
  extraColumnHeaders,
  feedbackKeyPrefix,
  isActionPending,
  itemLabel,
  items,
  onClearFeedback,
  onCollapseAll,
  onDelete,
  onExpandAll,
  onExport,
  onPublish,
  onToggleSeason,
  renderExtraCells,
  title,
}: PersistedItemsSectionProps<T>) {
  const groupedItems = useMemo(() => groupBySeasonDescending(items), [items]);

  return (
    <div className="bg-surface shadow-md rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {groupedItems.length > 0 && (
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
      {groupedItems.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="space-y-2">
          {groupedItems.map((group) => {
            const isCollapsed = collapsedSeasons.has(group.season);
            const contentId = `${contentIdPrefix}-${group.season}`;
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
                    ({group.weeks.length} {itemLabel}{group.weeks.length !== 1 ? 's' : ''})
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
                          {extraColumnHeaders}
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Created</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-border">
                        {group.weeks.map((item) => {
                          const publishKey = `${feedbackKeyPrefix}-${item.season}-${item.week}`;
                          return (
                            <tr key={`${item.season}-${item.week}`} className="even:bg-surface-alt/50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">{getWeekLabel(item.week)}</td>
                              {renderExtraCells?.(item)}
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.isPublished
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                                }`}>
                                  {item.isPublished ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                                {new Date(item.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                                  {!item.isPublished && (
                                    <button
                                      onClick={() => onPublish(item.season, item.week)}
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
                                  {onExport && (
                                    <button
                                      onClick={() => onExport(item.season, item.week)}
                                      disabled={isActionPending}
                                      className={BUTTON_GHOST}
                                    >
                                      Export
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onDelete(item.season, item.week, item.isPublished)}
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
