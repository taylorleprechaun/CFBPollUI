import { useState } from 'react';

import { getWeekLabel } from '../../lib/week-utils';
import { TeamLogo } from '../rankings/team-logo';
import { BUTTON_PRIMARY } from '../ui/button-styles';
import { ChevronIcon } from '../ui/chevron-icon';
import { SuccessCheckmark } from './success-checkmark';
import type { ActionFeedback } from './types';
import type { CalculatePredictionsResponse, GamePrediction } from '../../schemas/admin';

interface PredictionsPreviewSectionProps {
  calculatedResult: CalculatePredictionsResponse;
  actionFeedback: ActionFeedback | null;
  isActionPending: boolean;
  onClearFeedback: () => void;
  onPublish: (season: number, week: number) => void;
}

function formatSpread(prediction: GamePrediction): string {
  if (prediction.bettingSpread === null || prediction.bettingSpread === undefined) return 'N/A';
  const spread = prediction.bettingSpread;
  const sign = spread > 0 ? '+' : '';
  return `${prediction.homeTeam} ${sign}${spread}`;
}

function formatOverUnder(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toString();
}

function formatPick(pick: string): string {
  return pick || 'N/A';
}

export function PredictionsPreviewSection({
  calculatedResult,
  actionFeedback,
  isActionPending,
  onClearFeedback,
  onPublish,
}: PredictionsPreviewSectionProps) {
  const [previewExpanded, setPreviewExpanded] = useState(true);

  const { predictions } = calculatedResult;
  const previewPublishKey = `preview-prediction-publish-${predictions.season}-${predictions.week}`;

  return (
    <div className="bg-surface shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPreviewExpanded(!previewExpanded)}
            className="flex items-center gap-2 text-lg font-semibold text-text-primary hover:text-text-secondary"
          >
            <ChevronIcon open={previewExpanded} size="w-4 h-4" />
            Preview: {predictions.season} {getWeekLabel(predictions.week)}
            <span className="text-sm font-normal text-text-muted">
              ({predictions.predictions.length} game{predictions.predictions.length !== 1 ? 's' : ''})
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPublish(predictions.season, predictions.week)}
              disabled={isActionPending}
              className={BUTTON_PRIMARY}
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
        {!calculatedResult.isPersisted && (
          <p className="text-amber-600 text-sm mt-2">
            Warning: Predictions were not persisted to the database.
          </p>
        )}
      </div>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: previewExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Winner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Spread</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">My Spread Pick</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">O/U</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">My O/U Pick</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {predictions.predictions.map((p) => (
                <tr key={`${p.awayTeam}-${p.homeTeam}`} className="even:bg-surface-alt/50">
                  <td className="px-4 py-3 text-sm text-text-primary">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <TeamLogo logoURL={p.awayLogoURL} teamName={p.awayTeam} />
                        <span>{p.awayTeam}</span>
                        <span className="font-semibold ml-auto">{p.awayTeamScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TeamLogo logoURL={p.homeLogoURL} teamName={p.homeTeam} />
                        <span>{p.homeTeam}</span>
                        {p.neutralSite && <span className="text-text-muted text-xs">(N)</span>}
                        <span className="font-semibold ml-auto">{p.homeTeamScore}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-text-primary align-middle">
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        logoURL={p.predictedWinner === p.homeTeam ? p.homeLogoURL : p.awayLogoURL}
                        teamName={p.predictedWinner}
                      />
                      <span>{p.predictedWinner}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                    {formatSpread(p)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                    {formatPick(p.mySpreadPick)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right align-middle">
                    {formatOverUnder(p.bettingOverUnder)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                    {formatPick(p.myOverUnderPick)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
