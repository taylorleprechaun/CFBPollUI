import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { TrackRecordPage } from '../../pages/track-record-page';

vi.mock('../../hooks/use-track-record', () => ({
  useTrackRecord: vi.fn(),
}));

vi.mock('../../hooks/use-document-title', () => ({
  useDocumentTitle: vi.fn(),
}));

import { useTrackRecord } from '../../hooks/use-track-record';

function LocationDisplay() {
  return <div data-testid="location-search">{useLocation().search}</div>;
}

function renderPage(initialRoute = '/track-record') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <TrackRecordPage />
      <LocationDisplay />
    </MemoryRouter>
  );
}

const mockData = {
  overallMarginBias: 0.75,
  overallMarginRMSE: 6.2,
  overallOverUnder: { correct: 10, incorrect: 8, push: 1 },
  overallSpread: { correct: 12, incorrect: 6, push: 0 },
  overallWinner: { correct: 15, incorrect: 3, push: 0 },
  weeks: [
    {
      marginBias: 2,
      marginGameCount: 4,
      marginRMSE: 5,
      overUnder: { correct: 3, incorrect: 2, push: 0 },
      season: 2024,
      spread: { correct: 4, incorrect: 1, push: 0 },
      week: 1,
      winner: { correct: 5, incorrect: 0, push: 0 },
    },
    {
      marginBias: -3,
      marginGameCount: 6,
      marginRMSE: 3,
      overUnder: { correct: 2, incorrect: 1, push: 1 },
      season: 2024,
      spread: { correct: 3, incorrect: 2, push: 0 },
      week: 3,
      winner: { correct: 4, incorrect: 1, push: 0 },
    },
    {
      marginBias: -2,
      marginGameCount: 2,
      marginRMSE: 8,
      overUnder: { correct: 1, incorrect: 1, push: 0 },
      season: 2023,
      spread: { correct: 2, incorrect: 0, push: 0 },
      week: 2,
      winner: { correct: 2, incorrect: 0, push: 0 },
    },
  ],
};

