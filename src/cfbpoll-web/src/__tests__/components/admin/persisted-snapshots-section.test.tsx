import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersistedSnapshotsSection } from '../../../components/admin';

const defaultProps = {
  actionFeedback: null,
  collapsedSeasons: new Set<number>(),
  isActionPending: false,
  onClearFeedback: vi.fn(),
  onCollapseAll: vi.fn(),
  onDelete: vi.fn(),
  onExpandAll: vi.fn(),
  onExport: vi.fn(),
  onPublish: vi.fn(),
  onToggleSeason: vi.fn(),
  persistedWeeks: [] as { season: number; week: number; published: boolean; createdAt: string }[],
};

describe('PersistedSnapshotsSection', () => {
  it('renders heading', () => {
    render(<PersistedSnapshotsSection {...defaultProps} />);

    expect(screen.getByText('Persisted Snapshots')).toBeInTheDocument();
  });

  it('shows empty state when no snapshots', () => {
    render(<PersistedSnapshotsSection {...defaultProps} />);

    expect(screen.getByText('No persisted snapshots found.')).toBeInTheDocument();
  });

  it('groups snapshots by season', () => {
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        persistedWeeks={[
          { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
          { season: 2024, week: 2, published: false, createdAt: '2024-09-08T00:00:00Z' },
          { season: 2023, week: 1, published: true, createdAt: '2023-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText('2024 Season')).toBeInTheDocument();
    expect(screen.getByText('2023 Season')).toBeInTheDocument();
    expect(screen.getByText('(2 snapshots)')).toBeInTheDocument();
    expect(screen.getByText('(1 snapshot)')).toBeInTheDocument();
  });

  it('shows Published badge for published snapshots', () => {
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        persistedWeeks={[
          { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('shows Draft badge and Publish button for drafts', () => {
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        persistedWeeks={[
          { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  it('calls onToggleSeason when season header is clicked', () => {
    const onToggleSeason = vi.fn();
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        onToggleSeason={onToggleSeason}
        persistedWeeks={[
          { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    fireEvent.click(screen.getByText('2024 Season'));

    expect(onToggleSeason).toHaveBeenCalledWith(2024);
  });

  it('calls onPublish when Publish button is clicked', () => {
    const onPublish = vi.fn();
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        onPublish={onPublish}
        persistedWeeks={[
          { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Publish'));

    expect(onPublish).toHaveBeenCalledWith(2024, 1, 'snapshot');
  });

  it('calls onDelete when Delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        onDelete={onDelete}
        persistedWeeks={[
          { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Delete'));

    expect(onDelete).toHaveBeenCalledWith(2024, 1, false);
  });

  it('calls onExport when Export button is clicked', () => {
    const onExport = vi.fn();
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        onExport={onExport}
        persistedWeeks={[
          { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Export'));

    expect(onExport).toHaveBeenCalledWith(2024, 1);
  });

  it('calls onExpandAll and onCollapseAll', () => {
    const onExpandAll = vi.fn();
    const onCollapseAll = vi.fn();
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        persistedWeeks={[
          { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Expand All'));
    expect(onExpandAll).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Collapse All'));
    expect(onCollapseAll).toHaveBeenCalled();
  });

  it('disables action buttons when isActionPending is true', () => {
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        isActionPending={true}
        persistedWeeks={[
          { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText('Publish')).toBeDisabled();
    expect(screen.getByText('Export')).toBeDisabled();
    expect(screen.getByText('Delete')).toBeDisabled();
  });

  it('shows success checkmark for matching feedback', () => {
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        actionFeedback={{
          key: 'snapshot-publish-2024-1',
          type: 'success',
        }}
        persistedWeeks={[
          { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByLabelText('Success')).toBeInTheDocument();
  });

  it('shows error message for matching feedback', () => {
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        actionFeedback={{
          key: 'snapshot-publish-2024-1',
          type: 'error',
          message: 'Publish failed',
        }}
        persistedWeeks={[
          { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText('Publish failed')).toBeInTheDocument();
  });

  it('shows collapsed indicator when season is collapsed', () => {
    render(
      <PersistedSnapshotsSection
        {...defaultProps}
        collapsedSeasons={new Set([2024])}
        persistedWeeks={[
          { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    const chevron = seasonButton.querySelector('svg')!;
    expect(chevron.classList.toString()).toContain('-rotate-90');
  });
});
