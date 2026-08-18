import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rechartsMock } from '../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

vi.mock('../../hooks/use-theme', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

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
const mockCalculatePredictionsMutateAsync = vi.fn();
const mockExportMutateAsync = vi.fn();
const mockCalculateTrendsMutateAsync = vi.fn();

vi.mock('../../hooks/use-experimental-mutations', () => ({
  useCalculateExperimental: () => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: false,
  }),
  useCalculateExperimentalPredictions: () => ({
    mutateAsync: mockCalculatePredictionsMutateAsync,
    isPending: false,
  }),
  useCalculateExperimentalSeasonTrends: () => ({
    mutateAsync: mockCalculateTrendsMutateAsync,
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

  it('calls calculateExperimentalPredictions with the selected algorithm version on calculate', async () => {
    mockCalculatePredictionsMutateAsync.mockResolvedValue({
      algorithmVersion: 'V2',
      predictions: [],
      summary: {
        gradedGameCount: 0,
        marginBias: null,
        marginMAE: null,
        marginRMSE: null,
        overUnder: { correct: 0, incorrect: 0, push: 0 },
        spread: { correct: 0, incorrect: 0, push: 0 },
        winner: { correct: 0, incorrect: 0, push: 0 },
      },
    });

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));
    await userEvent.selectOptions(screen.getByLabelText('Algorithm Version'), 'V2');
    await userEvent.click(screen.getByRole('button', { name: 'Calculate Predictions' }));

    await waitFor(() => {
      expect(mockCalculatePredictionsMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, week: 5 });
    });
  });

  it('calls calculateExperimentalSeasonTrends with the selected algorithm version on Calculate Season Trend', async () => {
    mockCalculateTrendsMutateAsync.mockResolvedValue({ season: 2024, teams: [], weeks: [] });

    renderExperimentalPage();
    await userEvent.selectOptions(screen.getByLabelText('Algorithm Version'), 'V2');
    await userEvent.click(screen.getByRole('button', { name: 'Calculate Season Trend' }));

    await waitFor(() => {
      expect(mockCalculateTrendsMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024 });
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

  it('does not render a predictions preview before calculating', async () => {
    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));

    expect(screen.queryByText(/Preview/)).not.toBeInTheDocument();
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

  it('renders predictions calculate section after switching to predictions mode', async () => {
    renderExperimentalPage();

    expect(screen.queryByText('Experimental Predictions')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));

    expect(screen.getByText('Experimental Predictions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calculate Predictions' })).toBeInTheDocument();
    expect(screen.queryByText('Experimental Calculation')).not.toBeInTheDocument();
  });

  it('renders season, week, and algorithm version selectors', () => {
    renderExperimentalPage();

    expect(screen.getByLabelText('Season')).toBeInTheDocument();
    expect(screen.getByLabelText('Week')).toBeInTheDocument();
    expect(screen.getByLabelText('Algorithm Version')).toBeInTheDocument();
  });

  it('renders the season trend section heading', () => {
    renderExperimentalPage();

    expect(screen.getByText('Season Trend (Top 25)')).toBeInTheDocument();
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

  it('shows error when predictions calculation fails', async () => {
    mockCalculatePredictionsMutateAsync.mockRejectedValue(new Error('Predictions calculation failed'));

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Calculate Predictions' }));

    await waitFor(() => {
      expect(screen.getByText('Predictions calculation failed')).toBeInTheDocument();
    });
  });

  it('shows error when season trend calculation fails', async () => {
    mockCalculateTrendsMutateAsync.mockRejectedValue(new Error('Season trend calculation failed'));

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate Season Trend' }));

    await waitFor(() => {
      expect(screen.getByText('Season trend calculation failed')).toBeInTheDocument();
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

  it('shows season trend chart after successful season trend calculation', async () => {
    mockCalculateTrendsMutateAsync.mockResolvedValue({ season: 2024, teams: [], weeks: [] });

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate Season Trend' }));

    await waitFor(() => {
      expect(screen.getByText('2024 Trend')).toBeInTheDocument();
    });
  });

  it('shows summary and preview after successful predictions calculation', async () => {
    mockCalculatePredictionsMutateAsync.mockResolvedValue({
      algorithmVersion: 'V2',
      predictions: [],
      summary: {
        gradedGameCount: 1,
        marginBias: -3.5,
        marginMAE: 3.5,
        marginRMSE: 3.5,
        overUnder: { correct: 0, incorrect: 1, push: 0 },
        spread: { correct: 0, incorrect: 0, push: 1 },
        winner: { correct: 1, incorrect: 0, push: 0 },
      },
    });

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Calculate Predictions' }));

    await waitFor(() => {
      expect(screen.getByText(/Preview \(V2\): 2024 Week 6/)).toBeInTheDocument();
    });
    expect(screen.getByText('1-0')).toBeInTheDocument();
  });

  it('switches back to ratings mode when Ratings button is clicked', async () => {
    renderExperimentalPage();

    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));
    expect(screen.queryByText('Experimental Calculation')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ratings' }));
    expect(screen.getByText('Experimental Calculation')).toBeInTheDocument();
    expect(screen.queryByText('Experimental Predictions')).not.toBeInTheDocument();
  });
});
