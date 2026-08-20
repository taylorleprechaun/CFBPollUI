import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SeasonPredictionsComparisonTable } from '../../../components/admin';

const emptySummary = {
  gradedGameCount: 0,
  marginBias: null,
  marginMAE: null,
  marginRMSE: null,
  overUnder: { correct: 0, incorrect: 0, push: 0 },
  spread: { correct: 0, incorrect: 0, push: 0 },
  winner: { correct: 0, incorrect: 0, push: 0 },
};

describe('SeasonPredictionsComparisonTable', () => {
  it('renders a column header for each algorithm version', () => {
    render(
      <SeasonPredictionsComparisonTable
        entries={[
          { algorithmVersion: 'V1', result: { algorithmVersion: 'V1', overallSummary: emptySummary, season: 2024, weeks: [] } },
          { algorithmVersion: 'V2', result: { algorithmVersion: 'V2', overallSummary: emptySummary, season: 2024, weeks: [] } },
        ]}
      />
    );

    expect(screen.getByText('V1')).toBeInTheDocument();
    expect(screen.getByText('V2')).toBeInTheDocument();
  });

  it('renders a per-week breakdown table for each algorithm version', () => {
    render(
      <SeasonPredictionsComparisonTable
        entries={[
          {
            algorithmVersion: 'V1',
            result: {
              algorithmVersion: 'V1',
              overallSummary: emptySummary,
              season: 2024,
              weeks: [
                { summary: emptySummary, week: 5 },
                { summary: emptySummary, week: 6 },
              ],
            },
          },
        ]}
      />
    );

    expect(screen.getByText('Week 6')).toBeInTheDocument();
    expect(screen.getByText('Week 7')).toBeInTheDocument();
  });

  it('renders a summary box per algorithm', () => {
    render(
      <SeasonPredictionsComparisonTable
        entries={[
          { algorithmVersion: 'V1', result: { algorithmVersion: 'V1', overallSummary: emptySummary, season: 2024, weeks: [] } },
          { algorithmVersion: 'V2', result: { algorithmVersion: 'V2', overallSummary: emptySummary, season: 2024, weeks: [] } },
        ]}
      />
    );

    expect(screen.getAllByText("This week hasn't been played yet - no actual results to grade against.")).toHaveLength(2);
  });
});
