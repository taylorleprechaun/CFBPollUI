import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminPage } from '../../pages/admin-page';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
let mockIsAuthenticated = true;
let mockToken: string | null = 'test-token';

const mockSetSelectedSeason = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
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
        { weekNumber: 1, label: 'Week 1' },
        { weekNumber: 5, label: 'Week 5' },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('../../services/admin-api', () => ({
  calculateRankings: vi.fn(),
  deleteSnapshot: vi.fn(),
  downloadExport: vi.fn(),
  fetchPersistedWeeks: vi.fn().mockResolvedValue([]),
  publishSnapshot: vi.fn(),
}));

import {
  calculateRankings,
  deleteSnapshot,
  downloadExport,
  fetchPersistedWeeks,
  publishSnapshot,
} from '../../services/admin-api';

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
    mockIsAuthenticated = true;
    mockToken = 'test-token';
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([]);
  });


  it('renders admin dashboard when authenticated', () => {
    renderAdminPage();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Calculate Rankings')).toBeInTheDocument();
    expect(screen.getByText('Persisted Snapshots')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockIsAuthenticated = false;
    mockToken = null;
    renderAdminPage();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
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
    vi.mocked(calculateRankings).mockResolvedValue({
      persisted: true,
      rankings: {
        season: 2024,
        week: 5,
        rankings: [],
      },
    });

    renderAdminPage();

    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(calculateRankings).toHaveBeenCalledWith('test-token', 2024, 5);
    });
  });

  it('shows preview after calculation', async () => {
    vi.mocked(calculateRankings).mockResolvedValue({
      persisted: true,
      rankings: {
        season: 2024,
        week: 5,
        rankings: [],
      },
    });

    renderAdminPage();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 5/)).toBeInTheDocument();
    });
  });

  it('collapses and expands preview', async () => {
    vi.mocked(calculateRankings).mockResolvedValue({
      persisted: true,
      rankings: {
        season: 2024,
        week: 5,
        rankings: [],
      },
    });

    renderAdminPage();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 5/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Preview: 2024 Week 5/));

    expect(screen.getByText(/\u25B6/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Preview: 2024 Week 5/));

    expect(screen.getByText(/\u25BC/)).toBeInTheDocument();
  });

  it('shows persist warning when not persisted', async () => {
    vi.mocked(calculateRankings).mockResolvedValue({
      persisted: false,
      rankings: {
        season: 2024,
        week: 5,
        rankings: [],
      },
    });

    renderAdminPage();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Rankings were not persisted/)).toBeInTheDocument();
    });
  });

  it('shows empty state for persisted snapshots', () => {
    renderAdminPage();
    expect(screen.getByText('No persisted snapshots found.')).toBeInTheDocument();
  });

  it('renders persisted weeks grouped by season', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2024, week: 2, published: false, createdAt: '2024-09-08T00:00:00Z' },
      { season: 2023, week: 1, published: true, createdAt: '2023-09-01T00:00:00Z' },
    ]);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('2024 Season')).toBeInTheDocument();
      expect(screen.getByText('2023 Season')).toBeInTheDocument();
      expect(screen.getByText('(2 snapshots)')).toBeInTheDocument();
      expect(screen.getByText('(1 snapshot)')).toBeInTheDocument();
    });
  });

  it('seasons start collapsed by default', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
    ]);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('2024 Season')).toBeInTheDocument();
    });

    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    expect(seasonButton.textContent).toContain('\u25B6');
  });

  it('expands and collapses season groups on click', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
    ]);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('2024 Season')).toBeInTheDocument();
    });

    const seasonButton = screen.getByText('2024 Season').closest('button')!;

    fireEvent.click(screen.getByText('2024 Season'));
    expect(seasonButton.textContent).toContain('\u25BC');

    fireEvent.click(screen.getByText('2024 Season'));
    expect(seasonButton.textContent).toContain('\u25B6');
  });

  it('expand all and collapse all buttons work', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2023, week: 1, published: true, createdAt: '2023-09-01T00:00:00Z' },
    ]);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('2024 Season')).toBeInTheDocument();
      expect(screen.getByText('2023 Season')).toBeInTheDocument();
    });

    const button2024 = screen.getByText('2024 Season').closest('button')!;
    const button2023 = screen.getByText('2023 Season').closest('button')!;

    expect(button2024.textContent).toContain('\u25B6');
    expect(button2023.textContent).toContain('\u25B6');

    fireEvent.click(screen.getByText('Expand All'));

    expect(button2024.textContent).toContain('\u25BC');
    expect(button2023.textContent).toContain('\u25BC');

    fireEvent.click(screen.getByText('Collapse All'));

    expect(button2024.textContent).toContain('\u25B6');
    expect(button2023.textContent).toContain('\u25B6');
  });

  it('calls logout when Log Out is clicked', () => {
    renderAdminPage();
    fireEvent.click(screen.getByText('Log Out'));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('calls deleteSnapshot when delete is clicked on draft', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(deleteSnapshot).mockResolvedValue(undefined);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(deleteSnapshot).toHaveBeenCalledWith('test-token', 2024, 1);
    });
  });

  it('shows confirm dialog when deleting published snapshot', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(deleteSnapshot).mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(deleteSnapshot).toHaveBeenCalledWith('test-token', 2024, 1);
    });

    confirmSpy.mockRestore();
  });

  it('does not delete when confirm is cancelled', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteSnapshot).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('calls publishSnapshot when publish is clicked on draft', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(publishSnapshot).mockResolvedValue(undefined);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(publishSnapshot).toHaveBeenCalledWith('test-token', 2024, 1);
    });
  });

  it('shows success checkmark after publish succeeds', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(publishSnapshot).mockResolvedValue(undefined);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });
  });

  it('shows error message after publish fails', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(publishSnapshot).mockRejectedValue(new Error('Snapshot not found'));

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Snapshot not found')).toBeInTheDocument();
    });
  });

  it('shows success checkmark on preview publish', async () => {
    vi.mocked(calculateRankings).mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    vi.mocked(publishSnapshot).mockResolvedValue(undefined);

    renderAdminPage();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 5/)).toBeInTheDocument();
    });

    const publishButtons = screen.getAllByText('Publish');
    fireEvent.click(publishButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });
  });

  it('shows error message on preview publish failure', async () => {
    vi.mocked(calculateRankings).mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    vi.mocked(publishSnapshot).mockRejectedValue(new Error('Server error'));

    renderAdminPage();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 5/)).toBeInTheDocument();
    });

    const publishButtons = screen.getAllByText('Publish');
    fireEvent.click(publishButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('success checkmark disappears after timeout', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(publishSnapshot).mockResolvedValue(undefined);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });

    await waitForElementToBeRemoved(() => screen.queryByLabelText('Success'), {
      timeout: 3000,
    });
  });

  it('calls downloadExport when export is clicked', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(downloadExport).mockResolvedValue(undefined);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(downloadExport).toHaveBeenCalledWith('test-token', 2024, 1);
    });
  });

  it('shows error when calculation fails', async () => {
    vi.mocked(calculateRankings).mockRejectedValue(new Error('Network error'));

    renderAdminPage();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('changes season and resets week on season dropdown change', () => {
    renderAdminPage();

    const seasonSelect = screen.getByLabelText('Season');
    fireEvent.change(seasonSelect, { target: { value: '2023' } });

    expect(mockSetSelectedSeason).toHaveBeenCalledWith(2023);
  });

  it('changes week on week dropdown change', () => {
    renderAdminPage();

    const weekSelect = screen.getByLabelText('Week');
    fireEvent.change(weekSelect, { target: { value: '1' } });

    expect((weekSelect as HTMLSelectElement).value).toBe('1');
  });

  it('shows error when delete fails', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(deleteSnapshot).mockRejectedValue(new Error('Delete failed'));

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText(/Delete failed/)).toBeInTheDocument();
    });
  });

  it('shows error when export fails', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(downloadExport).mockRejectedValue(new Error('Export failed'));

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText(/Export failed/)).toBeInTheDocument();
    });
  });

  it('calls downloadExport for preview Download Excel button', async () => {
    vi.mocked(calculateRankings).mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    vi.mocked(downloadExport).mockResolvedValue(undefined);

    renderAdminPage();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 5/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Download Excel'));

    await waitFor(() => {
      expect(downloadExport).toHaveBeenCalledWith('test-token', 2024, 5);
    });
  });

  it('clears calculated result when matching snapshot is deleted', async () => {
    vi.mocked(calculateRankings).mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 5, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(deleteSnapshot).mockResolvedValue(undefined);

    renderAdminPage();

    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 5/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(deleteSnapshot).toHaveBeenCalledWith('test-token', 2024, 5);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Preview: 2024 Week 5/)).not.toBeInTheDocument();
    });
  });

  it('preserves collapsed state after publish', async () => {
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 1, published: false, createdAt: '2024-09-01T00:00:00Z' },
      { season: 2024, week: 2, published: false, createdAt: '2024-09-08T00:00:00Z' },
    ]);
    vi.mocked(publishSnapshot).mockResolvedValue(undefined);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('2024 Season')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('2024 Season'));
    const seasonButton = screen.getByText('2024 Season').closest('button')!;
    expect(seasonButton.textContent).toContain('\u25BC');

    const publishButtons = screen.getAllByText('Publish');
    fireEvent.click(publishButtons[0]);

    await waitFor(() => {
      expect(publishSnapshot).toHaveBeenCalled();
    });

    expect(seasonButton.textContent).toContain('\u25BC');
  });

  it('shows error when fetching persisted weeks fails', async () => {
    vi.mocked(fetchPersistedWeeks).mockRejectedValue(new Error('Server unavailable'));

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText(/Server unavailable/)).toBeInTheDocument();
    });
  });

  it('preview publish checkmark does not appear in snapshot section', async () => {
    vi.mocked(calculateRankings).mockResolvedValue({
      persisted: true,
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    vi.mocked(fetchPersistedWeeks).mockResolvedValue([
      { season: 2024, week: 5, published: false, createdAt: '2024-09-01T00:00:00Z' },
    ]);
    vi.mocked(publishSnapshot).mockResolvedValue(undefined);

    renderAdminPage();

    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview: 2024 Week 5/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('2024 Season'));

    const publishButtons = screen.getAllByText('Publish');
    fireEvent.click(publishButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
    });

    const successIcons = screen.getAllByLabelText('Success');
    expect(successIcons).toHaveLength(1);

    const previewSection = screen.getByText(/Preview: 2024 Week 5/).closest('div.bg-white');
    expect(previewSection?.querySelector('[aria-label="Success"]')).toBeInTheDocument();
  });
});
