import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PredictionCard } from '../../../components/predictions/prediction-card';
import type { GamePredictionPublic } from '../../../schemas';

function buildPrediction(overrides: Partial<GamePredictionPublic> = {}): GamePredictionPublic {
  return {
    actualAwayScore: null,
    actualHomeScore: null,
    actualOverUnderResult: null,
    actualSpreadCoveringTeam: null,
    actualWinner: null,
    awayLogoURL: 'https://example.com/away.png',
    awayTeam: 'Iowa',
    awayTeamScore: 17,
    bettingOverUnder: 45.5,
    bettingSpread: -3.5,
    homeLogoURL: 'https://example.com/home.png',
    homeTeam: 'Nebraska',
    homeTeamScore: 28,
    myOverUnderPick: 'Over',
    mySpreadPick: 'Nebraska',
    neutralSite: false,
    overUnderGrade: 'Ungraded',
    predictedMargin: 11,
    predictedWinner: 'Nebraska',
    spreadGrade: 'Ungraded',
    winnerGrade: 'Ungraded',
    ...overrides,
  };
}

describe('PredictionCard', () => {
  it('renders both teams with logos, names, and scores', () => {
    render(<PredictionCard prediction={buildPrediction()} />);

    expect(screen.getByText('Iowa')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
    // Nebraska is both the home team and the predicted winner, so it appears twice.
    expect(screen.getAllByText('Nebraska').length).toBeGreaterThan(0);
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('renders a neutral site indicator', () => {
    render(<PredictionCard prediction={buildPrediction({ neutralSite: true })} />);

    expect(screen.getByText('(N)')).toBeInTheDocument();
  });

  it('does not show the final score when showGrades is false', () => {
    render(
      <PredictionCard
        prediction={buildPrediction({ actualAwayScore: 17, actualHomeScore: 28 })}
        showGrades={false}
      />
    );

    expect(screen.queryByText(/Final:/)).not.toBeInTheDocument();
  });

  it('shows the final score when showGrades is true and actual scores are present', () => {
    render(
      <PredictionCard
        prediction={buildPrediction({ actualAwayScore: 17, actualHomeScore: 28 })}
        showGrades={true}
      />
    );

    expect(screen.getByText((_, element) => element?.textContent === 'Final: 17-28')).toBeInTheDocument();
  });

  it('shows labeled rows for Winner, Spread, and O/U, with the pick folded into each row', () => {
    render(<PredictionCard prediction={buildPrediction()} />);

    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('Spread')).toBeInTheDocument();
    expect(screen.getByText('O/U')).toBeInTheDocument();
    expect(screen.queryByText('Spread Pick')).not.toBeInTheDocument();
    expect(screen.queryByText('O/U Pick')).not.toBeInTheDocument();
  });

  it('renders the predicted winner name and formatted spread/over-under values with their picks', () => {
    render(<PredictionCard prediction={buildPrediction()} />);

    expect(screen.getAllByText('Nebraska').length).toBeGreaterThan(0);
    expect(screen.getByText('Nebraska -3.5')).toBeInTheDocument();
    expect(screen.getByText('45.5')).toBeInTheDocument();
    expect(screen.getByText('Pick: Over')).toBeInTheDocument();
  });

  it('uses the away team logo for the winner row when the away team is the predicted winner', () => {
    const prediction = buildPrediction({ predictedWinner: 'Iowa' });

    render(<PredictionCard prediction={prediction} />);

    // Iowa's logo now renders twice: once for its own away-team row, once for the winner row.
    const iowaLogos = screen.getAllByAltText('Iowa logo');
    expect(iowaLogos).toHaveLength(2);
    for (const logo of iowaLogos) {
      expect(logo).toHaveAttribute('src', prediction.awayLogoURL);
    }
  });

  it('renders N/A when no betting line is available', () => {
    render(
      <PredictionCard
        prediction={buildPrediction({ bettingSpread: null, bettingOverUnder: null, mySpreadPick: '', myOverUnderPick: '' })}
      />
    );

    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  describe('graded display', () => {
    it('does not apply grading pill styles when showGrades is false', () => {
      const prediction = buildPrediction({ winnerGrade: 'Correct' });

      render(<PredictionCard prediction={prediction} showGrades={false} />);

      for (const el of screen.getAllByText('Nebraska')) {
        expect(el.className).not.toContain('bg-green-100');
      }
    });

    it('highlights a correct winner pick in green', () => {
      const prediction = buildPrediction({ winnerGrade: 'Correct' });

      render(<PredictionCard prediction={prediction} showGrades={true} />);

      const winner = screen.getByText('Nebraska', { selector: 'span.rounded-lg' });
      expect(winner.className).toContain('bg-green-100');
    });

    it('highlights an incorrect winner pick in red and shows the actual winner', () => {
      const prediction = buildPrediction({ actualWinner: 'Iowa', winnerGrade: 'Incorrect' });

      render(<PredictionCard prediction={prediction} showGrades={true} />);

      const winner = screen.getByText('Nebraska', { selector: 'span.rounded-lg' });
      expect(winner.className).toContain('bg-red-100');
      expect(screen.getByText('Actual: Iowa')).toBeInTheDocument();
    });

    it('highlights a correct spread pick in green with no actual-value caption', () => {
      const prediction = buildPrediction({ spreadGrade: 'Correct', actualSpreadCoveringTeam: 'Nebraska' });

      render(<PredictionCard prediction={prediction} showGrades={true} />);

      // Nebraska also renders as the winner pill (also font-semibold); only the
      // GradedPick badge sits inside a div carrying rounded-lg.
      const picks = screen.getAllByText('Nebraska', { selector: 'span.font-semibold' });
      const spreadPick = picks.find((el) => el.closest('div')?.className.includes('rounded-lg'));
      expect(spreadPick).toBeDefined();
      expect(spreadPick!.closest('div')?.className).toContain('bg-green-100');
      expect(screen.queryByText(/Correct:/)).not.toBeInTheDocument();
    });

    it('highlights an incorrect spread pick in red and shows the covering team', () => {
      const prediction = buildPrediction({ spreadGrade: 'Incorrect', actualSpreadCoveringTeam: 'Iowa' });

      render(<PredictionCard prediction={prediction} showGrades={true} />);

      expect(screen.getByText('Correct: Iowa')).toBeInTheDocument();
    });

    it('highlights an incorrect over/under pick in red and shows the actual result', () => {
      const prediction = buildPrediction({ overUnderGrade: 'Incorrect', actualOverUnderResult: 'Under' });

      render(<PredictionCard prediction={prediction} showGrades={true} />);

      expect(screen.getByText('Correct: Under')).toBeInTheDocument();
    });
  });

  describe('team name links and rank badges', () => {
    it('renders team names as links to team-details when season is provided', () => {
      render(
        <MemoryRouter>
          <PredictionCard prediction={buildPrediction()} season={2024} />
        </MemoryRouter>
      );

      const awayLink = screen.getByRole('link', { name: 'Iowa' });
      expect(awayLink).toHaveAttribute('href', `/team-details?team=${encodeURIComponent('Iowa')}&season=2024`);
    });

    it('renders team names as plain text when season is omitted', () => {
      render(<PredictionCard prediction={buildPrediction()} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shows a rank badge for a team present in rankByTeam and ranked in the top 25', () => {
      const rankByTeam = new Map([['iowa', 3]]);

      render(
        <MemoryRouter>
          <PredictionCard prediction={buildPrediction()} season={2024} rankByTeam={rankByTeam} />
        </MemoryRouter>
      );

      const awayLink = screen.getByRole('link', { name: /Iowa/ });
      expect(awayLink.textContent).toBe('#3 Iowa');
    });

    it('does not show a rank badge for a team absent from rankByTeam', () => {
      const rankByTeam = new Map([['nebraska', 3]]);

      render(
        <MemoryRouter>
          <PredictionCard prediction={buildPrediction()} season={2024} rankByTeam={rankByTeam} />
        </MemoryRouter>
      );

      const awayLink = screen.getByRole('link', { name: 'Iowa' });
      expect(awayLink.textContent).toBe('Iowa');
    });
  });
});
