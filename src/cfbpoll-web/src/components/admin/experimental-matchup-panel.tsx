import { useId, useState } from 'react';

import type { Week } from '../../types';
import type { AlgorithmVersion } from './algorithm-versions';

import { useExperimentalMatchupState } from '../../hooks/use-experimental-matchup-state';
import { useSeasonFbsTeams } from '../../hooks/use-season-fbs-teams';
import { ErrorAlert, ErrorBoundary } from '../error';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, SELECT_BASE } from '../ui/button-styles';
import { SearchableSelect } from '../ui/searchable-select';
import { AlgorithmVersionPicker } from './algorithm-version-picker';
import { DEFAULT_ALGORITHM_VERSIONS } from './algorithm-versions';
import { ExperimentalMatchupResults } from './experimental-matchup-results';
import { WeekSelect } from './week-select';

interface ExperimentalMatchupPanelProps {
  onSeasonChange: (season: number) => void;
  onWeekChange: (week: number | null) => void;
  seasons: number[];
  seasonsLoading: boolean;
  selectedSeason: number | null;
  selectedWeek: number | null;
  token: string | null;
  weeks: Week[];
  weeksLoading: boolean;
}

export function ExperimentalMatchupPanel({
  onSeasonChange,
  onWeekChange,
  seasons,
  seasonsLoading,
  selectedSeason,
  selectedWeek,
  token,
  weeks,
  weeksLoading,
}: ExperimentalMatchupPanelProps) {
  const [awayTeam, setAwayTeam] = useState<string | null>(null);
  const [homeTeam, setHomeTeam] = useState<string | null>(null);
  const [isNeutralSite, setIsNeutralSite] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<AlgorithmVersion[]>(DEFAULT_ALGORITHM_VERSIONS);

  const neutralSiteId = useId();
  const seasonId = useId();

  const { data: teams = [], error: teamsError, isLoading: teamsLoading } = useSeasonFbsTeams(token, selectedSeason);
  const { handleRun, isRunning, runState, submittedMatchup } = useExperimentalMatchupState({
    selectedSeason,
    selectedWeek,
    token,
  });

  const isTeamPickerEnabled = selectedSeason !== null && selectedWeek !== null && !teamsLoading && teams.length > 0;
  const canRun =
    !isRunning &&
    isTeamPickerEnabled &&
    homeTeam !== null &&
    awayTeam !== null &&
    homeTeam !== awayTeam &&
    selectedVersions.length > 0;

  function clearTeams() {
    setAwayTeam(null);
    setHomeTeam(null);
  }

  function handleRunClick() {
    if (homeTeam === null || awayTeam === null) return;
    void handleRun(selectedVersions, { awayTeam, homeTeam, neutralSite: isNeutralSite });
  }

  function handleSeasonChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onSeasonChange(Number(event.target.value));
    onWeekChange(null);
    clearTeams();
  }

  function handleSwapTeams() {
    setAwayTeam(homeTeam);
    setHomeTeam(awayTeam);
  }

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Hypothetical Matchup</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor={seasonId} className="block text-sm font-medium text-text-secondary mb-1">
              Season
            </label>
            <select
              id={seasonId}
              value={selectedSeason ?? ''}
              onChange={handleSeasonChange}
              disabled={seasonsLoading}
              className={`px-3 py-2 ${SELECT_BASE}`}
            >
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <WeekSelect onWeekChange={onWeekChange} selectedWeek={selectedWeek} weeks={weeks} weeksLoading={weeksLoading} />
          <AlgorithmVersionPicker onChange={setSelectedVersions} selectedVersions={selectedVersions} />
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <SearchableSelect
            disabled={!isTeamPickerEnabled}
            excludedOptions={homeTeam !== null ? [homeTeam] : undefined}
            label="Away Team"
            onChange={setAwayTeam}
            options={teams}
            placeholder={teamsLoading ? 'Loading teams…' : 'Search teams…'}
            value={awayTeam}
          />
          <button
            type="button"
            onClick={handleSwapTeams}
            disabled={isNeutralSite || (homeTeam === null && awayTeam === null)}
            aria-label="Swap home and away teams"
            className={BUTTON_SECONDARY}
          >
            ⇄
          </button>
          <SearchableSelect
            disabled={!isTeamPickerEnabled}
            excludedOptions={awayTeam !== null ? [awayTeam] : undefined}
            label="Home Team"
            onChange={setHomeTeam}
            options={teams}
            placeholder={teamsLoading ? 'Loading teams…' : 'Search teams…'}
            value={homeTeam}
          />
          <div className="flex items-center gap-2 py-2">
            <input
              id={neutralSiteId}
              type="checkbox"
              checked={isNeutralSite}
              onChange={(event) => setIsNeutralSite(event.target.checked)}
            />
            <label htmlFor={neutralSiteId} className="text-sm font-medium text-text-secondary">
              Neutral site
            </label>
          </div>
          <button type="button" onClick={handleRunClick} disabled={!canRun} className={BUTTON_PRIMARY}>
            {isRunning ? 'Calculating...' : 'Predict Matchup'}
          </button>
        </div>
        {teamsError && <ErrorAlert error={teamsError} />}
      </div>

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render matchup prediction')} />}>
        <ExperimentalMatchupResults runState={runState} submittedMatchup={submittedMatchup} />
      </ErrorBoundary>
    </>
  );
}
