import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PredictionCalibrationAnalysis } from '../../../schemas/admin';

import { rechartsMock } from '../../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

vi.mock('../../../hooks/use-theme', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

import { PredictionCalibrationSeasonResults } from '../../../components/admin';
import { buildAnalysis, buildBacktestWeek } from '../../fixtures/calibration';

const parameters = [
  { defaultValue: 0, description: '', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 },
];

function bodyRows() {
  return screen.getAllByRole('row').slice(1);
}

/**
 * Ten completed weeks where the suggestion got one more pick of each kind right than the values used.
 */
function buildSeasonAnalysis(overrides: Partial<PredictionCalibrationAnalysis> = {}): PredictionCalibrationAnalysis {
  return buildAnalysis({
    backtestWeeks: Array.from({ length: 10 }, (_, i) => buildBacktestWeek(i + 1, 25, 26)),
    ...overrides,
  });
}

function renderResults(overrides: Partial<Parameters<typeof PredictionCalibrationSeasonResults>[0]> = {}) {
  const props = {
    analysis: buildSeasonAnalysis(),
    comparison: 'suggested' as const,
    historyEntries: [{ carriedFromSeason: null, carriedFromWeek: null, isLocked: true, season: 2026, source: 'Accepted' as const, updatedAt: null, values: { paramA: 0 }, week: 10 }],
    onComparisonChange: vi.fn(),
    parameters,
    ...overrides,
  };
  render(<PredictionCalibrationSeasonResults {...props} />);
  return props;
}

describe('PredictionCalibrationSeasonResults', () => {
  it('compares against the typed values with a hindsight warning', () => {
    renderResults({
      analysis: buildSeasonAnalysis({ backtestWeeks: [buildBacktestWeek(1, 25, 26, 30)], candidateValues: { paramA: 2 } }),
      comparison: 'candidate',
    });

    expect(screen.getByRole('heading', { name: 'How your values would have done (hindsight)' })).toBeInTheDocument();
    expect(screen.getByText(/so this flatters them/)).toBeInTheDocument();
    expect(within(bodyRows()[0]).getByText('0 → +2')).toBeInTheDocument();
    expect(within(bodyRows()[0]).getAllByText('+5')).toHaveLength(3);
    expect(screen.getByText(/^Last week, your values would have changed correct picks by: Winner \+5, Spread \+5/)).toBeInTheDocument();
  });

  it('hides the comparison toggle when no values were tested', () => {
    renderResults();

    expect(screen.queryByRole('button', { name: 'Your values' })).not.toBeInTheDocument();
  });

  it('lists the weeks oldest first, in chart order, with the source and the suggestion at the time', () => {
    renderResults();

    const newest = within(bodyRows()[7]);
    expect(within(bodyRows()[0]).getByText('Week 4')).toBeInTheDocument();
    expect(newest.getByText('Accepted')).toBeInTheDocument();
    expect(newest.getByText('0 → +1')).toBeInTheDocument();
    expect(newest.getAllByText('+1')).toHaveLength(3);
  });

  it('shows a message when there are no completed weeks', () => {
    renderResults({ analysis: buildSeasonAnalysis({ backtestWeeks: [] }) });

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
    expect(screen.getByText(/^So far this season, following the suggestions/)).toBeInTheDocument();
  });

  it('sums up the spread result in one sentence', () => {
    renderResults();

    expect(screen.getByText('Over the last 8 weeks, following the suggestions would have changed correct picks by: Winner +8, Spread +8, O/U +8.')).toBeInTheDocument();
  });

  it('switches back to the suggestions from the toggle', async () => {
    const props = renderResults({
      analysis: buildSeasonAnalysis({ backtestWeeks: [buildBacktestWeek(1, 25, 26, 30)], candidateValues: { paramA: 2 } }),
      comparison: 'candidate',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Suggestions' }));

    expect(props.onComparisonChange).toHaveBeenCalledWith('suggested');
  });
});
