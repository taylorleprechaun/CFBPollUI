import { useState } from 'react';

import type { RankingsSnapshot } from '../../schemas/admin';
import type { ActionFeedback } from './types';

import { badgeColorClasses } from '../../lib/badge-colors';
import { StatusBadge } from '../ui/status-badge';
import { PersistedItemsSection } from './persisted-items-section';
import { StaleScoreOverridesModal } from './stale-score-overrides-modal';

interface PersistedRankingsSnapshotsSectionProps {
  actionFeedback: ActionFeedback | null;
  activeItem?: { season: number; week: number } | null;
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
  onView?: (season: number, week: number) => void;
  rankingsSnapshots: RankingsSnapshot[];
}

const COLUMN_COUNT = 4;

export function PersistedRankingsSnapshotsSection({
  actionFeedback,
  activeItem = null,
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
  onView,
  rankingsSnapshots,
}: PersistedRankingsSnapshotsSectionProps) {
  const [staleModalSnapshot, setStaleModalSnapshot] = useState<RankingsSnapshot | null>(null);

  function renderStatusCell(item: RankingsSnapshot) {
    const hasStaleScoreOverrides = (item.staleScoreOverrides?.length ?? 0) > 0;

    return (
      <div className="flex items-center gap-2">
        <StatusBadge
          className={badgeColorClasses(item.isPublished ? 'green' : 'yellow')}
          label={item.isPublished ? 'Published' : 'Draft'}
        />
        {hasStaleScoreOverrides && (
          <button
            type="button"
            onClick={() => setStaleModalSnapshot(item)}
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${badgeColorClasses(item.isPublished ? 'gray' : 'red')}`}
          >
            {item.isPublished ? 'Overrides changed' : 'Stale'}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <PersistedItemsSection
        actionFeedback={actionFeedback}
        activeItem={activeItem}
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
        onView={onView}
        renderStatusCell={renderStatusCell}
        title="Persisted Rankings"
      />
      {staleModalSnapshot && (
        <StaleScoreOverridesModal
          differences={staleModalSnapshot.staleScoreOverrides ?? []}
          isPublished={staleModalSnapshot.isPublished}
          onClose={() => setStaleModalSnapshot(null)}
          season={staleModalSnapshot.season}
          week={staleModalSnapshot.week}
        />
      )}
    </>
  );
}