describe('TrackRecordPage', () => {
  it('defaults the season dropdown to the most recent season present in the data', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
    expect(seasonSelect.value).toBe('2024');
  });

  it('ignores a ?season= URL param for a season with no data', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage('/track-record?season=2019');

    const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
    expect(seasonSelect.value).toBe('2024');
  });

  it('renders a link to the explanation page near the heading', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    const link = screen.getByRole('link', { name: /Winner, Spread, Margin RMSE/ });
    expect(link).toHaveAttribute('href', '/track-record/explained');
  });

  it('renders an empty state when there are no graded weeks', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: {
        overallMarginBias: null,
        overallMarginRMSE: null,
        overallOverUnder: { correct: 0, incorrect: 0, push: 0 },
        overallSpread: { correct: 0, incorrect: 0, push: 0 },
        overallWinner: { correct: 0, incorrect: 0, push: 0 },
        weeks: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    expect(screen.getByText('No graded predictions have been published yet.')).toBeInTheDocument();
  });

  it('renders an info button for each summary card', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    expect(screen.getAllByRole('button', { name: /^About / })).toHaveLength(10);
  });

  it('renders error state with retry button', async () => {
    const mockRefetch = vi.fn();
    vi.mocked(useTrackRecord).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Something went wrong'),
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders loading state', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders overall record cards for each category', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    expect(screen.getAllByText('Winner').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Spread').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Over/Under').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('15-3')).toBeInTheDocument();
    expect(screen.getByText('12-6')).toBeInTheDocument();
    expect(screen.getByText('10-8-1')).toBeInTheDocument();
    expect(screen.getAllByText('Margin RMSE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Margin Bias').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('6.2 pts')).toBeInTheDocument();
    expect(screen.getByText('+0.8 pts')).toBeInTheDocument();
  });

  it('renders the by-week table with most recent week first', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    const rows = screen.getAllByRole('row');
    // First data row (after the header row) should be the most recently graded week (week 3).
    expect(rows[1]).toHaveTextContent('2024 Week 4');
    expect(rows[2]).toHaveTextContent('2024 Week 2');
  });

  it('renders the heading', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Track Record' })).toBeInTheDocument();
  });

  it('selects the season from a ?season= URL param on load', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage('/track-record?season=2023');

    const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
    expect(seasonSelect.value).toBe('2023');
  });

  it('shows the season-overall summary for the currently selected season, summed from its weeks', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    // Sum of the two 2024 weeks: winner 5-0 + 4-1 = 9-1, spread 4-1 + 3-2 = 7-3, O/U 3-2 + 2-1-1 = 5-3-1.
    expect(screen.getByText('9-1')).toBeInTheDocument();
    expect(screen.getByText('7-3')).toBeInTheDocument();
    expect(screen.getByText('5-3-1')).toBeInTheDocument();

    // Count-weighted combination of the two 2024 weeks (bias 2/count 4, bias -3/count 6; RMSE 5/count 4, RMSE 3/count 6).
    expect(screen.getByText('-1.0 pts')).toBeInTheDocument();
    expect(screen.getByText('3.9 pts')).toBeInTheDocument();
  });

  it('sorts weeks by season/week explicitly instead of relying on the API returning them in order', () => {
    const outOfOrderData = {
      ...mockData,
      weeks: [
        { marginBias: -3, marginGameCount: 6, marginRMSE: 3, overUnder: { correct: 2, incorrect: 1, push: 1 }, season: 2024, spread: { correct: 3, incorrect: 2, push: 0 }, week: 3, winner: { correct: 4, incorrect: 1, push: 0 } },
        { marginBias: -2, marginGameCount: 2, marginRMSE: 8, overUnder: { correct: 1, incorrect: 1, push: 0 }, season: 2023, spread: { correct: 2, incorrect: 0, push: 0 }, week: 2, winner: { correct: 2, incorrect: 0, push: 0 } },
        { marginBias: 2, marginGameCount: 4, marginRMSE: 5, overUnder: { correct: 3, incorrect: 2, push: 0 }, season: 2024, spread: { correct: 4, incorrect: 1, push: 0 }, week: 1, winner: { correct: 5, incorrect: 0, push: 0 } },
      ],
    };
    vi.mocked(useTrackRecord).mockReturnValue({
      data: outOfOrderData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('2024 Week 4');
    expect(rows[2]).toHaveTextContent('2024 Week 2');
  });

  it('updates the table and season-overall cards when the season changes, without altering the all-time cards', async () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    await userEvent.selectOptions(screen.getByLabelText('Season:'), '2023');

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2); // 1 header + 1 data row for the single 2023 week.
    expect(rows[1]).toHaveTextContent('2023 Week 3');

    // The season-overall cards no longer show 2024's aggregate totals.
    expect(screen.queryByText('9-1')).not.toBeInTheDocument();
    expect(screen.queryByText('5-3-1')).not.toBeInTheDocument();
    expect(screen.queryByText('-1.0 pts')).not.toBeInTheDocument();
    expect(screen.queryByText('3.9 pts')).not.toBeInTheDocument();

    // All-time cards are unaffected by the season dropdown.
    expect(screen.getByText('15-3')).toBeInTheDocument();
    expect(screen.getByText('12-6')).toBeInTheDocument();
    expect(screen.getByText('10-8-1')).toBeInTheDocument();
    expect(screen.getByText('6.2 pts')).toBeInTheDocument();
    expect(screen.getByText('+0.8 pts')).toBeInTheDocument();
  });

  it('updates the URL when the season selector changes, so the current view can be shared', async () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    renderPage();

    await userEvent.selectOptions(screen.getByLabelText('Season:'), '2023');

    expect(screen.getByTestId('location-search')).toHaveTextContent('?season=2023');
  });
});
