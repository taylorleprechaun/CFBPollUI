import { useState } from 'react';

import type { AlgorithmVersion } from '../components/admin';

import { ExperimentalCalculateSection, ExperimentalPreviewSection, ExperimentalTrendsSection } from '../components/admin';
import { ErrorAlert, ErrorBoundary } from '../components/error';
import { useAuth } from '../hooks/use-auth';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useExperimentalPageState } from '../hooks/use-experimental-page-state';
import { useExperimentalSeasonTrendsState } from '../hooks/use-experimental-season-trends-state';
import { useSeason } from '../hooks/use-season';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';

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

  const {
    calculatedResult,
    error,
    handleCalculate,
    handleExport,
    isCalculating,
    isExporting,
  } = useExperimentalPageState({
    algorithmVersion,
    selectedSeason,
    selectedWeek,
    token,
  });

  const trendsState = useExperimentalSeasonTrendsState({ algorithmVersion, selectedSeason, token });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Experimental</h1>

      {error && <ErrorAlert error={error} />}
      {trendsState.error && <ErrorAlert error={trendsState.error} />}

      <ExperimentalCalculateSection
        algorithmVersion={algorithmVersion}
        isCalculating={isCalculating}
        onAlgorithmVersionChange={setAlgorithmVersion}
        onCalculate={handleCalculate}
        onSeasonChange={setSelectedSeason}
        onWeekChange={setSelectedWeek}
        seasons={seasons}
        seasonsLoading={seasonsLoading}
        selectedSeason={selectedSeason}
        selectedWeek={selectedWeek}
        weeks={weeksData?.weeks ?? []}
        weeksLoading={weeksLoading}
      />

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render experimental preview')} />}>
        {calculatedResult && (
          <ExperimentalPreviewSection
            calculatedResult={calculatedResult}
            isExporting={isExporting}
            onExport={handleExport}
          />
        )}
      </ErrorBoundary>

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render experimental season trend')} />}>
        <ExperimentalTrendsSection
          isCalculating={trendsState.isCalculating}
          onCalculate={trendsState.handleCalculate}
          result={trendsState.result}
          selectedSeason={selectedSeason}
        />
      </ErrorBoundary>
    </div>
  );
}

export default ExperimentalPage;
