import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AlgorithmRunState } from '../../../hooks/use-algorithm-run-state';
import type { ExperimentalPredictionsResponse } from '../../../schemas/admin';

import { PredictionsComparisonSection } from '../../../components/admin';

const idleEntry = { error: null, result: null, status: 'idle' as const };

const emptySummary = {
  gradedGameCount: 0,
  marginBias: null,
  marginMAE: null,
  marginRMSE: null,
  overUnder: { correct: 0, incorrect: 0, push: 0 },
  spread: { correct: 0, incorrect: 0, push: 0 },
  winner: { correct: 0, incorrect: 0, push: 0 },
};

function buildRunState(overrides: Partial<AlgorithmRunState<ExperimentalPredictionsResponse>>): AlgorithmRunState<ExperimentalPredictionsResponse> {
  return {
    V1: idleEntry,
    V2: idleEntry,
    ...overrides,
  };
}

function renderSection(props: Partial<React.ComponentProps<typeof PredictionsComparisonSection>> = {}) {
  const defaultProps: React.ComponentProps<typeof PredictionsComparisonSection> = {
    runState: buildRunState({}),
    season: 2024,
    selectedVersions: ['V1'],
    week: 5,
  };

  return render(<PredictionsComparisonSection {...defaultProps} {...props} />);
}

describe('PredictionsComparisonSection', () => {
  it('renders a summary section per successful algorithm', () => {
    renderSection({
      runState: buildRunState({
        V1: { error: null, status: 'success', result: { algorithmVersion: 'V1', predictions: [], summary: emptySummary } },
      }),
    });

    expect(screen.getByText("This week hasn't been played yet - no actual results to grade against.")).toBeInTheDocument();
    expect(screen.getByText('V1')).toBeInTheDocument();
  });

  it('renders nothing when no selected version has been run yet', () => {
    const { container } = renderSection();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when season is null even if a version has run', () => {
    const { container } = renderSection({
      runState: buildRunState({ V1: { error: null, result: null, status: 'pending' } }),
      season: null,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a status badge for each selected version', () => {
    renderSection({
      runState: buildRunState({ V1: { error: null, result: null, status: 'pending' } }),
      selectedVersions: ['V1', 'V2'],
    });

    expect(screen.getByText('V1: Running…')).toBeInTheDocument();
    expect(screen.getByText('V2: Idle')).toBeInTheDocument();
  });

  it('shows an error alert for a version that failed', () => {
    renderSection({
      runState: buildRunState({ V1: { error: new Error('V1 calculation failed'), result: null, status: 'error' } }),
    });

    expect(screen.getByText('V1 calculation failed')).toBeInTheDocument();
  });

  it('toggles the collapsible content when the heading is clicked', () => {
    renderSection({
      runState: buildRunState({ V1: { error: null, result: null, status: 'pending' } }),
    });

    const heading = screen.getByText('Comparison: 2024 Week 6');
    const headerButton = heading.closest('button')!;
    expect(headerButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(headerButton);
    expect(headerButton).toHaveAttribute('aria-expanded', 'false');
  });
});
