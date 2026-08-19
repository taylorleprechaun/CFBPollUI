import { useState } from 'react';

import type { AlgorithmVersion } from '../components/admin';

import {
  DEFAULT_ALGORITHM_VERSIONS,
  ExperimentalCalculateSection,
  ExperimentalPredictionsCalculateSection,
  PredictionsComparisonSection,
  RatingsComparisonSection,
} from '../components/admin';
import { ErrorAlert, ErrorBoundary } from '../components/error';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../components/ui/button-styles';
import { useAuth } from '../hooks/use-auth';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useExperimentalPageState } from '../hooks/use-experimental-page-state';
import { useExperimentalPredictionsState } from '../hooks/use-experimental-predictions-state';
import { useSeason } from '../hooks/use-season';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';

type ExperimentalMode = 'predictions' | 'ratings';

export function ExperimentalPage() {
  useDocumentTitle('Taylor Steinberg - Experimental');

  const { token } = useAuth();

  const {
    seasons,
    seasonsLoading,
    selectedSeason,
    setSelectedSeason,
  } = useSeason();

  const { data: weeksData, isLoading: weeksLoading } = useWeeks(selectedSeason);
  const { selectedWeek, setSelectedWeek } = useWeekSelection(weeksData?.weeks);

  const [ratingsSelectedVersions, setRatingsSelectedVersions] = useState<AlgorithmVersion[]>(DEFAULT_ALGORITHM_VERSIONS);
  const [predictionsSelectedVersions, setPredictionsSelectedVersions] = useState<AlgorithmVersion[]>(DEFAULT_ALGORITHM_VERSIONS);
  const [mode, setMode] = useState<ExperimentalMode>('ratings');

  const { handleRun, isRunning, runState } = useExperimentalPageState({
    selectedSeason,
    selectedWeek,
    token,
  });

  const predictionsState = useExperimentalPredictionsState({ selectedSeason, selectedWeek, token });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Experimental</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('ratings')}
          className={mode === 'ratings' ? BUTTON_PRIMARY : BUTTON_SECONDARY}
        >
          Ratings
        </button>
        <button
          onClick={() => setMode('predictions')}
          className={mode === 'predictions' ? BUTTON_PRIMARY : BUTTON_SECONDARY}
        >
          Predictions
        </button>
      </div>

      {mode === 'ratings' && (
        <>
          <ExperimentalCalculateSection
            isRunning={isRunning}
            onRun={() => handleRun(ratingsSelectedVersions)}
            onSeasonChange={setSelectedSeason}
            onSelectedVersionsChange={setRatingsSelectedVersions}
            onWeekChange={setSelectedWeek}
            seasons={seasons}
            seasonsLoading={seasonsLoading}
            selectedSeason={selectedSeason}
            selectedVersions={ratingsSelectedVersions}
            selectedWeek={selectedWeek}
            weeks={weeksData?.weeks ?? []}
            weeksLoading={weeksLoading}
          />

          <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render experimental comparison')} />}>
            <RatingsComparisonSection
              runState={runState}
              season={selectedSeason}
              selectedVersions={ratingsSelectedVersions}
              token={token}
              week={selectedWeek}
            />
          </ErrorBoundary>
        </>
      )}

      {mode === 'predictions' && (
        <>
          <ExperimentalPredictionsCalculateSection
            isRunning={predictionsState.isRunning}
            onRun={() => predictionsState.handleRun(predictionsSelectedVersions)}
            onSeasonChange={setSelectedSeason}
            onSelectedVersionsChange={setPredictionsSelectedVersions}
            onWeekChange={setSelectedWeek}
            seasons={seasons}
            seasonsLoading={seasonsLoading}
            selectedSeason={selectedSeason}
            selectedVersions={predictionsSelectedVersions}
            selectedWeek={selectedWeek}
            weeks={weeksData?.weeks ?? []}
            weeksLoading={weeksLoading}
          />

          <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render experimental predictions comparison')} />}>
            <PredictionsComparisonSection
              runState={predictionsState.runState}
              season={selectedSeason}
              selectedVersions={predictionsSelectedVersions}
              week={selectedWeek}
            />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}

export default ExperimentalPage;
