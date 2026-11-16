import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PredictionCalibrationAnalysis, PredictionCalibrationBacktestWeek } from '../../../schemas/admin';

import { rechartsMock } from '../../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

vi.mock('../../../hooks/use-theme', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

import { PredictionCalibrationSeasonResults } from '../../../components/admin';

const parameters = [
  { defaultValue: 0, description: '', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 },
];

function bodyRows() {
  return screen.getAllByRole('row').slice(1);
}

function buildAnalysis(overrides: Partial<PredictionCalibrationAnalysis> = {}): PredictionCalibrationAnalysis {
  return {
    backtestWeeks: Array.from({ length: 10 }, (_, i) => buildWeek(i + 1, 25, 26)),
    candidateValues: null,
    suggestedValues: { paramA: 1.5 },
    suggestionNotes: {},
    ...overrides,
  };
}

function buildWeek(week: number, usedCorrect: number, suggestedCorrect: number, candidateCorrect: number | null = null): PredictionCalibrationBacktestWeek {
  return {
    candidate: candidateCorrect === null ? null : summary(candidateCorrect, 50 - candidateCorrect),
    season: 2026,
    suggested: summary(suggestedCorrect, 50 - suggestedCorrect),
    suggestedValues: { paramA: week / 10 },
    used: summary(usedCorrect, 50 - usedCorrect),
    usedValues: { paramA: 0 },
    week,
  };
}

function renderResults(overrides: Partial<Parameters<typeof PredictionCalibrationSeasonResults>[0]> = {}) {
  const props = {
    analysis: buildAnalysis(),
    comparison: 'suggested' as const,
    historyEntries: [{ carriedFromSeason: null, carriedFromWeek: null, isLocked: true, season: 2026, source: 'Accepted' as const, updatedAt: null, values: { paramA: 0 }, week: 10 }],
    onComparisonChange: vi.fn(),
    parameters,
    ...overrides,
  };
  render(<PredictionCalibrationSeasonResults {...props} />);
  return props;
}

function summary(correct: number, incorrect: number) {
  return {
    gradedGameCount: correct + incorrect,
    marginBias: null,
    marginMAE: null,
    marginRMSE: null,
    overUnder: { correct, incorrect, push: 0 },
    spread: { correct, incorrect, push: 0 },
    winner: { correct, incorrect, push: 0 },
  };
}

describe('PredictionCalibrationSeasonResults', () => {
  it('compares against the typed values with a hindsight warning', () => {
    renderResults({
      analysis: buildAnalysis({ backtestWeeks: [buildWeek(1, 25, 26, 30)], candidateValues: { paramA: 2 } }),
      comparison: 'candidate',
    });

    expect(screen.getByRole('heading', { name: 'How your values would have done (hindsight)' })).toBeInTheDocument();
    expect(screen.getByText(/so this flatters them/)).toBeInTheDocument();
    expect(within(bodyRows()[0]).getByText('0 → +2')).toBeInTheDocument();
    expect(within(bodyRows()[0]).getAllByText('+5')).toHaveLength(3);
  });

  it('hides the comparison toggle when no values were tested', () => {
    renderResults();

    expect(screen.queryByRole('button', { name: 'Your values' })).not.toBeInTheDocument();
  });

  it('lists the newest week first with its source and the suggestion at the time', () => {
    renderResults();

    const newest = within(bodyRows()[0]);
    expect(newest.getByText('Accepted')).toBeInTheDocument();
    expect(newest.getByText('0 → +1')).toBeInTheDocument();
    expect(newest.getAllByText('+1')).toHaveLength(3);
  });

  it('shows a message when there are no completed weeks', () => {
    renderResults({ analysis: buildAnalysis({ backtestWeeks: [] }) });

    expect(screen.getByText('No completed weeks this season to compare yet.')).toBeInTheDocument();
  });

  it('shows the last eight weeks by default and totals them', () => {
    renderResults();

    expect(bodyRows()).toHaveLength(8);
    expect(screen.getAllByText('+8')).toHaveLength(3);
    expect(screen.getAllByText('200-200 → 208-192')).toHaveLength(3);
  });

  it('shows the whole season when chosen', async () => {
    renderResults();

    await userEvent.selectOptions(screen.getByLabelText('Show'), 'Season to date');

    expect(bodyRows()).toHaveLength(10);
    expect(screen.getAllByText('+10')).toHaveLength(3);
  });

  it('switches back to the suggestions from the toggle', async () => {
    const props = renderResults({
      analysis: buildAnalysis({ backtestWeeks: [buildWeek(1, 25, 26, 30)], candidateValues: { paramA: 2 } }),
      comparison: 'candidate',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Suggestions' }));

    expect(props.onComparisonChange).toHaveBeenCalledWith('suggested');
  });
});
