import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PredictionsPage } from '../../pages/predictions-page';

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
let mockCalculateIsPending = false;

vi.mock('../../hooks/use-admin-mutations', () => ({
  useCalculatePredictions: () => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: mockCalculateIsPending,
  }),
  usePublishPredictions: () => ({
    mutateAsync: mockPublishMutateAsync,
    isPending: false,
  }),
  useDeletePredictions: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

let mockSummariesData: { season: number; week: number; isPublished: boolean; createdAt: string; gameCount: number }[] | undefined = [];
let mockSummariesError: Error | null = null;
const mockRefetchSummaries = vi.fn();

vi.mock('../../hooks/use-predictions-summaries', () => ({
  usePredictionsSummaries: () => ({
    data: mockSummariesData,
    error: mockSummariesError,
    isLoading: false,
    refetch: mockRefetchSummaries,
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

function renderPredictionsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PredictionsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PredictionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'test-token';
    mockSummariesData = [];
    mockSummariesError = null;
    mockCalculateIsPending = false;
  });

  it('renders heading', () => {
    renderPredictionsPage();
    expect(screen.getByRole('heading', { name: 'Predictions' })).toBeInTheDocument();
  });

  it('renders generate predictions section', () => {
    renderPredictionsPage();
    expect(screen.getByText('Generate Predictions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });

  it('renders empty persisted predictions section', () => {
    renderPredictionsPage();
    expect(screen.getByText('Persisted Predictions')).toBeInTheDocument();
    expect(screen.getByText('No persisted predictions found.')).toBeInTheDocument();
  });

  it('calls calculate mutation on Generate click', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: { season: 2024, week: 1, predictions: [] },
    });

    renderPredictionsPage();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
  });

  it('shows preview section after successful generation', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockResolvedValue({
      isPersisted: true,
      predictions: {
        season: 2024,
        week: 1,
        predictions: [
          {
            awayTeam: 'Michigan',
            confidence: 75,
            homeTeam: 'Ohio State',
            homeWinProbability: 0.72,
            neutralSite: false,
            predictedMargin: 10.5,
            predictedWinner: 'Ohio State',
          },
        ],
      },
    });

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => {
      expect(screen.getByText('Michigan @ Ohio State')).toBeInTheDocument();
    });
  });

  it('shows error alert on calculate failure', async () => {
    const user = userEvent.setup();
    mockCalculateMutateAsync.mockRejectedValue(new Error('Server error'));

    renderPredictionsPage();
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('renders persisted summaries when data exists', () => {
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
      { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T00:00:00Z', gameCount: 8 },
    ];

    renderPredictionsPage();
    expect(screen.getByText('2024 Season')).toBeInTheDocument();
  });

  it('shows error when summaries fail to load', () => {
    mockSummariesError = new Error('DB error');

    renderPredictionsPage();
    expect(screen.getByText('DB error')).toBeInTheDocument();
  });

  it('shows confirm modal for deleting published predictions', async () => {
    const user = userEvent.setup();
    mockSummariesData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10 },
    ];

    renderPredictionsPage();

    const seasonButton = screen.getByRole('button', { name: /2024 Season/i });
    await user.click(seasonButton);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete Published Predictions')).toBeInTheDocument();
    });
  });
});
