import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { MatchupActualGame } from '../../../schemas/admin';

import { MatchupSeasonMeetings } from '../../../components/admin/matchup-season-meetings';

function createGame(overrides: Partial<MatchupActualGame> = {}): MatchupActualGame {
  return {
    awayPoints: 17,
    awayTeam: 'Nebraska',
    bettingOverUnder: 47.5,
    bettingSpread: -3.5,
    homePoints: 24,
    homeTeam: 'USC',
    neutralSite: false,
    playedAfterPrediction: false,
    seasonType: 'regular',
    week: 3,
    ...overrides,
  };
}

describe('MatchupSeasonMeetings', () => {
  it('labels postseason games as Postseason', () => {
    render(<MatchupSeasonMeetings games={[createGame({ neutralSite: true, seasonType: 'postseason', week: 1 })]} />);

    expect(screen.getByText('Postseason')).toBeInTheDocument();
    expect(screen.getByText('Nebraska 17 vs USC 24')).toBeInTheDocument();
  });

  it('marks games played after the prediction as muted', () => {
    render(<MatchupSeasonMeetings games={[createGame(), createGame({ playedAfterPrediction: true, week: 11 })]} />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).not.toHaveClass('opacity-60');
    expect(items[1]).toHaveClass('opacity-60');
    expect(screen.getAllByText('(after prediction)')).toHaveLength(1);
  });

  it('renders each meeting with its week, score, spread, and over/under', () => {
    render(<MatchupSeasonMeetings games={[createGame()]} />);

    expect(screen.getByText('Season Meetings')).toBeInTheDocument();
    expect(screen.getByText('Week 3')).toBeInTheDocument();
    expect(screen.getByText('Nebraska 17 at USC 24')).toBeInTheDocument();
    expect(screen.getByText('Spread: USC -3.5 · O/U: 47.5')).toBeInTheDocument();
  });

  it('renders nothing when there are no meetings', () => {
    const { container } = render(<MatchupSeasonMeetings games={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows N/A when a meeting has no line', () => {
    render(<MatchupSeasonMeetings games={[createGame({ bettingOverUnder: null, bettingSpread: null })]} />);

    expect(screen.getByText('Spread: N/A · O/U: N/A')).toBeInTheDocument();
  });
});
