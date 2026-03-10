import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { rechartsMock } from '../../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

vi.mock('../../../contexts/theme-context', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

import { SeasonTrendsChart } from '../../../components/season-trends/season-trends-chart';
import type { SeasonTrendsResponse } from '../../../schemas';

const mockData: SeasonTrendsResponse = {
  season: 2024,
  teams: [
    {
      altColor: '#FFFFFF',
      color: '#BB0000',
      conference: 'Big Ten',
      logoURL: 'https://example.com/ohio-state.png',
      rankings: [
        { rank: 1, rating: 95.0, record: '8-0', weekNumber: 1 },
        { rank: 2, rating: 93.0, record: '8-1', weekNumber: 2 },
      ],
      teamName: 'Ohio State',
    },
    {
      altColor: '#FFCB05',
      color: '#00274C',
      conference: 'Big Ten',
      logoURL: 'https://example.com/michigan.png',
      rankings: [
        { rank: 3, rating: 88.0, record: '7-1', weekNumber: 1 },
        { rank: 1, rating: 96.0, record: '8-1', weekNumber: 2 },
      ],
      teamName: 'Michigan',
    },
  ],
  weeks: [
    { label: 'Week 2', weekNumber: 1 },
    { label: 'Week 3', weekNumber: 2 },
  ],
};

describe('SeasonTrendsChart', () => {
  it('renders heading', () => {
    render(<SeasonTrendsChart data={mockData} />);

    expect(
      screen.getByRole('heading', { level: 2, name: '2024 Rank Progression' })
    ).toBeInTheDocument();
  });

  it('renders line chart', () => {
    render(<SeasonTrendsChart data={mockData} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('returns null when no teams', () => {
    const emptyData: SeasonTrendsResponse = {
      season: 2024,
      teams: [],
      weeks: [],
    };

    const { container } = render(<SeasonTrendsChart data={emptyData} />);

    expect(container.firstChild).toBeNull();
  });

});
