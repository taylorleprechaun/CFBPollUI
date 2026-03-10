import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

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
  it('renders heading with season year', () => {
    render(<SeasonTrendsChart data={mockData} />);

    expect(
      screen.getByRole('heading', { level: 2, name: '2024 Rank Progression' })
    ).toBeInTheDocument();
  });

  it('renders different season year in heading', () => {
    const data2023: SeasonTrendsResponse = { ...mockData, season: 2023 };
    render(<SeasonTrendsChart data={data2023} />);

    expect(
      screen.getByRole('heading', { level: 2, name: '2023 Rank Progression' })
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

  it('does not inject highlight CSS when no team is active', () => {
    const { container } = render(<SeasonTrendsChart data={mockData} />);

    expect(container.querySelector('style')).toBeNull();
  });

  it('renders team dots via Line mock', () => {
    const { container } = render(<SeasonTrendsChart data={mockData} />);

    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(0);
  });

  it('renders tooltip container', () => {
    const { container } = render(<SeasonTrendsChart data={mockData} />);

    const tooltipContainer = container.querySelector('.absolute.pointer-events-none');
    expect(tooltipContainer).toBeInTheDocument();
  });

  it('injects highlight CSS when a dot is clicked', () => {
    const { container } = render(<SeasonTrendsChart data={mockData} />);

    const firstRect = container.querySelector('rect');
    expect(firstRect).not.toBeNull();

    act(() => {
      fireEvent.click(firstRect!);
    });

    const styleEl = container.querySelector('style');
    expect(styleEl).not.toBeNull();
    expect(styleEl!.textContent).toContain('opacity: 1 !important');
    expect(styleEl!.textContent).toContain('opacity: 0.15 !important');
  });

  it('removes highlight CSS when the same dot is clicked again', () => {
    const { container } = render(<SeasonTrendsChart data={mockData} />);

    const firstRect = container.querySelector('rect');

    act(() => {
      fireEvent.click(firstRect!);
    });
    expect(container.querySelector('style')).not.toBeNull();

    act(() => {
      fireEvent.click(firstRect!);
    });
    expect(container.querySelector('style')).toBeNull();
  });

  it('switches highlight when a different team dot is clicked', () => {
    const { container } = render(<SeasonTrendsChart data={mockData} />);

    const ohioStateLine = container.querySelector('[data-testid="line-Ohio State"]');
    const michiganLine = container.querySelector('[data-testid="line-Michigan"]');
    const osuRect = ohioStateLine!.querySelector('rect');
    const michRect = michiganLine!.querySelector('rect');

    act(() => {
      fireEvent.click(osuRect!);
    });

    const styleEl = container.querySelector('style');
    expect(styleEl!.textContent).toContain('trend-line-0 { opacity: 1');
    expect(styleEl!.textContent).toContain('trend-line-1 { opacity: 0.15');

    act(() => {
      fireEvent.click(michRect!);
    });

    const updatedStyle = container.querySelector('style');
    expect(updatedStyle!.textContent).toContain('trend-line-1 { opacity: 1');
    expect(updatedStyle!.textContent).toContain('trend-line-0 { opacity: 0.15');
  });

  it('clears selection when chart background is clicked', () => {
    const { container } = render(<SeasonTrendsChart data={mockData} />);

    const firstRect = container.querySelector('rect');
    act(() => {
      fireEvent.click(firstRect!);
    });
    expect(container.querySelector('style')).not.toBeNull();

    act(() => {
      fireEvent.click(screen.getByTestId('line-chart'));
    });
    expect(container.querySelector('style')).toBeNull();
  });

  it('shows tooltip on dot hover', () => {
    const { container } = render(<SeasonTrendsChart data={mockData} />);

    const ohioStateLine = container.querySelector('[data-testid="line-Ohio State"]');
    const firstRect = ohioStateLine!.querySelector('rect');

    act(() => {
      fireEvent.mouseEnter(firstRect!);
    });

    expect(screen.getByText('Ohio State')).toBeInTheDocument();
    expect(screen.getByText('Rank: #1')).toBeInTheDocument();
    expect(screen.getByText('Rating: 95.00')).toBeInTheDocument();
    expect(screen.getByText('Record: 8-0')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    const { container } = render(<SeasonTrendsChart data={mockData} />);

    const ohioStateLine = container.querySelector('[data-testid="line-Ohio State"]');
    const firstRect = ohioStateLine!.querySelector('rect');

    act(() => {
      fireEvent.mouseEnter(firstRect!);
    });
    expect(screen.getByText('Rank: #1')).toBeInTheDocument();

    act(() => {
      fireEvent.mouseLeave(firstRect!);
    });

    const tooltipContainer = container.querySelector('.absolute.pointer-events-none') as HTMLElement;
    expect(tooltipContainer.style.opacity).toBe('0');
  });

  it('does not show tooltip for unrelated team when a team is selected', () => {
    const { container } = render(<SeasonTrendsChart data={mockData} />);

    const ohioStateLine = container.querySelector('[data-testid="line-Ohio State"]');
    const michiganLine = container.querySelector('[data-testid="line-Michigan"]');
    const osuRect = ohioStateLine!.querySelector('rect');
    const michRect = michiganLine!.querySelector('rect');

    act(() => {
      fireEvent.click(osuRect!);
    });

    act(() => {
      fireEvent.mouseEnter(michRect!);
    });

    const tooltipContainer = container.querySelector('.absolute.pointer-events-none') as HTMLElement;
    expect(tooltipContainer.style.opacity).toBe('0');
  });

  it('clears selection when season changes', () => {
    const { container, rerender } = render(<SeasonTrendsChart data={mockData} />);

    const firstRect = container.querySelector('rect');
    act(() => {
      fireEvent.click(firstRect!);
    });
    expect(container.querySelector('style')).not.toBeNull();

    const newSeasonData: SeasonTrendsResponse = { ...mockData, season: 2023 };
    rerender(<SeasonTrendsChart data={newSeasonData} />);

    expect(container.querySelector('style')).toBeNull();
  });

  it('renders endpoint dots at larger size and mid-segment dots smaller', () => {
    const threeWeekData: SeasonTrendsResponse = {
      season: 2024,
      teams: [
        {
          altColor: '#FFFFFF',
          color: '#F00000',
          conference: 'SEC',
          logoURL: 'https://example.com/alabama.png',
          rankings: [
            { rank: 1, rating: 98.0, record: '9-0', weekNumber: 1 },
            { rank: 2, rating: 95.0, record: '9-1', weekNumber: 2 },
            { rank: 3, rating: 92.0, record: '9-2', weekNumber: 3 },
          ],
          teamName: 'Alabama',
        },
      ],
      weeks: [
        { label: 'Week 2', weekNumber: 1 },
        { label: 'Week 3', weekNumber: 2 },
        { label: 'Week 4', weekNumber: 3 },
      ],
    };

    const { container } = render(<SeasonTrendsChart data={threeWeekData} />);

    const images = container.querySelectorAll('image');
    const sizes = Array.from(images).map((img) => img.getAttribute('width'));

    expect(sizes).toContain('28');
    expect(sizes).toContain('14');
  });

  it('renders with teams that have null rankings', () => {
    const dataWithUnranked: SeasonTrendsResponse = {
      season: 2024,
      teams: [
        {
          altColor: '#FFFFFF',
          color: '#CC0000',
          conference: 'Big 12',
          logoURL: 'https://example.com/oklahoma.png',
          rankings: [
            { rank: 5, rating: 85.0, record: '6-1', weekNumber: 1 },
            { rank: null, rating: 0, record: '6-2', weekNumber: 2 },
          ],
          teamName: 'Oklahoma',
        },
      ],
      weeks: [
        { label: 'Week 2', weekNumber: 1 },
        { label: 'Week 3', weekNumber: 2 },
      ],
    };

    render(<SeasonTrendsChart data={dataWithUnranked} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders with team that has no color', () => {
    const dataNoColor: SeasonTrendsResponse = {
      season: 2024,
      teams: [
        {
          altColor: '',
          color: '',
          conference: 'Independent',
          logoURL: 'https://example.com/notre-dame.png',
          rankings: [
            { rank: 10, rating: 80.0, record: '5-2', weekNumber: 1 },
          ],
          teamName: 'Notre Dame',
        },
      ],
      weeks: [{ label: 'Week 2', weekNumber: 1 }],
    };

    render(<SeasonTrendsChart data={dataNoColor} />);

    expect(
      screen.getByRole('heading', { level: 2, name: '2024 Rank Progression' })
    ).toBeInTheDocument();
  });
});
