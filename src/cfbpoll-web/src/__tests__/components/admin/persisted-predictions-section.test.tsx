import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PersistedPredictionsSection } from '../../../components/admin';

interface TestSummary {
  createdAt: string;
  gameCount: number;
  gradedAt: string | null;
  isGraded: boolean;
  isPublished: boolean;
  resultsPublished: boolean;
  season: number;
  week: number;
}

const defaultProps = {
  actionFeedback: null,
  collapsedSeasons: new Set<number>(),
  isActionPending: false,
  onClearFeedback: vi.fn(),
  onCollapseAll: vi.fn(),
  onDelete: vi.fn(),
  onExpandAll: vi.fn(),
  onPublish: vi.fn(),
  onToggleSeason: vi.fn(),
  summaries: [] as TestSummary[],
};

describe('PersistedPredictionsSection', () => {
  it('renders heading', () => {
    render(<PersistedPredictionsSection {...defaultProps} />);

    expect(screen.getByText('Persisted Predictions')).toBeInTheDocument();
  });

  it('shows empty state when no summaries', () => {
    render(<PersistedPredictionsSection {...defaultProps} />);

    expect(screen.getByText('No persisted predictions found.')).toBeInTheDocument();
  });

  it('shows a loading skeleton instead of the empty state while isLoading is true', () => {
    render(<PersistedPredictionsSection {...defaultProps} isLoading={true} />);

    expect(screen.queryByText('No persisted predictions found.')).not.toBeInTheDocument();
  });

  it('renders season groups when summaries exist', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
        { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z', gameCount: 8, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('2024 Season')).toBeInTheDocument();
    expect(screen.getByText('(2 predictions)')).toBeInTheDocument();
  });

  it('shows Picks Published badge for published but ungraded predictions', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('Picks Published')).toBeInTheDocument();
  });

  it('shows Draft badge for unpublished predictions', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getAllByText('Draft').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Publish button for draft predictions', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  it('hides Publish button for published predictions', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
  });

  it('calls onDelete when Delete button is clicked', async () => {
    const onDelete = vi.fn();
    const props = {
      ...defaultProps,
      onDelete,
      summaries: [
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith(2024, 1, false);
  });

  it('calls onPublish when Publish button is clicked', async () => {
    const onPublish = vi.fn();
    const props = {
      ...defaultProps,
      onPublish,
      summaries: [
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(onPublish).toHaveBeenCalledWith(2024, 1);
  });

  it('shows game count in summary table', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 15, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows Graded badge for graded predictions', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: '2024-09-02T00:00:00Z', isGraded: true, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    const row = screen.getByText('Week 2').closest('tr');
    expect(row).not.toBeNull();
    expect(within(row!).getByText('Graded')).toBeInTheDocument();
  });

  it('shows Results Published badge for published results', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: '2024-09-02T00:00:00Z', isGraded: true, resultsPublished: true },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('Results Published')).toBeInTheDocument();
  });

  it('shows only the Games extra column header, not separate Graded/Results columns', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.queryByText('Graded')).not.toBeInTheDocument();
    expect(screen.queryByText('Results')).not.toBeInTheDocument();
  });

  it('calls onToggleSeason when season header is clicked', async () => {
    const onToggleSeason = vi.fn();
    const props = {
      ...defaultProps,
      onToggleSeason,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /2024 Season/i }));

    expect(onToggleSeason).toHaveBeenCalledWith(2024);
  });

  it('shows expand/collapse buttons when summaries exist', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('Expand All')).toBeInTheDocument();
    expect(screen.getByText('Collapse All')).toBeInTheDocument();
  });

  it('hides expand/collapse buttons when no summaries', () => {
    render(<PersistedPredictionsSection {...defaultProps} />);

    expect(screen.queryByText('Expand All')).not.toBeInTheDocument();
    expect(screen.queryByText('Collapse All')).not.toBeInTheDocument();
  });

  it('shows View button when onView is provided', () => {
    const props = {
      ...defaultProps,
      onView: vi.fn(),
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
  });

  it('hides View button when onView is omitted', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.queryByRole('button', { name: 'View' })).not.toBeInTheDocument();
  });

  it('shows the success message text alongside the checkmark when publish feedback includes one', () => {
    const props = {
      ...defaultProps,
      actionFeedback: {
        key: 'persisted-prediction-publish-2024-1',
        type: 'success' as const,
        message: 'Published successfully',
      },
      summaries: [
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('Published successfully')).toBeInTheDocument();
  });

  it('marks the row matching activeItem as currently being viewed', () => {
    const props = {
      ...defaultProps,
      activeItem: { season: 2024, week: 1 },
      summaries: [
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
        { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z', gameCount: 8, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    const activeRow = screen.getByText('Week 2').closest('tr');
    const otherRow = screen.getByText('Week 3').closest('tr');
    expect(within(activeRow!).getByText('(Viewing)')).toBeInTheDocument();
    expect(within(otherRow!).queryByText('(Viewing)')).not.toBeInTheDocument();
  });

  it('does not mark any row as being viewed when activeItem is omitted', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.queryByText('(Viewing)')).not.toBeInTheDocument();
  });

  it('calls onView with season and week when View is clicked', async () => {
    const onView = vi.fn();
    const props = {
      ...defaultProps,
      onView,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'View' }));

    expect(onView).toHaveBeenCalledWith(2024, 1);
  });
});
