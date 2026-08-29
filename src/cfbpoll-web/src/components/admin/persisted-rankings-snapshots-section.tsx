import type { RankingsSnapshot } from '../../schemas/admin';
import type { ActionFeedback } from './types';

import { PersistedItemsSection } from './persisted-items-section';

interface PersistedRankingsSnapshotsSectionProps {
  actionFeedback: ActionFeedback | null;
  collapsedSeasons: Set<number>;
  isActionPending: boolean;
  isLoading?: boolean;
  onClearFeedback: () => void;
  onCollapseAll: () => void;
  onDelete: (season: number, week: number, isPublished: boolean) => void;
  onExpandAll: () => void;
  onExport: (season: number, week: number) => void;
  onPublish: (season: number, week: number) => void;
  onToggleSeason: (season: number) => void;
  rankingsSnapshots: RankingsSnapshot[];
}

const COLUMN_COUNT = 4;

export function PersistedRankingsSnapshotsSection({
  actionFeedback,
  collapsedSeasons,
  isActionPending,
  isLoading = false,
  onClearFeedback,
  onCollapseAll,
  onDelete,
  onExpandAll,
  onExport,
  onPublish,
  onToggleSeason,
  rankingsSnapshots,
}: PersistedRankingsSnapshotsSectionProps) {
  return (
    <PersistedItemsSection
      actionFeedback={actionFeedback}
      collapsedSeasons={collapsedSeasons}
      columnCount={COLUMN_COUNT}
      contentIdPrefix="rankings-snapshots-season"
      emptyMessage="No persisted rankings found."
      feedbackKeyPrefix="rankings-snapshot-publish"
      isActionPending={isActionPending}
      isLoading={isLoading}
      itemLabel="ranking"
      items={rankingsSnapshots}
      onClearFeedback={onClearFeedback}
      onCollapseAll={onCollapseAll}
      onDelete={onDelete}
      onExpandAll={onExpandAll}
      onExport={onExport}
      onPublish={onPublish}
      onToggleSeason={onToggleSeason}
      title="Persisted Rankings"
    />
  );
}
