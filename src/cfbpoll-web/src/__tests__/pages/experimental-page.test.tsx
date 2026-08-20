import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

let mockWeeksData: { season: number; weeks: { label: string; weekNumber: number }[] } | undefined = {
  season: 2024,
  weeks: [
    { weekNumber: 1, label: 'Week 2' },
    { weekNumber: 5, label: 'Week 6' },
  ],
};

vi.mock('../../hooks/use-weeks', () => ({
  useWeeks: () => ({
    data: mockWeeksData,
    isLoading: false,
  }),
}));

const mockCalculateMutateAsync = vi.fn();
const mockCalculatePredictionsMutateAsync = vi.fn();
const mockCalculateSeasonPredictionsMutateAsync = vi.fn();
const mockExportMutateAsync = vi.fn();

vi.mock('../../hooks/use-experimental-mutations', () => ({
  useCalculateExperimental: () => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: false,
  }),
  useCalculateExperimentalPredictions: () => ({
    mutateAsync: mockCalculatePredictionsMutateAsync,
    isPending: false,
  }),
  useCalculateExperimentalSeasonPredictions: () => ({
    mutateAsync: mockCalculateSeasonPredictionsMutateAsync,
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
    mockWeeksData = {
      season: 2024,
      weeks: [
        { weekNumber: 1, label: 'Week 2' },
        { weekNumber: 5, label: 'Week 6' },
      ],
    };
  });

  it('calls calculateExperimental once per selected algorithm version on calculate', async () => {
    mockCalculateMutateAsync.mockImplementation(({ algorithmVersion }: { algorithmVersion: string }) =>
      Promise.resolve({ algorithmVersion, rankings: { season: 2024, week: 5, rankings: [] } })
    );

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'V1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V1', season: 2024, week: 5 });
      expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, week: 5 });
    });
  });

  it('calls calculateExperimentalPredictions once per selected algorithm version on calculate', async () => {
    mockCalculatePredictionsMutateAsync.mockImplementation(({ algorithmVersion }: { algorithmVersion: string }) =>
      Promise.resolve({
        algorithmVersion,
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
      })
    );

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));
    await userEvent.click(screen.getByRole('button', { name: 'V1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Calculate Predictions' }));

    await waitFor(() => {
      expect(mockCalculatePredictionsMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V1', season: 2024, week: 5 });
      expect(mockCalculatePredictionsMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, week: 5 });
    });
  });

  it('calls calculateExperimentalSeasonPredictions once per selected algorithm version when Compare Season is confirmed', async () => {
    mockCalculateSeasonPredictionsMutateAsync.mockImplementation(({ algorithmVersion }: { algorithmVersion: string }) =>
      Promise.resolve({
        algorithmVersion,
        overallSummary: {
          gradedGameCount: 0,
          marginBias: null,
          marginMAE: null,
          marginRMSE: null,
          overUnder: { correct: 0, incorrect: 0, push: 0 },
          spread: { correct: 0, incorrect: 0, push: 0 },
          winner: { correct: 0, incorrect: 0, push: 0 },
        },
        season: 2024,
        weeks: [],
      })
    );

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));
    await userEvent.click(screen.getByRole('button', { name: 'V1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Compare Season' }));
    await userEvent.click(screen.getByRole('button', { name: 'Compare' }));

    await waitFor(() => {
      expect(mockCalculateSeasonPredictionsMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V1', season: 2024, weeks: [1, 5] });
      expect(mockCalculateSeasonPredictionsMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, weeks: [1, 5] });
    });
  });

  it('calls downloadExperimentalExport when Download Excel is clicked', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      algorithmVersion: 'V2',
      rankings: { season: 2024, week: 5, rankings: [] },
    });
    mockExportMutateAsync.mockResolvedValue(undefined);

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText('Comparison: 2024 Week 6')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Download Excel'));

    await waitFor(() => {
      expect(mockExportMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, week: 5 });
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

  it('closes the compare season modal without running when Cancel is clicked', async () => {
    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Compare Season' }));

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockCalculateSeasonPredictionsMutateAsync).not.toHaveBeenCalled();
  });

  it('does not render a comparison before calculating', () => {
    renderExperimentalPage();

    expect(screen.queryByText(/Comparison/)).not.toBeInTheDocument();
  });

  it('does not render a predictions comparison before calculating', async () => {
    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));

    expect(screen.queryByText(/Comparison/)).not.toBeInTheDocument();
  });

  it('opens the compare season modal when Compare Season is clicked', async () => {
    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));

    await userEvent.click(screen.getByRole('button', { name: 'Compare Season' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Compare Season 2024')).toBeInTheDocument();
  });

  it('renders experimental page heading', () => {
    renderExperimentalPage();

    expect(screen.getByText('Experimental')).toBeInTheDocument();
    expect(screen.getByText('Experimental Calculation')).toBeInTheDocument();
  });

  it('renders no week options in either mode when week data has not loaded yet', async () => {
    mockWeeksData = undefined;

    renderExperimentalPage();
    expect(screen.getByLabelText('Week')).toBeEmptyDOMElement();

    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));
    expect(screen.getByLabelText('Week')).toBeEmptyDOMElement();
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
    expect(screen.getByRole('group', { name: 'Algorithm Version' })).toBeInTheDocument();
  });

  it('shows a comparison table after a successful calculation', async () => {
    mockCalculateMutateAsync.mockResolvedValue({
      algorithmVersion: 'V2',
      rankings: { season: 2024, week: 5, rankings: [] },
    });

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => {
      expect(screen.getByText('Comparison: 2024 Week 6')).toBeInTheDocument();
    });
  });

  it('shows a comparison with summary cards after a successful predictions calculation', async () => {
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
      expect(screen.getByText('Comparison: 2024 Week 6')).toBeInTheDocument();
    });
    expect(screen.getByText('1-0')).toBeInTheDocument();
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
      algorithmVersion: 'V2',
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

  it('shows the season comparison section after confirming Compare Season', async () => {
    mockCalculateSeasonPredictionsMutateAsync.mockResolvedValue({
      algorithmVersion: 'V2',
      overallSummary: {
        gradedGameCount: 0,
        marginBias: null,
        marginMAE: null,
        marginRMSE: null,
        overUnder: { correct: 0, incorrect: 0, push: 0 },
        spread: { correct: 0, incorrect: 0, push: 0 },
        winner: { correct: 0, incorrect: 0, push: 0 },
      },
      season: 2024,
      weeks: [],
    });

    renderExperimentalPage();
    await userEvent.click(screen.getByRole('button', { name: 'Predictions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Compare Season' }));
    await userEvent.click(screen.getByRole('button', { name: 'Compare' }));

    await waitFor(() => {
      expect(screen.getByText('Season Comparison: 2024')).toBeInTheDocument();
    });
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
