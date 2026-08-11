import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { TeamPredictionRecordsPage } from '../../pages/team-prediction-records-page';

vi.mock('../../hooks/use-prediction-seasons', () => ({
  usePredictionSeasons: vi.fn(),
}));

vi.mock('../../hooks/use-team-prediction-records', () => ({
  useTeamPredictionRecords: vi.fn(),
}));

vi.mock('../../hooks/use-document-title', () => ({
  useDocumentTitle: vi.fn(),
}));

import { usePredictionSeasons } from '../../hooks/use-prediction-seasons';
import { useTeamPredictionRecords } from '../../hooks/use-team-prediction-records';

function LocationDisplay() {
  return <div data-testid="location-search">{useLocation().search}</div>;
}

function mockRecords(records: unknown[], overrides: Partial<ReturnType<typeof useTeamPredictionRecords>> = {}) {
  vi.mocked(useTeamPredictionRecords).mockReturnValue({
    data: { season: 2024, records },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useTeamPredictionRecords>);
}

function mockSeasons(seasons: number[], overrides: Partial<ReturnType<typeof usePredictionSeasons>> = {}) {
  vi.mocked(usePredictionSeasons).mockReturnValue({
    data: { seasons },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof usePredictionSeasons>);
}

function renderPage(initialRoute = '/team-prediction-records') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <TeamPredictionRecordsPage />
      <LocationDisplay />
    </MemoryRouter>
  );
}

const sampleRecords = [
  { teamName: 'Alabama', logoURL: '', predictedWins: 8, predictedLosses: 2, actualWins: 7, actualLosses: 3, gradedGameCount: 10 },
  { teamName: 'Michigan', logoURL: '', predictedWins: 9, predictedLosses: 1, actualWins: 9, actualLosses: 1, gradedGameCount: 10 },
];

describe('TeamPredictionRecordsPage', () => {
  it('defaults the season dropdown to the most recent published season', () => {
    mockSeasons([2024, 2023]);
    mockRecords(sampleRecords);

    renderPage();

    const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
    expect(seasonSelect.value).toBe('2024');
  });

  it('falls back to the latest season for a ?season= URL param with no published predictions', () => {
    mockSeasons([2024], {});
    mockRecords(sampleRecords);

    renderPage('/team-prediction-records?season=2019');

    const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
    expect(seasonSelect.value).toBe('2024');
  });

  it('only lists published prediction seasons in the dropdown', () => {
    mockSeasons([2024]);
    mockRecords(sampleRecords);

    renderPage();

    const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
    const optionValues = Array.from(seasonSelect.options).map((o) => o.value);
    expect(optionValues).toEqual(['2024']);
  });

  it('renders a signed delta between actual and predicted wins', () => {
    mockSeasons([2024]);
    mockRecords([
      { teamName: 'Alabama', logoURL: '', predictedWins: 8, predictedLosses: 2, actualWins: 7, actualLosses: 3, gradedGameCount: 10 },
      { teamName: 'Iowa', logoURL: '', predictedWins: 5, predictedLosses: 5, actualWins: 8, actualLosses: 2, gradedGameCount: 10 },
      { teamName: 'Michigan', logoURL: '', predictedWins: 9, predictedLosses: 1, actualWins: 9, actualLosses: 1, gradedGameCount: 10 },
    ]);

    renderPage();

    expect(screen.getAllByText('-1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('renders an empty state when no season has published predictions', () => {
    mockSeasons([]);
    mockRecords([]);

    renderPage();

    expect(screen.getByText('No graded predictions have been published yet.')).toBeInTheDocument();
  });

  it('renders an error alert with retry when the records query fails', async () => {
    const mockRefetch = vi.fn();
    mockSeasons([2024]);
    mockRecords([], { error: new Error('Records failed'), refetch: mockRefetch });

    renderPage();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders an error alert with retry when the seasons query fails', async () => {
    const mockRefetch = vi.fn();
    mockSeasons([], { error: new Error('Seasons failed'), refetch: mockRefetch });
    mockRecords([]);

    renderPage();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders team rows with predicted and actual records', () => {
    mockSeasons([2024]);
    mockRecords(sampleRecords);

    renderPage();

    expect(screen.getAllByText('Alabama').length).toBeGreaterThan(0);
    expect(screen.getAllByText('8-2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('7-3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Michigan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('9-1').length).toBe(4);
  });

  it('renders the heading', () => {
    mockSeasons([2024]);
    mockRecords([]);

    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Team Prediction Records' })).toBeInTheDocument();
  });

  it('selects the season from a ?season= URL param on load', () => {
    mockSeasons([2024, 2023]);
    mockRecords(sampleRecords);

    renderPage('/team-prediction-records?season=2023');

    const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
    expect(seasonSelect.value).toBe('2023');
  });

  it('shows a table-level empty state when the season has no graded records yet', () => {
    mockSeasons([2024]);
    mockRecords([]);

    renderPage();

    expect(screen.getByText('No graded predictions have been published for this season yet.')).toBeInTheDocument();
  });

  it('updates the URL when the season selector changes, so the current view can be shared', async () => {
    mockSeasons([2024, 2023]);
    mockRecords(sampleRecords);

    renderPage();

    await userEvent.selectOptions(screen.getByLabelText('Season:'), '2023');

    expect(screen.getByTestId('location-search')).toHaveTextContent('?season=2023');
  });
});
