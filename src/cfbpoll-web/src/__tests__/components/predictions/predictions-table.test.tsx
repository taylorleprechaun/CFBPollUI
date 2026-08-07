import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { GamePredictionPublic } from '../../../schemas';

import { PredictionsTable } from '../../../components/predictions/predictions-table';

vi.mock('../../../components/predictions/prediction-card', () => ({
  PredictionCard: ({
    prediction,
    rankByTeam,
    season,
    showGrades,
  }: {
    prediction: GamePredictionPublic;
    rankByTeam?: Map<string, number>;
    season?: number | null;
    showGrades?: boolean;
  }) => (
    <div
      data-testid="prediction-card"
      data-away-team={prediction.awayTeam}
      data-home-team={prediction.homeTeam}
      data-season={String(season)}
      data-show-grades={String(showGrades)}
      data-has-rank-by-team={String(rankByTeam !== undefined)}
    />
  ),
}));

function buildPrediction(overrides: Partial<GamePredictionPublic> = {}): GamePredictionPublic {
  return {
    actualAwayScore: null,
    actualHomeScore: null,
    actualOverUnderResult: null,
    actualSpreadCoveringTeam: null,
    actualWinner: null,
    awayLogoURL: 'https://example.com/away.png',
    awayTeam: 'Michigan',
    awayTeamScore: 17,
    bettingOverUnder: 45.5,
    bettingSpread: -3.5,
    homeLogoURL: 'https://example.com/home.png',
    homeTeam: 'Ohio State',
    homeTeamScore: 28,
    myOverUnderPick: 'Over',
    mySpreadPick: 'Ohio State',
    neutralSite: false,
    overUnderGrade: 'Ungraded',
    predictedMargin: 11,
    predictedWinner: 'Ohio State',
    spreadGrade: 'Ungraded',
    winnerGrade: 'Ungraded',
    ...overrides,
  };
}

