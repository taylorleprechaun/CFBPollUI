import { StatusBadge } from '../ui/status-badge';
import { PersistedItemsSection } from './persisted-items-section';
import type { ActionFeedback } from './types';
import type { PredictionsSummary } from '../../schemas/admin';

interface PersistedPredictionsSectionProps {
  actionFeedback: ActionFeedback | null;
  collapsedSeasons: Set<number>;
  isActionPending: boolean;
  onClearFeedback: () => void;
  onCollapseAll: () => void;
  onDelete: (season: number, week: number, isPublished: boolean) => void;
  onExpandAll: () => void;
  onPublish: (season: number, week: number) => void;
  onToggleSeason: (season: number) => void;
  onView?: (season: number, week: number) => void;
  summaries: PredictionsSummary[];
}

const EXTRA_COLUMN_HEADERS = (
  <>
    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Games</th>
    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Graded</th>
    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Results</th>
  </>
);

function statusBadgeClasses(isActive: boolean): string {
  return isActive
    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
}

function renderExtraCells(item: PredictionsSummary) {
  return (
    <>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{item.gameCount}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <StatusBadge className={statusBadgeClasses(item.isGraded)} label={item.isGraded ? 'Graded' : 'Ungraded'} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <StatusBadge className={statusBadgeClasses(item.resultsPublished)} label={item.resultsPublished ? 'Published' : 'Draft'} />
      </td>
    </>
  );
}

export function PersistedPredictionsSection({
  actionFeedback,
  collapsedSeasons,
  isActionPending,
  onClearFeedback,
  onCollapseAll,
  onDelete,
  onExpandAll,
  onPublish,
  onToggleSeason,
  onView,
  summaries,
}: PersistedPredictionsSectionProps) {
  return (
    <PersistedItemsSection
      actionFeedback={actionFeedback}
      collapsedSeasons={collapsedSeasons}
      contentIdPrefix="predictions-season"
      emptyMessage="No persisted predictions found."
      extraColumnHeaders={EXTRA_COLUMN_HEADERS}
      feedbackKeyPrefix="persisted-prediction-publish"
      isActionPending={isActionPending}
      itemLabel="prediction"
      items={summaries}
      onClearFeedback={onClearFeedback}
      onCollapseAll={onCollapseAll}
      onDelete={onDelete}
      onExpandAll={onExpandAll}
      onPublish={onPublish}
      onToggleSeason={onToggleSeason}
      onView={onView}
      renderExtraCells={renderExtraCells}
      title="Persisted Predictions"
    />
  );
}
