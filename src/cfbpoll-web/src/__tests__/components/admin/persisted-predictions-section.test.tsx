import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersistedPredictionsSection } from '../../../components/admin';

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
  summaries: [] as { season: number; week: number; isPublished: boolean; createdAt: string; gameCount: number }[],
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

  it('renders season groups when summaries exist', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
        { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z', gameCount: 8 },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('2024 Season')).toBeInTheDocument();
    expect(screen.getByText('(2 predictions)')).toBeInTheDocument();
  });

  it('shows Published badge for published predictions', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('shows Draft badge for unpublished predictions', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows Publish button for draft predictions', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  it('hides Publish button for published predictions', () => {
    const props = {
      ...defaultProps,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
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
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
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
        { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
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
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 15 },
      ],
    };

    render(<PersistedPredictionsSection {...props} />);

    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('calls onToggleSeason when season header is clicked', async () => {
    const onToggleSeason = vi.fn();
    const props = {
      ...defaultProps,
      onToggleSeason,
      summaries: [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
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
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
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
});
