import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrackRecordPage } from '../../pages/track-record-page';

vi.mock('../../hooks/use-track-record', () => ({
  useTrackRecord: vi.fn(),
}));

vi.mock('../../hooks/use-document-title', () => ({
  useDocumentTitle: vi.fn(),
}));

import { useTrackRecord } from '../../hooks/use-track-record';

const mockData = {
  overallOverUnder: { correct: 10, incorrect: 8, push: 1 },
  overallSpread: { correct: 12, incorrect: 6, push: 0 },
  overallWinner: { correct: 15, incorrect: 3, push: 0 },
  weeks: [
    {
      overUnder: { correct: 3, incorrect: 2, push: 0 },
      season: 2024,
      spread: { correct: 4, incorrect: 1, push: 0 },
      week: 1,
      winner: { correct: 5, incorrect: 0, push: 0 },
    },
    {
      overUnder: { correct: 2, incorrect: 1, push: 1 },
      season: 2024,
      spread: { correct: 3, incorrect: 2, push: 0 },
      week: 3,
      winner: { correct: 4, incorrect: 1, push: 0 },
    },
    {
      overUnder: { correct: 1, incorrect: 1, push: 0 },
      season: 2023,
      spread: { correct: 2, incorrect: 0, push: 0 },
      week: 2,
      winner: { correct: 2, incorrect: 0, push: 0 },
    },
  ],
};

describe('TrackRecordPage', () => {
  it('renders the heading', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    render(<TrackRecordPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Track Record' })).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    render(<TrackRecordPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state with retry button', async () => {
    const mockRefetch = vi.fn();
    vi.mocked(useTrackRecord).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Something went wrong'),
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useTrackRecord>);

    render(<TrackRecordPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders an empty state when there are no graded weeks', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: {
        overallOverUnder: { correct: 0, incorrect: 0, push: 0 },
        overallSpread: { correct: 0, incorrect: 0, push: 0 },
        overallWinner: { correct: 0, incorrect: 0, push: 0 },
        weeks: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    render(<TrackRecordPage />);

    expect(screen.getByText('No graded predictions have been published yet.')).toBeInTheDocument();
  });

  it('renders overall record cards for each category', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    render(<TrackRecordPage />);

    expect(screen.getAllByText('Winner').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Spread').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Over/Under').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('15-3')).toBeInTheDocument();
    expect(screen.getByText('12-6')).toBeInTheDocument();
    expect(screen.getByText('10-8-1')).toBeInTheDocument();
  });

  it('renders the by-week table with most recent week first', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    render(<TrackRecordPage />);

    const rows = screen.getAllByRole('row');
    // First data row (after the header row) should be the most recently graded week (week 3).
    expect(rows[1]).toHaveTextContent('2024 Week 4');
    expect(rows[2]).toHaveTextContent('2024 Week 2');
  });

  it('defaults the season dropdown to the most recent season present in the data', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    render(<TrackRecordPage />);

    const seasonSelect = screen.getByLabelText('Season:') as HTMLSelectElement;
    expect(seasonSelect.value).toBe('2024');
  });

  it('shows the season-overall summary for the currently selected season, summed from its weeks', () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    render(<TrackRecordPage />);

    // Sum of the two 2024 weeks: winner 5-0 + 4-1 = 9-1, spread 4-1 + 3-2 = 7-3, O/U 3-2 + 2-1-1 = 5-3-1.
    expect(screen.getByText('9-1')).toBeInTheDocument();
    expect(screen.getByText('7-3')).toBeInTheDocument();
    expect(screen.getByText('5-3-1')).toBeInTheDocument();
  });

  it('updates the table and season-overall cards when the season changes, without altering the all-time cards', async () => {
    vi.mocked(useTrackRecord).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTrackRecord>);

    render(<TrackRecordPage />);

    await userEvent.selectOptions(screen.getByLabelText('Season:'), '2023');

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2); // 1 header + 1 data row for the single 2023 week.
    expect(rows[1]).toHaveTextContent('2023 Week 3');

    // The season-overall cards no longer show 2024's aggregate totals.
    expect(screen.queryByText('9-1')).not.toBeInTheDocument();
    expect(screen.queryByText('5-3-1')).not.toBeInTheDocument();

    // All-time cards are unaffected by the season dropdown.
    expect(screen.getByText('15-3')).toBeInTheDocument();
    expect(screen.getByText('12-6')).toBeInTheDocument();
    expect(screen.getByText('10-8-1')).toBeInTheDocument();
  });
});