describe('PredictionsTable', () => {
  it('renders a loading skeleton instead of the table when isLoading is true', () => {
    render(<PredictionsTable predictions={[buildPrediction()]} isLoading />);

    expect(screen.queryByText('Score')).not.toBeInTheDocument();
    expect(screen.queryByText('Ohio State')).not.toBeInTheDocument();
  });

  it('renders a row per prediction', () => {
    render(
      <PredictionsTable
        predictions={[
          buildPrediction(),
          buildPrediction({ homeTeam: 'Iowa', awayTeam: 'Nebraska', predictedWinner: 'Iowa', mySpreadPick: 'Iowa' }),
        ]}
      />
    );

    expect(screen.getAllByText('Ohio State').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Iowa').length).toBeGreaterThan(0);
    expect(screen.getByText('Nebraska')).toBeInTheDocument();
  });

  it('renders distinct headers for the spread pick and over/under pick columns', () => {
    render(<PredictionsTable predictions={[buildPrediction()]} />);

    expect(screen.getByText('Spread Pick')).toBeInTheDocument();
    expect(screen.getByText('O/U Pick')).toBeInTheDocument();
  });

  it('renders empty table when no predictions provided', () => {
    render(<PredictionsTable predictions={[]} />);

    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.queryByText('Ohio State')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('prediction-card')).toHaveLength(0);
  });

  it('renders N/A when no betting line is available', () => {
    render(
      <PredictionsTable
        predictions={[buildPrediction({ bettingSpread: null, bettingOverUnder: null, mySpreadPick: '', myOverUnderPick: '' })]}
      />
    );

    const naCells = screen.getAllByText('N/A');
    expect(naCells.length).toBeGreaterThan(0);
  });

  it('renders neutral site indicator', () => {
    render(<PredictionsTable predictions={[buildPrediction({ neutralSite: true })]} />);

    expect(screen.getByText('(N)')).toBeInTheDocument();
  });

  it('renders predicted winner and scores', () => {
    render(<PredictionsTable predictions={[buildPrediction()]} />);

    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
  });

  it('renders spread and over/under picks', () => {
    render(<PredictionsTable predictions={[buildPrediction()]} />);

    expect(screen.getByText('Ohio State -3.5')).toBeInTheDocument();
    expect(screen.getByText('Over')).toBeInTheDocument();
    expect(screen.getByText('45.5')).toBeInTheDocument();
  });

  it('renders the table when isLoading is false', () => {
    render(<PredictionsTable predictions={[buildPrediction()]} isLoading={false} />);

    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('wraps the table in a horizontally scrollable container hidden below the md breakpoint', () => {
    const { container } = render(<PredictionsTable predictions={[buildPrediction()]} />);

    expect(container.querySelector('.hidden.md\\:block.overflow-x-auto table')).toBeInTheDocument();
  });

  describe('graded display', () => {
    const gradedPrediction = buildPrediction({
      actualAwayScore: 17,
      actualHomeScore: 28,
      actualOverUnderResult: 'Under',
      actualSpreadCoveringTeam: 'Ohio State',
      actualWinner: 'Ohio State',
      overUnderGrade: 'Correct',
      spreadGrade: 'Correct',
      winnerGrade: 'Correct',
    });

    it('does not apply grading styles when showGrades is false', () => {
      render(<PredictionsTable predictions={[gradedPrediction]} showGrades={false} />);

      expect(screen.queryByText(/Final:/)).not.toBeInTheDocument();
      for (const el of screen.getAllByText('Ohio State')) {
        expect(el.className).not.toContain('bg-green-100');
        expect(el.className).not.toContain('rounded-lg');
      }
    });

    it('highlights a correct spread pick in green with no actual-value line', () => {
      render(<PredictionsTable predictions={[gradedPrediction]} showGrades={true} />);

      const picks = screen.getAllByText('Ohio State', { selector: 'span.font-semibold' });
      const spreadPick = picks.find((el) => el.closest('div')?.className.includes('rounded-lg'));
      expect(spreadPick).toBeDefined();
      expect(spreadPick!.closest('div')?.className).toContain('bg-green-100');
      expect(screen.queryByText(/Correct:/)).not.toBeInTheDocument();
    });

    it('highlights a correct winner pick in green', () => {
      render(<PredictionsTable predictions={[gradedPrediction]} showGrades={true} />);

      const winner = screen.getByText('Ohio State', { selector: 'span.rounded-lg' });
      expect(winner.className).toContain('bg-green-100');
    });

    it('highlights a NotApplicable over/under grade in gray', () => {
      const prediction = buildPrediction({
        bettingOverUnder: null,
        myOverUnderPick: '',
        overUnderGrade: 'NotApplicable',
      });

      render(<PredictionsTable predictions={[prediction]} showGrades={true} />);

      const pick = screen.getByText('N/A', { selector: 'span.font-semibold' });
      expect(pick.closest('div')?.className).toContain('bg-gray-100');
    });

    it('highlights a Push spread grade in gray', () => {
      const prediction = buildPrediction({
        actualSpreadCoveringTeam: 'Push',
        spreadGrade: 'Push',
      });

      render(<PredictionsTable predictions={[prediction]} showGrades={true} />);

      const picks = screen.getAllByText('Ohio State', { selector: 'span.font-semibold' });
      const spreadPick = picks.find((el) => el.closest('div')?.className.includes('rounded-lg'));
      expect(spreadPick).toBeDefined();
      expect(spreadPick!.closest('div')?.className).toContain('bg-gray-100');
    });

    it('highlights an incorrect over/under pick in red and shows the actual result', () => {
      const prediction = buildPrediction({
        actualOverUnderResult: 'Under',
        overUnderGrade: 'Incorrect',
      });

      render(<PredictionsTable predictions={[prediction]} showGrades={true} />);

      expect(screen.getByText('Correct: Under')).toBeInTheDocument();
    });

    it('highlights an incorrect spread pick in red and shows the covering team', () => {
      const prediction = buildPrediction({
        actualSpreadCoveringTeam: 'Michigan',
        spreadGrade: 'Incorrect',
      });

      render(<PredictionsTable predictions={[prediction]} showGrades={true} />);

      expect(screen.getByText('Correct: Michigan')).toBeInTheDocument();
    });

    it('highlights an incorrect winner pick in red and shows the actual winner', () => {
      const prediction = buildPrediction({
        actualWinner: 'Michigan',
        winnerGrade: 'Incorrect',
      });

      render(<PredictionsTable predictions={[prediction]} showGrades={true} />);

      const winner = screen.getByText('Ohio State', { selector: 'span.rounded-lg' });
      expect(winner.className).toContain('bg-red-100');
      expect(screen.getByText('Actual: Michigan')).toBeInTheDocument();
    });

    it('shows the final score when showGrades is true', () => {
      render(<PredictionsTable predictions={[gradedPrediction]} showGrades={true} />);

      expect(screen.getByText((_, element) => element?.textContent === 'Final: 17-28')).toBeInTheDocument();
    });
  });

  describe('inline rank badge', () => {
    it('does not show a rank badge for a team absent from rankByTeam', () => {
      const rankByTeam = new Map([['ohio state', 3]]);

      render(
        <MemoryRouter>
          <PredictionsTable predictions={[buildPrediction()]} season={2024} rankByTeam={rankByTeam} />
        </MemoryRouter>
      );

      const awayLink = screen.getByRole('link', { name: 'Michigan' });
      expect(awayLink.textContent).toBe('Michigan');
    });

    it('does not show a rank badge for a team ranked outside the top 25', () => {
      const rankByTeam = new Map([['ohio state', 30]]);

      render(
        <MemoryRouter>
          <PredictionsTable predictions={[buildPrediction()]} season={2024} rankByTeam={rankByTeam} />
        </MemoryRouter>
      );

      const homeLinks = screen.getAllByRole('link', { name: 'Ohio State' });
      expect(homeLinks.length).toBeGreaterThan(0);
    });

    it('does not show a rank badge when rankByTeam is omitted', () => {
      render(
        <MemoryRouter>
          <PredictionsTable predictions={[buildPrediction()]} season={2024} />
        </MemoryRouter>
      );

      const homeLinks = screen.getAllByRole('link', { name: 'Ohio State' });
      expect(homeLinks.length).toBeGreaterThan(0);
    });

    it('shows a rank badge for a team present in rankByTeam and ranked in the top 25', () => {
      const rankByTeam = new Map([['ohio state', 3]]);

      render(
        <MemoryRouter>
          <PredictionsTable predictions={[buildPrediction()]} season={2024} rankByTeam={rankByTeam} />
        </MemoryRouter>
      );

      const homeLinks = screen.getAllByRole('link', { name: /Ohio State/ });
      for (const link of homeLinks) {
        expect(link.textContent).toBe('#3 Ohio State');
      }
    });
  });

  describe('mobile card list', () => {
    it('passes season, showGrades, and rankByTeam through to each card', () => {
      const rankByTeam = new Map([['ohio state', 3]]);

      render(
        <MemoryRouter>
          <PredictionsTable
            predictions={[buildPrediction()]}
            season={2024}
            showGrades={true}
            rankByTeam={rankByTeam}
          />
        </MemoryRouter>
      );

      const card = screen.getByTestId('prediction-card');
      expect(card).toHaveAttribute('data-season', '2024');
      expect(card).toHaveAttribute('data-show-grades', 'true');
      expect(card).toHaveAttribute('data-has-rank-by-team', 'true');
    });

    it('renders one PredictionCard per prediction', () => {
      render(
        <PredictionsTable
          predictions={[buildPrediction(), buildPrediction({ homeTeam: 'Iowa', awayTeam: 'Nebraska' })]}
        />
      );

      expect(screen.getAllByTestId('prediction-card')).toHaveLength(2);
    });
  });

  describe('team name links', () => {
    it('renders team names as links to team-details when season is provided', () => {
      render(
        <MemoryRouter>
          <PredictionsTable predictions={[buildPrediction()]} season={2024} />
        </MemoryRouter>
      );

      const homeLinks = screen.getAllByRole('link', { name: 'Ohio State' });
      expect(homeLinks.length).toBeGreaterThanOrEqual(1);
      for (const link of homeLinks) {
        expect(link).toHaveAttribute(
          'href',
          `/team-details?team=${encodeURIComponent('Ohio State')}&season=2024`
        );
      }

      const awayLink = screen.getByRole('link', { name: 'Michigan' });
      expect(awayLink).toHaveAttribute(
        'href',
        `/team-details?team=${encodeURIComponent('Michigan')}&season=2024`
      );
    });

    it('renders team names as plain text when season is omitted', () => {
      render(<PredictionsTable predictions={[buildPrediction()]} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getAllByText('Ohio State').length).toBeGreaterThan(0);
      expect(screen.getByText('Michigan')).toBeInTheDocument();
    });

    it('renders the predicted winner as a link, preserving grade pill styling', () => {
      const gradedPrediction = buildPrediction({
        overUnderGrade: 'Correct',
        spreadGrade: 'Correct',
        winnerGrade: 'Correct',
      });

      render(
        <MemoryRouter>
          <PredictionsTable predictions={[gradedPrediction]} season={2024} showGrades={true} />
        </MemoryRouter>
      );

      const winnerLink = screen.getAllByRole('link', { name: 'Ohio State' }).find((el) => el.className.includes('rounded-lg'));
      expect(winnerLink).toBeDefined();
      expect(winnerLink).toHaveAttribute(
        'href',
        `/team-details?team=${encodeURIComponent('Ohio State')}&season=2024`
      );
      expect(winnerLink!.className).toContain('bg-green-100');
    });
  });
});
