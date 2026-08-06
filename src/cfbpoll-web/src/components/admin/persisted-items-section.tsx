import { type ReactNode, useMemo } from 'react';

import type { ActionFeedback } from './types';

import { badgeColorClasses } from '../../lib/badge-colors';
import { groupBySeasonDescending } from '../../lib/group-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { BUTTON_DANGER_GHOST, BUTTON_GHOST } from '../ui/button-styles';
import { CollapsibleContent } from '../ui/collapsible-content';
import { CollapsibleTrigger } from '../ui/collapsible-trigger';
import { EmptyState } from '../ui/empty-state';
import { StatusBadge } from '../ui/status-badge';
import { TableSkeleton } from '../ui/table-skeleton';
import { FeedbackIndicator } from './feedback-indicator';

interface PersistedItemsSectionProps<T extends { createdAt: string; isPublished: boolean; season: number; week: number }> {
  actionFeedback: ActionFeedback | null;
  activeItem?: { season: number; week: number } | null;
  collapsedSeasons: Set<number>;
  columnCount: number;
  contentIdPrefix: string;
  emptyMessage: string;
  extraColumnHeaders?: ReactNode;
  feedbackKeyPrefix: string;
  isActionPending: boolean;
  isLoading?: boolean;
  itemLabel: string;
  items: T[];
  onClearFeedback: () => void;
  onCollapseAll: () => void;
  onDelete: (season: number, week: number, isPublished: boolean) => void;
  onExpandAll: () => void;
  onExport?: (season: number, week: number) => void;
  onPublish: (season: number, week: number) => void;
  onToggleSeason: (season: number) => void;
  onView?: (season: number, week: number) => void;
  renderExtraCells?: (item: T) => ReactNode;
  renderStatusCell?: (item: T) => ReactNode;
  title: string;
}

function defaultStatusCell<T extends { isPublished: boolean }>(item: T) {
  return (
    <StatusBadge
      className={badgeColorClasses(item.isPublished ? 'green' : 'yellow')}
      label={item.isPublished ? 'Published' : 'Draft'}
    />
  );
}

export function PersistedItemsSection<T extends { createdAt: string; isPublished: boolean; season: number; week: number }>({
  actionFeedback,
  activeItem = null,
  collapsedSeasons,
  columnCount,
  contentIdPrefix,
  emptyMessage,
  extraColumnHeaders,
  feedbackKeyPrefix,
  isActionPending,
  isLoading = false,
  itemLabel,
  items,
  onClearFeedback,
  onCollapseAll,
  onDelete,
  onExpandAll,
  onExport,
  onPublish,
  onToggleSeason,
  onView,
  renderExtraCells,
  renderStatusCell = defaultStatusCell,
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
      {isLoading ? (
        <TableSkeleton columns={columnCount} />
      ) : groupedItems.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="space-y-2">
          {groupedItems.map((group) => {
            const isCollapsed = collapsedSeasons.has(group.season);
            const contentId = `${contentIdPrefix}-${group.season}`;
            return (
              <div key={group.season} className="border border-border rounded-xl overflow-hidden">
                <CollapsibleTrigger
                  contentId={contentId}
                  isOpen={!isCollapsed}
                  onToggle={() => onToggleSeason(group.season)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-surface-alt hover:bg-surface-elevated text-left font-medium text-text-primary"
                >
                  <span>{group.season} Season</span>
                  <span className="text-sm font-normal text-text-muted">
                    ({group.weeks.length} {itemLabel}{group.weeks.length !== 1 ? 's' : ''})
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent id={contentId} isOpen={!isCollapsed}>
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
                        const isActiveItem = activeItem !== null && activeItem.season === item.season && activeItem.week === item.week;
                        return (
                          <tr
                            key={`${item.season}-${item.week}`}
                            className={isActiveItem ? 'bg-accent-light/50 border-l-4 border-accent' : 'even:bg-surface-alt/50'}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">
                              {getWeekLabel(item.week)}
                              {isActiveItem && (
                                <span className="ml-2 text-xs font-medium text-accent">(Viewing)</span>
                              )}
                            </td>
                            {renderExtraCells?.(item)}
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {renderStatusCell(item)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                              {new Date(item.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                {onView && (
                                  <button
                                    onClick={() => onView(item.season, item.week)}
                                    disabled={isActionPending}
                                    className={BUTTON_GHOST}
                                  >
                                    View
                                  </button>
                                )}
                                {!item.isPublished && (
                                  <button
                                    onClick={() => onPublish(item.season, item.week)}
                                    disabled={isActionPending}
                                    className={BUTTON_GHOST}
                                  >
                                    Publish
                                  </button>
                                )}
                                <FeedbackIndicator feedback={actionFeedback} feedbackKey={publishKey} onClear={onClearFeedback} />
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
                </CollapsibleContent>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
