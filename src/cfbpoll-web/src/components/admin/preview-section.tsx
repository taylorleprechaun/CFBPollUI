import { useState } from 'react';
import { getWeekLabel } from '../../lib/week-utils';
import { RankingsTable } from '../rankings/rankings-table';
import { ChevronIcon } from '../ui/chevron-icon';
import { SuccessCheckmark } from './success-checkmark';
import type { CalculateResponse } from '../../schemas/admin';
import type { ActionFeedback } from './types';

interface PreviewSectionProps {
  calculatedResult: CalculateResponse;
  actionFeedback: ActionFeedback | null;
  isActionPending: boolean;
  onClearFeedback: () => void;
  onExport: (season: number, week: number) => void;
  onPublish: (season: number, week: number, source: 'preview' | 'snapshot') => void;
}

export function PreviewSection({
  calculatedResult,
  actionFeedback,
  isActionPending,
  onClearFeedback,
  onExport,
  onPublish,
}: PreviewSectionProps) {
  const [previewExpanded, setPreviewExpanded] = useState(true);

  const previewRankings = calculatedResult.rankings;
  const previewPublishKey = `preview-publish-${previewRankings.season}-${previewRankings.week}`;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPreviewExpanded(!previewExpanded)}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700"
          >
            <ChevronIcon open={previewExpanded} size="w-4 h-4" />
            Preview: {previewRankings.season} {getWeekLabel(previewRankings.week)}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport(previewRankings.season, previewRankings.week)}
              disabled={isActionPending}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              Download Excel
            </button>
            <button
              onClick={() => onPublish(previewRankings.season, previewRankings.week, 'preview')}
              disabled={isActionPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              Publish
            </button>
            {actionFeedback?.key === previewPublishKey && actionFeedback.type === 'success' && (
              <SuccessCheckmark onDone={onClearFeedback} />
            )}
            {actionFeedback?.key === previewPublishKey && actionFeedback.type === 'error' && (
              <span className="text-red-600 text-sm">{actionFeedback.message}</span>
            )}
          </div>
        </div>
        {!calculatedResult.persisted && (
          <p className="text-amber-600 text-sm mt-2">
            Warning: Rankings were not persisted to the database.
          </p>
        )}
      </div>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: previewExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <RankingsTable
            rankings={previewRankings.rankings}
            isLoading={false}
            selectedConference={null}
            selectedSeason={previewRankings.season}
            selectedWeek={previewRankings.week}
          />
        </div>
      </div>
    </div>
  );
}
