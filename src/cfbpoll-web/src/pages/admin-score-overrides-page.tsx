import { useId, useMemo, useState } from 'react';

import type { ScoreOverrideTarget } from '../components/admin';
import type { CompletedGame, GameOverride } from '../schemas/admin';

import { CompletedGamesSection, GameOverridesSection, ScoreOverrideWizardModal, WeekSelect } from '../components/admin';
import { SELECT_BASE } from '../components/ui/button-styles';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useAuth } from '../hooks/use-auth';
import { useCompletedGames } from '../hooks/use-completed-games';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useGameOverrides } from '../hooks/use-game-overrides';
import { useSeason } from '../hooks/use-season';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';
import { SITE_OWNER_NAME } from '../lib/config';
import { getRawWeekLabel } from '../lib/week-utils';

export function AdminScoreOverridesPage() {
  useDocumentTitle(`${SITE_OWNER_NAME} - Score Overrides`);

  const { token } = useAuth();
  const seasonId = useId();

  const { nextSeason, seasons, seasonsLoading, selectedSeason, setSelectedSeason } = useSeason();
  const seasonOptions = useMemo(
    () => (nextSeason !== null ? [nextSeason, ...seasons] : seasons),
    [nextSeason, seasons]
  );

  const { data: weeksData, isLoading: weeksLoading } = useWeeks(selectedSeason);
  const { selectedWeek, setSelectedWeek } = useWeekSelection(weeksData?.weeks);

  // The admin is picking games by the week they were actually played, not the rankings
  // week they feed into, so this page shows the raw week number rather than the shared
  // WeekSelect's rankings-shifted label. SeasonModule.GetWeekLabels only ever emits the
  // literal string "Postseason" for a postseason week, so that's a safe signal to key off.
  const rawWeeks = useMemo(
    () => (weeksData?.weeks ?? []).map((w) => ({
      ...w,
      label: getRawWeekLabel(w.weekNumber, w.label === 'Postseason'),
    })),
    [weeksData?.weeks]
  );

  const { data: completedGamesData, isLoading: completedGamesLoading } = useCompletedGames(
    token,
    selectedSeason,
    selectedWeek,
    true
  );

  const {
    data: overrides,
    deleteOverride,
    isDeleting,
    isLoading: overridesLoading,
    isSaving,
    saveOverride,
  } = useGameOverrides(token, selectedSeason);

  const [wizardTarget, setWizardTarget] = useState<ScoreOverrideTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GameOverride | null>(null);

  function handleSelectGame(game: CompletedGame) {
    if (game.gameID === null || game.homeTeam === null || game.awayTeam === null
      || game.homePoints === null || game.awayPoints === null) {
      return;
    }

    setWizardTarget({
      awayPoints: game.awayPoints,
      awayTeam: game.awayTeam,
      gameID: game.gameID,
      homePoints: game.homePoints,
      homeTeam: game.homeTeam,
      reason: '',
    });
  }

  function handleEditOverride(gameOverride: GameOverride) {
    setWizardTarget({
      awayPoints: gameOverride.overrideAwayPoints,
      awayTeam: gameOverride.awayTeam,
      gameID: gameOverride.gameID,
      homePoints: gameOverride.overrideHomePoints,
      homeTeam: gameOverride.homeTeam,
      reason: gameOverride.reason,
    });
  }

  async function handleConfirmWizard(overrideHomePoints: number, overrideAwayPoints: number, reason: string) {
    if (!wizardTarget) return;

    await saveOverride({
      gameId: wizardTarget.gameID,
      overrideAwayPoints,
      overrideHomePoints,
      reason,
    });

    setWizardTarget(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    await deleteOverride(deleteTarget.gameID);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Score Overrides</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manually correct the recorded final score of a completed game. Overriding a score does not
          retroactively recalculate or republish any rankings or predictions already published - it only
          affects new calculations and anything explicitly recalculated afterward.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor={seasonId} className="block text-sm font-medium text-text-secondary mb-1">
              Season
            </label>
            <select
              id={seasonId}
              value={selectedSeason ?? ''}
              onChange={(e) => {
                setSelectedSeason(Number(e.target.value));
                setSelectedWeek(null);
              }}
              disabled={seasonsLoading}
              className={`px-3 py-2 ${SELECT_BASE}`}
            >
              {seasonOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <WeekSelect
            onWeekChange={setSelectedWeek}
            selectedWeek={selectedWeek}
            weeks={rawWeeks}
            weeksLoading={weeksLoading}
          />
        </div>
      </div>

      {selectedSeason !== null && selectedWeek !== null && (
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Completed Games - {selectedSeason} {rawWeeks.find((w) => w.weekNumber === selectedWeek)?.label ?? `Week ${selectedWeek}`}
          </h2>
          <CompletedGamesSection
            games={completedGamesData?.games ?? []}
            isLoading={completedGamesLoading}
            onSelectGame={handleSelectGame}
          />
        </div>
      )}

      {selectedSeason !== null && (
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Existing Overrides - {selectedSeason}
          </h2>
          <GameOverridesSection
            isDeleting={isDeleting}
            isLoading={overridesLoading}
            onDelete={setDeleteTarget}
            onEdit={handleEditOverride}
            overrides={overrides ?? []}
          />
        </div>
      )}

      {wizardTarget && (
        <ScoreOverrideWizardModal
          isSaving={isSaving}
          onCancel={() => setWizardTarget(null)}
          onConfirm={handleConfirmWizard}
          target={wizardTarget}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Score Override"
          message={`Remove the score override for ${deleteTarget.awayTeam} @ ${deleteTarget.homeTeam}? The game will revert to its officially recorded score of ${deleteTarget.originalAwayPoints}-${deleteTarget.originalHomePoints} for new calculations.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default AdminScoreOverridesPage;
