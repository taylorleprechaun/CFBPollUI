import { useMemo, useState } from 'react';

import type { ExperimentalSeasonTrendsResponse } from '../../schemas/admin';

import { usePreloadImages } from '../../hooks/use-preload-images';
import { SeasonTrendsChart } from '../season-trends/season-trends-chart';
import { BUTTON_PRIMARY } from '../ui/button-styles';
import { CollapsibleContent } from '../ui/collapsible-content';
import { CollapsibleTrigger } from '../ui/collapsible-trigger';

interface ExperimentalTrendsSectionProps {
  isCalculating: boolean;
  onCalculate: () => void;
  result: ExperimentalSeasonTrendsResponse | null;
  selectedSeason: number | null;
}

export function ExperimentalTrendsSection({
  isCalculating,
  onCalculate,
  result,
  selectedSeason,
}: ExperimentalTrendsSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const contentId = `experimental-trends-${result?.season ?? 'preview'}`;

  const logoUrls = useMemo(() => result?.teams.map((t) => t.logoURL) ?? [], [result]);
  usePreloadImages(logoUrls);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Season Trend (Top 25)</h2>
        <button
          onClick={onCalculate}
          disabled={isCalculating || selectedSeason === null}
          className={BUTTON_PRIMARY}
        >
          {isCalculating ? 'Calculating...' : 'Calculate Season Trend'}
        </button>
      </div>
      {result && (
        <>
          <CollapsibleTrigger
            contentId={contentId}
            isOpen={expanded}
            onToggle={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            {result.season} Trend
          </CollapsibleTrigger>
          <CollapsibleContent id={contentId} isOpen={expanded}>
            <SeasonTrendsChart data={result} />
          </CollapsibleContent>
        </>
      )}
    </div>
  );
}
