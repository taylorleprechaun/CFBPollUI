import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { AlgorithmRunState } from '../../../hooks/use-algorithm-run-state';
import type { ExperimentalCalculateResponse } from '../../../schemas/admin';

import { RatingsComparisonSection } from '../../../components/admin';

vi.mock('../../../hooks/use-experimental-mutations', () => ({
  useExportExperimental: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const idleEntry = { error: null, result: null, status: 'idle' as const };

function buildRunState(overrides: Partial<AlgorithmRunState<ExperimentalCalculateResponse>>): AlgorithmRunState<ExperimentalCalculateResponse> {
  return {
    V1: idleEntry,
    V2: idleEntry,
    ...overrides,
  };
}

function renderSection(props: Partial<React.ComponentProps<typeof RatingsComparisonSection>> = {}) {
  const defaultProps: React.ComponentProps<typeof RatingsComparisonSection> = {
    runState: buildRunState({}),
    season: 2024,
    selectedVersions: ['V1'],
    token: 'test-token',
    week: 5,
  };

  return render(
    <MemoryRouter>
      <RatingsComparisonSection {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

describe('RatingsComparisonSection', () => {
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

  it('renders the comparison table once at least one selected version succeeds', () => {
    renderSection({
      runState: buildRunState({
        V1: {
          error: null,
          status: 'success',
          result: { algorithmVersion: 'V1', rankings: { season: 2024, week: 5, rankings: [] } },
        },
      }),
    });

    expect(screen.getByText('Comparison: 2024 Week 6')).toBeInTheDocument();
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
