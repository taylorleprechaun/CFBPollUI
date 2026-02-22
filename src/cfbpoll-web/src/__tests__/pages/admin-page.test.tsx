import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminPage } from '../../pages/admin-page';

const mockLogout = vi.fn();
let mockToken: string | null = 'test-token';

const mockSetSelectedSeason = vi.fn();

vi.mock('../../contexts/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: mockToken !== null,
    login: vi.fn(),
    logout: mockLogout,
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

let mockPersistedWeeksData: { season: number; week: number; published: boolean; createdAt: string }[] | undefined = [];
let mockPersistedWeeksError: Error | null = null;

const mockRefetchPersistedWeeks = vi.fn();

vi.mock('../../hooks/use-persisted-weeks', () => ({
  usePersistedWeeks: () => ({
    data: mockPersistedWeeksData,
    error: mockPersistedWeeksError,
    isLoading: false,
    refetch: mockRefetchPersistedWeeks,
  }),
}));

function renderAdminPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'test-token';
    mockPersistedWeeksData = [];
    mockPersistedWeeksError = null;
    mockCalculateIsPending = false;
    mockPublishIsPending = false;
    mockDeleteIsPending = false;
    mockExportIsPending = false;
  });

  it('renders admin dashboard when authenticated', () => {
    renderAdminPage();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Calculate Rankings')).toBeInTheDocument();
    expect(screen.getByText('Persisted Snapshots')).toBeInTheDocument();
  });

  it('renders season and week dropdowns', () => {
    renderAdminPage();
    expect(screen.getByLabelText('Season')).toBeInTheDocument();
    expect(screen.getByLabelText('Week')).toBeInTheDocument();
  });

  it('renders calculate button', () => {
    renderAdminPage();
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeInTheDocument();
  });

  it('calls calculateRankings on calculate button click', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderAdminPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    });
  });

  it('shows preview after calculation', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderAdminPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });
  });

  it('collapses and expands preview', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderAdminPage();
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
      persisted: false,
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderAdminPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Rankings were not persisted/)).toBeInTheDocument();
    });
  });

  it('shows empty state for persisted snapshots', () => {
    renderAdminPage();
    expect(screen.getByText('No persisted snapshots found.')).toBeInTheDocument();
  });

  it('renders persisted weeks grouped by season', () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2024, week: 2, published: false, createdAt: '2024-09-08T00:00:00Z' },
      { season: 2023, week: 1, published: true, createdAt: '2023-09-01T00:00:00Z' },
    ];

    renderAdminPage();

    expect(screen.getByText('2024 Season')).toBeInTheDocument();
    expect(screen.getByText('2023 Season')).toBeInTheDocument();
    expect(screen.getByText('(2 snapshots)')).toBeInTheDocument();
    expect(screen.getByText('(1 snapshot)')).toBeInTheDocument();
  });

  it('seasons start collapsed by default', () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderAdminPage();

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    const chevron = seasonButton.querySelector('svg')!;
    expect(chevron.classList.toString()).toContain('-rotate-90');
  });

  it('expands and collapses season groups on click', async () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderAdminPage();

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    const chevron = () => seasonButton.querySelector('svg')!;

    await userEvent.click(screen.getByText('2024 Season'));
    expect(chevron().classList.toString()).not.toContain('-rotate-90');

    await userEvent.click(screen.getByText('2024 Season'));
    expect(chevron().classList.toString()).toContain('-rotate-90');
  });

  it('expand all and collapse all buttons work', async () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2023, week: 1, published: true, createdAt: '2023-09-01T00:00:00Z' },
    ];

    renderAdminPage();

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

  it('calls logout when Log Out is clicked', async () => {
    renderAdminPage();
    await userEvent.click(screen.getByText('Log Out'));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('calls deleteSnapshot when delete is clicked on draft', async () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();

    // Expand to see Delete button
    await userEvent.click(screen.getByText('2024 Season'));

    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('shows confirm modal when deleting published snapshot', async () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();

    // Expand to see Delete button
    await userEvent.click(screen.getByText('2024 Season'));

    await userEvent.click(screen.getByText('Delete'));

    // Confirm modal should appear
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Delete Published Snapshot')).toBeInTheDocument();

    // Click "Delete" in the modal to confirm
    const modalDeleteButton = screen.getAllByText('Delete').find(
      (btn) => btn.closest('[role="dialog"]') !== null
    )!;
    await userEvent.click(modalDeleteButton);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('does not delete when confirm modal is cancelled', async () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
    ];

    renderAdminPage();

    // Expand to see Delete button
    await userEvent.click(screen.getByText('2024 Season'));

    await userEvent.click(screen.getByText('Delete'));

    // Confirm modal should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click "Cancel" in the modal
    await userEvent.click(screen.getByText('Cancel'));

    // Modal should be dismissed and delete should not have been called
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
  });

  it('calls publishSnapshot when publish is clicked on draft', async () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();

    // Expand to see Publish button
    await userEvent.click(screen.getByText('2024 Season'));

    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(mockPublishMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('shows success checkmark after publish succeeds', async () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();

    // Expand to see Publish button
    await userEvent.click(screen.getByText('2024 Season'));

    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });
  });

  it('shows error message after publish fails', async () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockRejectedValue(new Error('Snapshot not found'));

    renderAdminPage();

    // Expand to see Publish button
    await userEvent.click(screen.getByText('2024 Season'));

    await userEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Snapshot not found')).toBeInTheDocument();
    });
  });

  it('shows success checkmark on preview publish', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();
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
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockPublishMutateAsync.mockRejectedValue(new Error('Server error'));

    renderAdminPage();
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
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();

    // Expand to see Publish button
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
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockExportMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();

    // Expand to see Export button
    await userEvent.click(screen.getByText('2024 Season'));

    await userEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(mockExportMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 1 });
    });
  });

  it('shows error when calculation fails', async () => {
    mockCalculateMutateAsync.mockRejectedValue(new Error('Network error'));

    renderAdminPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('changes season on season dropdown change', async () => {
    renderAdminPage();

    const seasonSelect = screen.getByLabelText('Season');
    await userEvent.selectOptions(seasonSelect, '2023');

    expect(mockSetSelectedSeason).toHaveBeenCalledWith(2023);
  });

  it('changes week on week dropdown change', async () => {
    renderAdminPage();

    const weekSelect = screen.getByLabelText('Week');
    await userEvent.selectOptions(weekSelect, '1');

    expect((weekSelect as HTMLSelectElement).value).toBe('1');
  });

  it('shows error when delete fails', async () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockRejectedValue(new Error('Delete failed'));

    renderAdminPage();

    // Expand to see Delete button
    await userEvent.click(screen.getByText('2024 Season'));

    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText(/Delete failed/)).toBeInTheDocument();
    });
  });

  it('shows error when export fails', async () => {
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockExportMutateAsync.mockRejectedValue(new Error('Export failed'));

    renderAdminPage();

    // Expand to see Export button
    await userEvent.click(screen.getByText('2024 Season'));

    await userEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText(/Export failed/)).toBeInTheDocument();
    });
  });

  it('calls downloadExport for preview Download Excel button', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockExportMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();
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
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockPersistedWeeksData = [
      { season: 2024, week: 5, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();

    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 6/)).toBeInTheDocument();
    });

    // Expand to see Delete button
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
    mockPersistedWeeksData = [
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2024, week: 2, published: false, createdAt: '2024-09-08T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();

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

  it('shows error when fetching persisted weeks fails', () => {
    mockPersistedWeeksError = new Error('Server unavailable');

    renderAdminPage();

    expect(screen.getByText(/Server unavailable/)).toBeInTheDocument();
  });

  it('preview publish checkmark does not appear in snapshot section', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockPersistedWeeksData = [
      { season: 2024, week: 5, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ];
    mockPublishMutateAsync.mockResolvedValue(undefined);

    renderAdminPage();

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

    const previewSection = screen.getByText(/Preview: 2024 Week 6/).closest('div.bg-white');
    expect(previewSection?.querySelector('[aria-label="Success"]')).toBeInTheDocument();
  });

  it('calls refetchPersistedWeeks when retry is clicked on a persisted weeks error', async () => {
    mockPersistedWeeksError = new Error('Server unavailable');

    renderAdminPage();

    await userEvent.click(screen.getByText('Retry'));

    expect(mockRefetchPersistedWeeks).toHaveBeenCalled();
  });

  it('does not call refetchPersistedWeeks when retry is clicked on an operation error', async () => {
    mockCalculateMutateAsync.mockRejectedValue(new Error('Network error'));

    renderAdminPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Retry'));

    expect(mockRefetchPersistedWeeks).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
