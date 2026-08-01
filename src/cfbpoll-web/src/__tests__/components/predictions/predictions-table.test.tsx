import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PredictionsTable } from '../../../components/predictions/predictions-table';
import type { GamePredictionPublic } from '../../../schemas';

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

  it('renders empty table when no predictions provided', () => {
    render(<PredictionsTable predictions={[]} />);

    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.queryByText('Ohio State')).not.toBeInTheDocument();
  });

  it('renders distinct headers for the spread pick and over/under pick columns', () => {
    render(<PredictionsTable predictions={[buildPrediction()]} />);

    expect(screen.getByText('Spread Pick')).toBeInTheDocument();
    expect(screen.getByText('O/U Pick')).toBeInTheDocument();
  });

  it('renders a loading skeleton instead of the table when isLoading is true', () => {
    render(<PredictionsTable predictions={[buildPrediction()]} isLoading />);

    expect(screen.queryByText('Score')).not.toBeInTheDocument();
    expect(screen.queryByText('Ohio State')).not.toBeInTheDocument();
  });

  it('renders the table when isLoading is false', () => {
    render(<PredictionsTable predictions={[buildPrediction()]} isLoading={false} />);

    expect(screen.getByText('Score')).toBeInTheDocument();
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

    it('shows the final score when showGrades is true', () => {
      render(<PredictionsTable predictions={[gradedPrediction]} showGrades={true} />);

      expect(screen.getByText((_, element) => element?.textContent === 'Final: 17-28')).toBeInTheDocument();
    });

    it('highlights a correct winner pick in green', () => {
      render(<PredictionsTable predictions={[gradedPrediction]} showGrades={true} />);

      const winner = screen.getByText('Ohio State', { selector: 'span.rounded-lg' });
      expect(winner.className).toContain('bg-green-100');
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

    it('highlights a correct spread pick in green with no actual-value line', () => {
      render(<PredictionsTable predictions={[gradedPrediction]} showGrades={true} />);

      const picks = screen.getAllByText('Ohio State', { selector: 'span.font-semibold' });
      const spreadPick = picks.find((el) => el.closest('div')?.className.includes('rounded-lg'));
      expect(spreadPick).toBeDefined();
      expect(spreadPick!.closest('div')?.className).toContain('bg-green-100');
      expect(screen.queryByText(/Correct:/)).not.toBeInTheDocument();
    });

    it('highlights an incorrect spread pick in red and shows the covering team', () => {
      const prediction = buildPrediction({
        actualSpreadCoveringTeam: 'Michigan',
        spreadGrade: 'Incorrect',
      });

      render(<PredictionsTable predictions={[prediction]} showGrades={true} />);

      expect(screen.getByText('Correct: Michigan')).toBeInTheDocument();
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

    it('highlights an incorrect over/under pick in red and shows the actual result', () => {
      const prediction = buildPrediction({
        actualOverUnderResult: 'Under',
        overUnderGrade: 'Incorrect',
      });

      render(<PredictionsTable predictions={[prediction]} showGrades={true} />);

      expect(screen.getByText('Correct: Under')).toBeInTheDocument();
    });
  });
});
