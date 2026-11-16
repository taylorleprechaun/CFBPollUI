import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { CalibrationPage } from '../../pages/calibration-page';

vi.mock('../../hooks/use-auth', () => ({
  useAuth: () => ({ isAuthenticated: true, login: vi.fn(), logout: vi.fn(), token: 'test-token' }),
}));

vi.mock('../../hooks/use-season', () => ({
  useSeason: () => ({
    nextSeason: null,
    refetchSeasons: vi.fn(),
    seasons: [2024, 2023],
    seasonsError: null,
    seasonsLoading: false,
    selectedSeason: 2024,
    setSelectedSeason: vi.fn(),
  }),
}));

vi.mock('../../hooks/use-weeks', () => ({
  useWeeks: () => ({
    data: {
      season: 2024,
      weeks: [
        { isComplete: true, label: 'Week 2', weekNumber: 1 },
        { isComplete: true, label: 'Week 6', weekNumber: 5 },
        { isComplete: false, label: 'Week 10', weekNumber: 9 },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('../../hooks/use-prediction-calibration', () => ({
  usePredictionCalibration: (_token: string | null, season: number | null, week: number | null) => ({
    data: {
      carriedFromSeason: null,
      carriedFromWeek: null,
      draftUsesDifferentValues: false,
      isLocked: false,
      isStored: true,
      isSupported: true,
      parameters: [{ defaultValue: 0, description: '', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 }],
      season,
      source: 'Manual',
      updatedAt: null,
      values: { paramA: 0 },
      week,
    },
    error: null,
    isLoading: false,
  }),
}));

vi.mock('../../hooks/use-prediction-calibration-history', () => ({
  usePredictionCalibrationHistory: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../hooks/use-save-prediction-calibration', () => ({
  useSavePredictionCalibration: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

function renderPage(initialRoute = '/admin/calibration') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <CalibrationPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CalibrationPage', () => {
  it('defaults to the current season and latest complete week', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: '2024 Week 6' })).toBeInTheDocument();
  });

  it('ignores season and week params that are not whole numbers', () => {
    renderPage('/admin/calibration?season=abc&week=1.5');

    expect(screen.getByRole('heading', { name: '2024 Week 6' })).toBeInTheDocument();
  });

  it('opens the season and week given in the URL', () => {
    renderPage('/admin/calibration?season=2023&week=1');

    expect(screen.getByRole('heading', { name: '2023 Week 2' })).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Prediction Calibration' })).toBeInTheDocument();
  });

  it('switches to the week chosen in the selector', async () => {
    renderPage();

    await userEvent.selectOptions(screen.getByLabelText('Week'), '9');

    expect(screen.getByRole('heading', { name: '2024 Week 10' })).toBeInTheDocument();
  });
});
