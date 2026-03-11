import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnapshotsPage } from '../../pages/snapshots-page';

let mockToken: string | null = 'test-token';

const mockSetSelectedSeason = vi.fn();

vi.mock('../../contexts/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: mockToken !== null,
    login: vi.fn(),
    logout: vi.fn(),
    token: mockToken,
  }),
}));

vi.mock('../../contexts/season-context', () => ({
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
let mockCalculateIsPending = false;
let mockPublishIsPending = false;
let mockDeleteIsPending = false;
let mockExportIsPending = false;

vi.mock('../../hooks/use-admin-mutations', () => ({
  useCalculateRankings: () => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: mockCalculateIsPending,
  }),
  usePublishSnapshot: () => ({
    mutateAsync: mockPublishMutateAsync,
    isPending: mockPublishIsPending,
  }),
  useDeleteSnapshot: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: mockDeleteIsPending,
  }),
  useExportSnapshot: () => ({
    mutateAsync: mockExportMutateAsync,
    isPending: mockExportIsPending,
  }),
}));

let mockSnapshotsData: { season: number; week: number; isPublished: boolean; createdAt: string }[] | undefined = [];
let mockSnapshotsError: Error | null = null;

const mockRefetchSnapshots = vi.fn();

vi.mock('../../hooks/use-snapshots', () => ({
  useSnapshots: () => ({
    data: mockSnapshotsData,
    error: mockSnapshotsError,
    isLoading: false,
    refetch: mockRefetchSnapshots,
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

function renderSnapshotsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SnapshotsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('SnapshotsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'test-token';
    mockSnapshotsData = [];
    mockSnapshotsError = null;
    mockCalculateIsPending = false;
    mockPublishIsPending = false;
    mockDeleteIsPending = false;
    mockExportIsPending = false;
  });

  it('renders snapshots page heading', () => {
    renderSnapshotsPage();
    expect(screen.getByText('Snapshots')).toBeInTheDocument();
    expect(screen.getByText('Calculate Rankings')).toBeInTheDocument();
    expect(screen.getByText('Persisted Snapshots')).toBeInTheDocument();
  });

  it('renders season and week dropdowns', () => {
    renderSnapshotsPage();
    expect(screen.getByLabelText('Season')).toBeInTheDocument();
    expect(screen.getByLabelText('Week')).toBeInTheDocument();
  });

  it('renders calculate button', () => {
    renderSnapshotsPage();
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeInTheDocument();
  });

  it('calls calculateRankings on calculate button click', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    });
  });

  it('shows preview after calculation', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });
  });

  it('collapses and expands preview', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderSnapshotsPage();
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

  it('shows persist warning when not persisted', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: false,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Rankings were not persisted/)).toBeInTheDocument();
    });
  });

  it('shows empty state for persisted snapshots', () => {
    renderSnapshotsPage();
    expect(screen.getByText('No persisted snapshots found.')).toBeInTheDocument();
  });

  it('renders persisted weeks grouped by season', () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z' },
      { season: 2023, week: 1, isPublished: true, createdAt: '2023-09-01T00:00:00Z' },
    ];

    renderSnapshotsPage();

    expect(screen.getByText('2024 Season')).toBeInTheDocument();
    expect(screen.getByText('2023 Season')).toBeInTheDocument();
    expect(screen.getByText('(2 snapshots)')).toBeInTheDocument();
    expect(screen.getByText('(1 snapshot)')).toBeInTheDocument();
  });

  it('seasons start collapsed by default', () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderSnapshotsPage();

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    const chevron = seasonButton.querySelector('svg')!;
    expect(chevron.classList.toString()).toContain('-rotate-90');
  });

  it('expands and collapses season groups on click', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderSnapshotsPage();

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    const chevron = () => seasonButton.querySelector('svg')!;

    await userEvent.click(screen.getByText('2024 Season'));
    expect(chevron().classList.toString()).not.toContain('-rotate-90');

    await userEvent.click(screen.getByText('2024 Season'));
    expect(chevron().classList.toString()).toContain('-rotate-90');
  });

  it('expand all and collapse all buttons work', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2023, week: 1, isPublished: true, createdAt: '2023-09-01T00:00:00Z' },
    ];

    renderSnapshotsPage();

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

  it('calls deleteSnapshot when delete is clicked on draft', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('shows confirm modal when deleting published snapshot', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Delete'));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Delete Published Snapshot')).toBeInTheDocument();

    const modalDeleteButton = screen.getAllByText('Delete').find(
      (btn) => btn.closest('[role="dialog"]') !== null
    )!;
    await userEvent.click(modalDeleteButton);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('does not delete when confirm modal is cancelled', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Delete'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('calls publishSnapshot when publish is clicked on draft', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(mockPublishMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('shows success checkmark after publish succeeds', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });
  });

  it('shows error message after publish fails', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockRejectedValue(new Error('Snapshot not found'));

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Snapshot not found')).toBeInTheDocument();
    });
  });

  it('shows success checkmark on preview publish', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();
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

  it('shows error message on preview publish failure', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockPublishMutateAsync.mockRejectedValue(new Error('Server error'));

    renderSnapshotsPage();
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

  it('success checkmark disappears after timeout', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });

    await waitForElementToBeRemoved(() => screen.queryByLabelText('Success'), {
      timeout: 3000,
    });
  });

  it('calls downloadExport when export is clicked', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockExportMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(mockExportMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('shows error when calculation fails', async () => {
    mockCalculateMutateAsync.mockRejectedValue(new Error('Network error'));

    renderSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('changes season on season dropdown change', async () => {
    renderSnapshotsPage();

    const seasonSelect = screen.getByLabelText('Season');
    await userEvent.selectOptions(seasonSelect, '2023');

    expect(mockSetSelectedSeason).toHaveBeenCalledWith(2023);
  });

  it('changes week on week dropdown change', async () => {
    renderSnapshotsPage();

    const weekSelect = screen.getByLabelText('Week');
    await userEvent.selectOptions(weekSelect, '1');

    expect((weekSelect as HTMLSelectElement).value).toBe('1');
  });

  it('shows error when delete fails', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockRejectedValue(new Error('Delete failed'));

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText(/Delete failed/)).toBeInTheDocument();
    });
  });

  it('shows error when export fails', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockExportMutateAsync.mockRejectedValue(new Error('Export failed'));

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('2024 Season'));
    await userEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText(/Export failed/)).toBeInTheDocument();
    });
  });

  it('calls downloadExport for preview Download Excel button', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockExportMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Download Excel'));

    await waitFor(() => {
      expect(mockExportMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    });
  });

  it('clears calculated result when matching snapshot is deleted', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockSnapshotsData = [
      { season: 2024, week: 5, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();

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

  it('preserves collapsed state after publish', async () => {
    mockSnapshotsData = [
      { season: 2024, week: 1, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();

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

  it('shows error when fetching snapshots fails', () => {
    mockSnapshotsError = new Error('Server unavailable');

    renderSnapshotsPage();

    expect(screen.getByText(/Server unavailable/)).toBeInTheDocument();
  });

  it('preview publish checkmark does not appear in snapshot section', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockSnapshotsData = [
      { season: 2024, week: 5, isPublished: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderSnapshotsPage();

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

  it('calls refetchSnapshots when retry is clicked on a snapshots error', async () => {
    mockSnapshotsError = new Error('Server unavailable');

    renderSnapshotsPage();

    await userEvent.click(screen.getByText('Retry'));

    expect(mockRefetchSnapshots).toHaveBeenCalled();
  });

  it('does not call refetchSnapshots when retry is clicked on an operation error', async () => {
    mockCalculateMutateAsync.mockRejectedValue(new Error('Network error'));

    renderSnapshotsPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Retry'));

    expect(mockRefetchSnapshots).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
