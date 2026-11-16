import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PredictionCalibrationAnalysis as Analysis } from '../../../schemas/admin';

import { PredictionCalibrationAnalysis } from '../../../components/admin';

const parameters = [
  { defaultValue: 0, description: '', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 },
  { defaultValue: 0, description: '', key: 'paramB', label: 'Param B', max: 10, min: -10, step: 0.1 },
];

function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  const summary = (correct: number, incorrect: number) => ({
    gradedGameCount: correct + incorrect,
    marginBias: null,
    marginMAE: null,
    marginRMSE: null,
    overUnder: { correct, incorrect, push: 0 },
    spread: { correct, incorrect, push: 0 },
    winner: { correct, incorrect, push: 0 },
  });
  return {
    backtestWeeks: [
      { candidate: summary(30, 26), season: 2026, used: summary(25, 31), usedValues: { paramA: 0, paramB: 0 }, week: 8 },
      { candidate: summary(32, 24), season: 2026, used: summary(29, 27), usedValues: { paramA: 1, paramB: 0 }, week: 9 },
    ],
    candidateTotal: summary(62, 50),
    candidateValues: { paramA: 1.5, paramB: -0.8 },
    suggestedValues: { paramA: 1.5, paramB: -0.8 },
    suggestionNotes: { paramA: 'Note for A.', paramB: 'Note for B.' },
    usedTotal: summary(54, 58),
    ...overrides,
  };
}

function renderAnalysis(overrides: Partial<Parameters<typeof PredictionCalibrationAnalysis>[0]> = {}) {
  const props = {
    analysis: buildAnalysis(),
    canApply: true,
    candidateLabel: 'suggested values',
    onApplySuggestion: vi.fn(),
    parameters,
    ...overrides,
  };
  render(<PredictionCalibrationAnalysis {...props} />);
  return props;
}

describe('PredictionCalibrationAnalysis', () => {
  it('applies the suggested values when asked', async () => {
    const props = renderAnalysis();

    await userEvent.click(screen.getByRole('button', { name: 'Use suggested values' }));

    expect(props.onApplySuggestion).toHaveBeenCalledWith({ paramA: 1.5, paramB: -0.8 });
  });

  it('hides the apply button when the week is locked', () => {
    renderAnalysis({ canApply: false });

    expect(screen.queryByRole('button', { name: 'Use suggested values' })).not.toBeInTheDocument();
  });

  it('lists each suggested value with its note', () => {
    renderAnalysis();

    expect(screen.getByText('Param A +1.5')).toBeInTheDocument();
    expect(screen.getByText('Note for B.')).toBeInTheDocument();
  });

  it('orders the record columns Winner, Spread, O/U', () => {
    renderAnalysis();

    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Week', 'Values used', 'Winner', 'Spread', 'O/U']);
  });

  it('shows a message when there are no completed weeks to compare', () => {
    renderAnalysis({ analysis: buildAnalysis({ backtestWeeks: [] }) });

    expect(screen.getByText('No completed weeks this season to compare yet.')).toBeInTheDocument();
  });

  it('shows each week and the total as used vs candidate', () => {
    renderAnalysis();

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText('Week 9')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Param A 0 · Param B 0')).toBeInTheDocument();
    expect(within(rows[0]).getAllByText('25-31 → 30-26')).toHaveLength(3);
    expect(within(rows[2]).getByText('Total')).toBeInTheDocument();
    expect(within(rows[2]).getAllByText('54-58 → 62-50')).toHaveLength(3);
  });

  it('uses the candidate label in the backtest heading', () => {
    renderAnalysis({ candidateLabel: 'your values' });

    expect(screen.getByRole('heading', { name: 'Last 2 weeks: as used vs your values' })).toBeInTheDocument();
  });
});
