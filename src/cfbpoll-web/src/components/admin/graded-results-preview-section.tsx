import { useState } from 'react';

import { gradeClasses } from '../../lib/grade-classes';
import { formatOverUnder, formatPick, formatSpread } from '../../lib/prediction-format-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { TeamLogo } from '../rankings/team-logo';
import { BUTTON_PRIMARY } from '../ui/button-styles';
import { ChevronIcon } from '../ui/chevron-icon';
import { StatusBadge } from '../ui/status-badge';
import { FeedbackIndicator } from './feedback-indicator';
import type { ActionFeedback } from './types';
import type { GradePredictionsResponse } from '../../schemas/admin';

interface GradedResultsPreviewSectionProps {
  actionFeedback: ActionFeedback | null;
  gradedResult: GradePredictionsResponse;
  isActionPending: boolean;
  onClearFeedback: () => void;
  onPublishResults: (season: number, week: number) => void;
}

function GradeBadge({ grade }: { grade: string }) {
  return <StatusBadge className={gradeClasses(grade)} label={grade} />;
}

export function GradedResultsPreviewSection({
  actionFeedback,
  gradedResult,
  isActionPending,
  onClearFeedback,
  onPublishResults,
}: GradedResultsPreviewSectionProps) {
  const [previewExpanded, setPreviewExpanded] = useState(true);

  const { predictions } = gradedResult;
  const publishResultsKey = `publish-results-${predictions.season}-${predictions.week}`;

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
            Graded Results: {predictions.season} {getWeekLabel(predictions.week)}
            <span className="text-sm font-normal text-text-muted">
              ({predictions.predictions.length} game{predictions.predictions.length !== 1 ? 's' : ''})
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPublishResults(predictions.season, predictions.week)}
              disabled={isActionPending}
              className={BUTTON_PRIMARY}
            >
              Publish Results
            </button>
            <FeedbackIndicator feedback={actionFeedback} feedbackKey={publishResultsKey} onClear={onClearFeedback} />
          </div>
        </div>
        {!gradedResult.isPersisted && (
          <p className="text-amber-600 text-sm mt-2">
            Warning: Graded results were not persisted to the database.
          </p>
        )}
        {gradedResult.unmatchedGameCount > 0 && (
          <p className="text-amber-600 text-sm mt-2">
            Unmatched games: {gradedResult.unmatchedGameCount}
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
                      {p.actualHomeScore !== null && p.actualAwayScore !== null && (
                        <span className="text-xs text-text-muted">
                          Final: {p.actualAwayScore}-{p.actualHomeScore}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-text-primary align-middle">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <TeamLogo
                          logoURL={p.predictedWinner === p.homeTeam ? p.homeLogoURL : p.awayLogoURL}
                          teamName={p.predictedWinner}
                        />
                        <span>{p.predictedWinner}</span>
                        <GradeBadge grade={p.winnerGrade} />
                      </div>
                      {p.actualWinner !== null && p.actualWinner !== p.predictedWinner && (
                        <span className="text-xs text-text-muted">Actual: {p.actualWinner}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                    {formatSpread(p)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>{formatPick(p.mySpreadPick)}</span>
                        <GradeBadge grade={p.spreadGrade} />
                      </div>
                      {p.spreadGrade === 'Incorrect' && p.actualSpreadCoveringTeam !== null && (
                        <span className="text-xs text-text-muted">Actual: {p.actualSpreadCoveringTeam}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right align-middle">
                    {formatOverUnder(p.bettingOverUnder)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>{formatPick(p.myOverUnderPick)}</span>
                        <GradeBadge grade={p.overUnderGrade} />
                      </div>
                      {p.overUnderGrade === 'Incorrect' && p.actualOverUnderResult !== null && (
                        <span className="text-xs text-text-muted">Actual: {p.actualOverUnderResult}</span>
                      )}
                    </div>
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
