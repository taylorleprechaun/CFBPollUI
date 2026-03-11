import { PersistedItemsSection } from './persisted-items-section';
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
  onPublish: (season: number, week: number) => void;
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
  return (
    <PersistedItemsSection
      actionFeedback={actionFeedback}
      collapsedSeasons={collapsedSeasons}
      contentIdPrefix="snapshots-season"
      emptyMessage="No persisted snapshots found."
      feedbackKeyPrefix="snapshot-publish"
      isActionPending={isActionPending}
      itemLabel="snapshot"
      items={snapshots}
      onClearFeedback={onClearFeedback}
      onCollapseAll={onCollapseAll}
      onDelete={onDelete}
      onExpandAll={onExpandAll}
      onExport={onExport}
      onPublish={onPublish}
      onToggleSeason={onToggleSeason}
      title="Persisted Snapshots"
    />
  );
}
