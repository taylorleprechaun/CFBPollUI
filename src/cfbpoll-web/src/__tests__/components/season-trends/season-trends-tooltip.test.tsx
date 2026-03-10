import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SeasonTrendsTooltip } from '../../../components/season-trends/season-trends-tooltip';
import type { SeasonTrendTeam, SeasonTrendWeek } from '../../../schemas';

const weeks: SeasonTrendWeek[] = [
  { label: 'Week 2', weekNumber: 1 },
  { label: 'Week 3', weekNumber: 2 },
];

const rankedTeam: SeasonTrendTeam = {
  altColor: '#FFFFFF',
  color: '#500000',
  conference: 'SEC',
  logoURL: 'https://example.com/texas.png',
  rankings: [
    { rank: 3, rating: 90.5, record: '7-1', weekNumber: 1 },
    { rank: null, rating: 0, record: '7-2', weekNumber: 2 },
  ],
  teamName: 'Texas',
};

describe('SeasonTrendsTooltip', () => {
  it('returns null when hoveredTeam is null', () => {
    const { container } = render(
      <SeasonTrendsTooltip activeWeek={1} hoveredTeam={null} weeks={weeks} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when activeWeek is null', () => {
    const { container } = render(
      <SeasonTrendsTooltip activeWeek={null} hoveredTeam={rankedTeam} weeks={weeks} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when no ranking matches the active week', () => {
    const { container } = render(
      <SeasonTrendsTooltip activeWeek={99} hoveredTeam={rankedTeam} weeks={weeks} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders team name and logo for a ranked week', () => {
    render(
      <SeasonTrendsTooltip activeWeek={1} hoveredTeam={rankedTeam} weeks={weeks} />
    );

    expect(screen.getByText('Texas')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Texas' })).toHaveAttribute('src', 'https://example.com/texas.png');
  });

  it('renders rank, rating, and record for a ranked week', () => {
    render(
      <SeasonTrendsTooltip activeWeek={1} hoveredTeam={rankedTeam} weeks={weeks} />
    );

    expect(screen.getByText('Rank: #3')).toBeInTheDocument();
    expect(screen.getByText('Rating: 90.50')).toBeInTheDocument();
    expect(screen.getByText('Record: 7-1')).toBeInTheDocument();
  });

  it('renders week label', () => {
    render(
      <SeasonTrendsTooltip activeWeek={1} hoveredTeam={rankedTeam} weeks={weeks} />
    );

    expect(screen.getByText('Week 2')).toBeInTheDocument();
  });

  it('renders unranked message when rank is null', () => {
    render(
      <SeasonTrendsTooltip activeWeek={2} hoveredTeam={rankedTeam} weeks={weeks} />
    );

    expect(screen.getByText('Unranked')).toBeInTheDocument();
    expect(screen.queryByText(/Rank:/)).not.toBeInTheDocument();
  });

  it('uses fallback week label when week is not found', () => {
    const teamWithExtraWeek: SeasonTrendTeam = {
      ...rankedTeam,
      rankings: [{ rank: 5, rating: 80.0, record: '6-2', weekNumber: 10 }],
    };

    render(
      <SeasonTrendsTooltip activeWeek={10} hoveredTeam={teamWithExtraWeek} weeks={weeks} />
    );

    expect(screen.getByText('Week 10')).toBeInTheDocument();
  });

  it('uses fallback background color when team has no color', () => {
    const noColorTeam: SeasonTrendTeam = {
      ...rankedTeam,
      color: '',
      teamName: 'Nebraska',
    };

    const { container } = render(
      <SeasonTrendsTooltip activeWeek={1} hoveredTeam={noColorTeam} weeks={weeks} />
    );

    const tooltip = container.firstChild as HTMLElement;
    expect(tooltip.style.backgroundColor).toBe('rgb(55, 65, 81)');
  });

  it('applies team color as background', () => {
    const { container } = render(
      <SeasonTrendsTooltip activeWeek={1} hoveredTeam={rankedTeam} weeks={weeks} />
    );

    const tooltip = container.firstChild as HTMLElement;
    expect(tooltip.style.backgroundColor).toBe('rgb(80, 0, 0)');
  });
});
