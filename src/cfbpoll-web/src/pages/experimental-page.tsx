import { useState } from 'react';

import type { AlgorithmVersion } from '../components/admin';

import {
  DEFAULT_ALGORITHM_VERSIONS,
  ExperimentalCalculateSection,
  ExperimentalPredictionsCalculateSection,
  ExperimentalPredictionsPreviewSection,
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

  const [algorithmVersion, setAlgorithmVersion] = useState<AlgorithmVersion>('V1');
  const [ratingsSelectedVersions, setRatingsSelectedVersions] = useState<AlgorithmVersion[]>(DEFAULT_ALGORITHM_VERSIONS);
  const [mode, setMode] = useState<ExperimentalMode>('ratings');

  const { handleRun, isRunning, runState } = useExperimentalPageState({
    selectedSeason,
    selectedWeek,
    token,
  });

  const predictionsState = useExperimentalPredictionsState({ algorithmVersion, selectedSeason, selectedWeek, token });

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
          {predictionsState.error && <ErrorAlert error={predictionsState.error} />}

          <ExperimentalPredictionsCalculateSection
            algorithmVersion={algorithmVersion}
            isCalculating={predictionsState.isCalculating}
            onAlgorithmVersionChange={setAlgorithmVersion}
            onCalculate={predictionsState.handleCalculate}
            onSeasonChange={setSelectedSeason}
            onWeekChange={setSelectedWeek}
            seasons={seasons}
            seasonsLoading={seasonsLoading}
            selectedSeason={selectedSeason}
            selectedWeek={selectedWeek}
            weeks={weeksData?.weeks ?? []}
            weeksLoading={weeksLoading}
          />

          <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render experimental predictions preview')} />}>
            {predictionsState.calculatedResult && selectedSeason !== null && selectedWeek !== null && (
              <ExperimentalPredictionsPreviewSection
                calculatedResult={predictionsState.calculatedResult}
                season={selectedSeason}
                week={selectedWeek}
              />
            )}
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}

export default ExperimentalPage;
