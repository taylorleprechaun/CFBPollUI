import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RankingsSnapshotsPage } from '../../pages/rankings-snapshots-page';

let mockToken: string | null = 'test-token';

const mockSetSelectedSeason = vi.fn();

vi.mock('../../hooks/use-auth', () => ({
  useAuth: () => ({
    isAuthenticated: mockToken !== null,
    login: vi.fn(),
    logout: vi.fn(),
    token: mockToken,
  }),
}));

vi.mock('../../hooks/use-season', () => ({
  useSeason: () => ({
    seasons: [2024, 2023],
    seasonsLoading: false,
    seasonsError: null,
    selectedSeason: 2024,
    setSelectedSeason: mockSetSelectedSeason,
    refetchSeasons: vi.fn(),
  }),
}));

vi.mock('../../hooks/use-weeks', () => ({
  useWeeks: () => ({
    data: {
      season: 2024,
      weeks: [
        { weekNumber: 1, label: 'Week 2' },
        { weekNumber: 5, label: 'Week 6' },
      ],
    },
    isLoading: false,
  }),
}));

const mockCalculateMutateAsync = vi.fn();
const mockPublishMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockExportMutateAsync = vi.fn();
const mockRefreshCacheMutateAsync = vi.fn();
let mockCalculateIsPending = false;
let mockPublishIsPending = false;
let mockDeleteIsPending = false;
let mockExportIsPending = false;
let mockRefreshCacheIsPending = false;

vi.mock('../../hooks/use-admin-mutations', () => ({
  useCalculateRankings: () => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: mockCalculateIsPending,
  }),
  usePublishRankingsSnapshot: () => ({
    mutateAsync: mockPublishMutateAsync,
    isPending: mockPublishIsPending,
  }),
  useDeleteRankingsSnapshot: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: mockDeleteIsPending,
  }),
  useExportRankingsSnapshot: () => ({
    mutateAsync: mockExportMutateAsync,
    isPending: mockExportIsPending,
  }),
  useRefreshCache: () => ({
    mutateAsync: mockRefreshCacheMutateAsync,
    isPending: mockRefreshCacheIsPending,
  }),
}));

let mockRankingsSnapshotsData: { createdAt: string; isPublished: boolean; season: number; week: number; }[] | undefined = [];
let mockRankingsSnapshotsError: Error | null = null;
let mockRankingsSnapshotsLoading = false;

const mockRefetchRankingsSnapshots = vi.fn();

vi.mock('../../hooks/use-rankings-snapshots', () => ({
  useRankingsSnapshots: () => ({
    data: mockRankingsSnapshotsData,
    error: mockRankingsSnapshotsError,
    isLoading: mockRankingsSnapshotsLoading,
    refetch: mockRefetchRankingsSnapshots,
  }),
}));

vi.mock('../../hooks/use-page-visibility', () => ({
  usePageVisibility: () => ({
    allTimeEnabled: true,
    isLoading: false,
    pollLeadersEnabled: true,
    seasonTrendsEnabled: true,
  }),
}));

function renderRankingsSnapshotsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RankingsSnapshotsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RankingsSnapshotsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'test-token';
    mockRankingsSnapshotsData = [];
    mockRankingsSnapshotsError = null;
    mockRankingsSnapshotsLoading = false;
    mockCalculateIsPending = false;
    mockPublishIsPending = false;
    mockDeleteIsPending = false;
    mockExportIsPending = false;
    mockRefreshCacheIsPending = false;
  });

  it('calculates after confirming the overwrite of a published rankings snapshot', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 5, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    });
  });

  it('calculates immediately without a confirm modal when the selected week has only a draft (unpublished) rankings snapshot', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 5, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    });
  });

  it('calls calculateRankings on calculate button click', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    });
  });

  it('calls deleteRankingsSnapshot when delete is clicked on draft', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('calls downloadExport for preview Download Excel button', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockExportMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Download Excel'));

    await waitFor(() => {
      expect(mockExportMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    });
  });

  it('calls downloadExport when export is clicked', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockExportMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(mockExportMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('calls publishRankingsSnapshot when publish is clicked on draft', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(mockPublishMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('calls refetchRankingsSnapshots when retry is clicked on a rankings snapshots error', async () => {
    mockRankingsSnapshotsError = new Error('Server unavailable');

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('Retry'));

    expect(mockRefetchRankingsSnapshots).toHaveBeenCalled();
  });

  it('calls refreshCache with selected season and week when confirmed', async () => {
    mockRefreshCacheMutateAsync.mockResolvedValue({ removedCount: 8, season: 2024, week: 5 });

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh Cached Data' }));

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(mockRefreshCacheMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    });
  });

  it('changes season on season dropdown change', async () => {
    renderRankingsSnapshotsPage();

    const seasonSelect = screen.getByLabelText('Season');
    await userEvent.selectOptions(seasonSelect, '2023');

    expect(mockSetSelectedSeason).toHaveBeenCalledWith(2023);
  });

  it('changes week on week dropdown change', async () => {
    renderRankingsSnapshotsPage();

    const weekSelect = screen.getByLabelText('Week');
    await userEvent.selectOptions(weekSelect, '1');

    expect((weekSelect as HTMLSelectElement).value).toBe('1');
  });

  it('clears calculated result when matching rankings snapshot is deleted', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockRankingsSnapshotsData = [
      { season: 2024, week: 5, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    });

    await waitFor(() => {
      expect(screen.queryByText(/Preview: 2024 Week 6/)).not.toBeInTheDocument();
    });
  });

  it('collapses and expands preview', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });

    const previewButton = screen.getByText(/Preview: 2024 Week 6/).closest('button')!;
    const chevron = () => previewButton.querySelector('svg')!;

    await userEvent.click(screen.getByText(/Preview: 2024 Week 6/));
    expect(chevron().classList.toString()).toContain('-rotate-90');

    await userEvent.click(screen.getByText(/Preview: 2024 Week 6/));
    expect(chevron().classList.toString()).not.toContain('-rotate-90');
  });

  it('does not calculate when the overwrite confirm modal is cancelled', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 5, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call refetchRankingsSnapshots when retry is clicked on an operation error', async () => {
    mockCalculateMutateAsync.mockRejectedValue(new Error('Network error'));

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Retry'));

    expect(mockRefetchRankingsSnapshots).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not call refreshCache when confirm modal is cancelled', async () => {
    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh Cached Data' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockRefreshCacheMutateAsync).not.toHaveBeenCalled();
  });

  it('does not delete when confirm modal is cancelled', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Delete'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('does not show the empty-state message while rankings snapshots are still loading', () => {
    mockRankingsSnapshotsLoading = true;
    renderRankingsSnapshotsPage();
    expect(screen.queryByText('No persisted rankings found.')).not.toBeInTheDocument();
  });

  it('expand all and collapse all buttons work', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2023, week: 1, isPublished: true, createdAt: '2023-09-01T00:00:00Z' },
    ];

    renderRankingsSnapshotsPage();

    const button2024 = screen.getByText('2024 Season').closest('button')!;
    const button2023 = screen.getByText('2023 Season').closest('button')!;
    const chevron2024 = () => button2024.querySelector('svg')!;
    const chevron2023 = () => button2023.querySelector('svg')!;

    expect(chevron2024().classList.toString()).toContain('-rotate-90');
    expect(chevron2023().classList.toString()).toContain('-rotate-90');

    await userEvent.click(screen.getByText('Expand All'));

    expect(chevron2024().classList.toString()).not.toContain('-rotate-90');
    expect(chevron2023().classList.toString()).not.toContain('-rotate-90');

    await userEvent.click(screen.getByText('Collapse All'));

    expect(chevron2024().classList.toString()).toContain('-rotate-90');
    expect(chevron2023().classList.toString()).toContain('-rotate-90');
  });

  it('expands and collapses season groups on click', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderRankingsSnapshotsPage();

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    const chevron = () => seasonButton.querySelector('svg')!;

    await userEvent.click(screen.getByText('2024 Season'));
    expect(chevron().classList.toString()).not.toContain('-rotate-90');

    await userEvent.click(screen.getByText('2024 Season'));
    expect(chevron().classList.toString()).toContain('-rotate-90');
  });

  it('preserves collapsed state after publish', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    const chevron = () => seasonButton.querySelector('svg')!;
    expect(chevron().classList.toString()).not.toContain('-rotate-90');

    const publishButtons = screen.getAllByText('Publish');
    await userEvent.click(publishButtons[0]);

    await waitFor(() => {
      expect(mockPublishMutateAsync).toHaveBeenCalled();
    });

    expect(chevron().classList.toString()).not.toContain('-rotate-90');
  });

  it('preview publish checkmark does not appear in rankings snapshot section', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockRankingsSnapshotsData = [
      { season: 2024, week: 5, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('2024 Season'));

    const publishButtons = screen.getAllByText('Publish');
    await userEvent.click(publishButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });

    const successIcons = screen.getAllByLabelText('Success');
    expect(successIcons).toHaveLength(1);

    const previewSection = screen.getByText(/Preview: 2024 Week 6/).closest('div.bg-surface');
    expect(previewSection?.querySelector('[aria-label="Success"]')).toBeInTheDocument();
  });

  it('renders calculate button', () => {
    renderRankingsSnapshotsPage();
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeInTheDocument();
  });

  it('renders persisted weeks grouped by season', () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z' },
      { season: 2023, week: 1, isPublished: true, createdAt: '2023-09-01T00:00:00Z' },
    ];

    renderRankingsSnapshotsPage();

    expect(screen.getByText('2024 Season')).toBeInTheDocument();
    expect(screen.getByText('2023 Season')).toBeInTheDocument();
    expect(screen.getByText('(2 rankings)')).toBeInTheDocument();
    expect(screen.getByText('(1 ranking)')).toBeInTheDocument();
  });

  it('renders refresh cached data button', () => {
    renderRankingsSnapshotsPage();
    expect(screen.getByRole('button', { name: 'Refresh Cached Data' })).toBeInTheDocument();
  });

  it('renders season and week dropdowns', () => {
    renderRankingsSnapshotsPage();
    expect(screen.getByLabelText('Season')).toBeInTheDocument();
    expect(screen.getByLabelText('Week')).toBeInTheDocument();
  });

  it('renders rankings snapshots page heading', () => {
    renderRankingsSnapshotsPage();
    expect(screen.getByText('Rankings')).toBeInTheDocument();
    expect(screen.getByText('Calculate Rankings')).toBeInTheDocument();
    expect(screen.getByText('Persisted Rankings')).toBeInTheDocument();
  });

  it('seasons start collapsed by default', () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderRankingsSnapshotsPage();

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    const chevron = seasonButton.querySelector('svg')!;
    expect(chevron.classList.toString()).toContain('-rotate-90');
  });

  it('shows a confirm modal instead of calculating immediately when the selected week already has a published rankings snapshot', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 5, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Overwrite Published Rankings')).toBeInTheDocument();
    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('shows confirm modal instead of calling refreshCache immediately when refresh button is clicked', async () => {
    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh Cached Data' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Refresh Cached Data')).toBeInTheDocument();
    expect(mockRefreshCacheMutateAsync).not.toHaveBeenCalled();
  });

  it('shows confirm modal when deleting published rankings snapshot', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Delete'));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Delete Published Rankings')).toBeInTheDocument();

    const modalDeleteButton = screen.getAllByText('Delete').find(
      (btn) => btn.closest('[role="dialog"]') !== null
    )!;
    await userEvent.click(modalDeleteButton);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('shows empty state for persisted rankings snapshots', () => {
    renderRankingsSnapshotsPage();
    expect(screen.getByText('No persisted rankings found.')).toBeInTheDocument();
  });

  it('shows error feedback when confirmed refresh fails', async () => {
    mockRefreshCacheMutateAsync.mockRejectedValue(new Error('Refresh failed'));

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh Cached Data' }));

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(screen.getByText('Refresh failed')).toBeInTheDocument();
    });
  });

  it('shows error message after publish fails', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockRejectedValue(new Error('Rankings snapshot not found'));

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Rankings snapshot not found')).toBeInTheDocument();
    });
  });

  it('shows error message on preview publish failure', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockPublishMutateAsync.mockRejectedValue(new Error('Server error'));

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });

    const publishButtons = screen.getAllByText('Publish');
    await userEvent.click(publishButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows error when calculation fails', async () => {
    mockCalculateMutateAsync.mockRejectedValue(new Error('Network error'));

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('shows error when delete fails', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockRejectedValue(new Error('Delete failed'));

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText(/Delete failed/)).toBeInTheDocument();
    });
  });

  it('shows error when export fails', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockExportMutateAsync.mockRejectedValue(new Error('Export failed'));

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText(/Export failed/)).toBeInTheDocument();
    });
  });

  it('shows error when fetching rankings snapshots fails', () => {
    mockRankingsSnapshotsError = new Error('Server unavailable');

    renderRankingsSnapshotsPage();

    expect(screen.getByText(/Server unavailable/)).toBeInTheDocument();
  });

  it('shows persist warning when not persisted', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: false,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Rankings were not persisted/)).toBeInTheDocument();
    });
  });

  it('shows preview after calculation', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });
  });

  it('shows removed count feedback after a successful confirmed refresh', async () => {
    mockRefreshCacheMutateAsync.mockResolvedValue({ removedCount: 8, season: 2024, week: 5 });

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh Cached Data' }));

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(screen.getByText('Removed 8 cached entries')).toBeInTheDocument();
    });
  });

  it('shows success checkmark after publish succeeds', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });
  });

  it('shows success checkmark on preview publish', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });

    const publishButtons = screen.getAllByText('Publish');
    await userEvent.click(publishButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });
  });

  it('success checkmark disappears after timeout', async () => {
    mockRankingsSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderRankingsSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });

    await waitForElementToBeRemoved(() => screen.queryByLabelText('Success'), {
      timeout: 3000,
    });
  });
});
