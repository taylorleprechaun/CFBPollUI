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
  summaries: PredictionsSummary[];
}

const EXTRA_COLUMN_HEADERS = (
  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Games</th>
);

function renderGameCountCell(item: PredictionsSummary) {
  return (
    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{item.gameCount}</td>
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
      renderExtraCells={renderGameCountCell}
      title="Persisted Predictions"
    />
  );
}
