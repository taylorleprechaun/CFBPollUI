import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExperimentalPage } from '../../pages/experimental-page';

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
const mockExportMutateAsync = vi.fn();

vi.mock('../../hooks/use-experimental-mutations', () => ({
  useCalculateExperimental: () => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: false,
  }),
  useExportExperimental: () => ({
    mutateAsync: mockExportMutateAsync,
    isPending: false,
  }),
}));

function renderExperimentalPage() {
  return render(
    <MemoryRouter>
      <ExperimentalPage />
    </MemoryRouter>
  );
}

describe('ExperimentalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'test-token';
  });

  it('calls calculateExperimental with the selected algorithm version on calculate', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      algorithmVersion: 'V2',
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderExperimentalPage();
    await userEvent.selectOptions(screen.getByLabelText('Algorithm Version'), 'V2');
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, week: 5 });
    });
  });

  it('calls downloadExperimentalExport when Download Excel is clicked', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      algorithmVersion: 'V1',
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockExportMutateAsync.mockResolvedValue(undefined);

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview \(V1\)/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Download Excel'));

    await waitFor(() => {
      expect(mockExportMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V1', season: 2024, week: 5 });
    });
  });

  it('changes season on season dropdown change', async () => {
    renderExperimentalPage();

    const seasonSelect = screen.getByLabelText('Season');
    await userEvent.selectOptions(seasonSelect, '2023');

    expect(mockSetSelectedSeason).toHaveBeenCalledWith(2023);
  });

  it('changes week on week dropdown change', async () => {
    renderExperimentalPage();

    const weekSelect = screen.getByLabelText('Week');
    await userEvent.selectOptions(weekSelect, '1');

    expect((weekSelect as HTMLSelectElement).value).toBe('1');
  });

  it('does not render a preview before calculating', () => {
    renderExperimentalPage();

    expect(screen.queryByText(/Preview/)).not.toBeInTheDocument();
  });

  it('renders experimental page heading', () => {
    renderExperimentalPage();

    expect(screen.getByText('Experimental')).toBeInTheDocument();
    expect(screen.getByText('Experimental Calculation')).toBeInTheDocument();
  });

  it('renders season, week, and algorithm version selectors', () => {
    renderExperimentalPage();

    expect(screen.getByLabelText('Season')).toBeInTheDocument();
    expect(screen.getByLabelText('Week')).toBeInTheDocument();
    expect(screen.getByLabelText('Algorithm Version')).toBeInTheDocument();
  });

  it('shows error when calculation fails', async () => {
    mockCalculateMutateAsync.mockRejectedValue(new Error('Calculation failed'));

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText('Calculation failed')).toBeInTheDocument();
    });
  });

  it('shows error when export fails', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      algorithmVersion: 'V1',
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockExportMutateAsync.mockRejectedValue(new Error('Export failed'));

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText('Download Excel')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Download Excel'));

    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  it('shows preview after successful calculation', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      algorithmVersion: 'V2',
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview \(V2\): 2024 Week 6/)).toBeInTheDocument();
    });
  });
});
