import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PersistedRankingsSnapshotsSection } from '../../../components/admin';

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
  rankingsSnapshots: [] as { createdAt: string; isPublished: boolean; season: number; week: number; }[],
};

describe('PersistedRankingsSnapshotsSection', () => {
  it('calls onDelete when Delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        onDelete={onDelete}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Delete'));

    expect(onDelete).toHaveBeenCalledWith(2024, 1, false);
  });

  it('calls onExpandAll and onCollapseAll', () => {
    const onExpandAll = vi.fn();
    const onCollapseAll = vi.fn();
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Expand All'));
    expect(onExpandAll).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Collapse All'));
    expect(onCollapseAll).toHaveBeenCalled();
  });

  it('calls onExport when Export button is clicked', () => {
    const onExport = vi.fn();
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        onExport={onExport}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Export'));

    expect(onExport).toHaveBeenCalledWith(2024, 1);
  });

  it('calls onPublish when Publish button is clicked', () => {
    const onPublish = vi.fn();
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        onPublish={onPublish}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Publish'));

    expect(onPublish).toHaveBeenCalledWith(2024, 1);
  });

  it('calls onToggleSeason when season header is clicked', () => {
    const onToggleSeason = vi.fn();
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        onToggleSeason={onToggleSeason}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    fireEvent.click(screen.getByText('2024 Season'));

    expect(onToggleSeason).toHaveBeenCalledWith(2024);
  });

  it('disables action buttons when isActionPending is true', () => {
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        isActionPending={true}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText('Publish')).toBeDisabled();
    expect(screen.getByText('Export')).toBeDisabled();
    expect(screen.getByText('Delete')).toBeDisabled();
  });

  it('does not show a View button since onView is not passed', () => {
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.queryByRole('button', { name: 'View' })).not.toBeInTheDocument();
  });

  it('groups rankings snapshots by season', () => {
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
          { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z' },
          { season: 2023, week: 1, isPublished: true, createdAt: '2023-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText('2024 Season')).toBeInTheDocument();
    expect(screen.getByText('2023 Season')).toBeInTheDocument();
    expect(screen.getByText('(2 rankings)')).toBeInTheDocument();
    expect(screen.getByText('(1 ranking)')).toBeInTheDocument();
  });

  it('renders heading', () => {
    render(<PersistedRankingsSnapshotsSection {...defaultProps} />);

    expect(screen.getByText('Persisted Rankings')).toBeInTheDocument();
  });

  it('sets aria-controls pointing to content container', () => {
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        collapsedSeasons={new Set([2024])}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    expect(seasonButton).toHaveAttribute('aria-expanded', 'false');
    const controlsId = seasonButton.getAttribute('aria-controls')!;
    expect(document.getElementById(controlsId)).toBeInTheDocument();
  });

  it('sets aria-expanded to true when season is expanded', () => {
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        collapsedSeasons={new Set()}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    expect(seasonButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows a loading skeleton instead of the empty state while isLoading is true', () => {
    render(<PersistedRankingsSnapshotsSection {...defaultProps} isLoading={true} />);

    expect(screen.queryByText('No persisted rankings found.')).not.toBeInTheDocument();
  });

  it('shows collapsed indicator when season is collapsed', () => {
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        collapsedSeasons={new Set([2024])}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    const chevron = seasonButton.querySelector('svg')!;
    expect(chevron.classList.toString()).toContain('-rotate-90');
  });

  it('shows Draft badge and Publish button for drafts', () => {
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  it('shows empty state when no rankings snapshots', () => {
    render(<PersistedRankingsSnapshotsSection {...defaultProps} />);

    expect(screen.getByText('No persisted rankings found.')).toBeInTheDocument();
  });

  it('shows error message for matching feedback', () => {
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        actionFeedback={{
          key: 'rankings-snapshot-publish-2024-1',
          type: 'error',
          message: 'Publish failed',
        }}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText('Publish failed')).toBeInTheDocument();
  });

  it('shows Published badge for published rankings snapshots', () => {
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('shows success checkmark for matching feedback', () => {
    render(
      <PersistedRankingsSnapshotsSection
        {...defaultProps}
        actionFeedback={{
          key: 'rankings-snapshot-publish-2024-1',
          type: 'success',
        }}
        rankingsSnapshots={[
          { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
        ]}
      />
    );

    expect(screen.getByLabelText('Success')).toBeInTheDocument();
  });
});
