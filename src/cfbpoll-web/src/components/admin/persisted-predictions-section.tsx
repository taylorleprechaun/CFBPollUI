import type { PredictionsSummary } from '../../schemas/admin';
import type { ActionFeedback } from './types';

import { derivePredictionStage, predictionStageClasses, predictionStageLabel } from '../../lib/prediction-stage';
import { StatusBadge } from '../ui/status-badge';
import { PersistedItemsSection } from './persisted-items-section';

interface PersistedPredictionsSectionProps {
  actionFeedback: ActionFeedback | null;
  activeItem?: { season: number; week: number } | null;
  collapsedSeasons: Set<number>;
  isActionPending: boolean;
  isLoading?: boolean;
  onClearFeedback: () => void;
  onCollapseAll: () => void;
  onDelete: (season: number, week: number, isPublished: boolean) => void;
  onExpandAll: () => void;
  onPublish: (season: number, week: number) => void;
  onToggleSeason: (season: number) => void;
  onView?: (season: number, week: number) => void;
  summaries: PredictionsSummary[];
}

const COLUMN_COUNT = 5;

const EXTRA_COLUMN_HEADERS = (
  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Games</th>
);

export function PersistedPredictionsSection({
  actionFeedback,
  activeItem = null,
  collapsedSeasons,
  isActionPending,
  isLoading = false,
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
      activeItem={activeItem}
      collapsedSeasons={collapsedSeasons}
      columnCount={COLUMN_COUNT}
      contentIdPrefix="predictions-season"
      emptyMessage="No persisted predictions found."
      extraColumnHeaders={EXTRA_COLUMN_HEADERS}
      feedbackKeyPrefix="persisted-prediction-publish"
      isActionPending={isActionPending}
      isLoading={isLoading}
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
      renderStatusCell={renderStatusCell}
      title="Persisted Predictions"
    />
  );
}

function renderExtraCells(item: PredictionsSummary) {
  return (
    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{item.gameCount}</td>
  );
}

function renderStatusCell(item: PredictionsSummary) {
  const stage = derivePredictionStage(item);
  return <StatusBadge className={predictionStageClasses(stage)} label={predictionStageLabel(stage)} />;
}
