import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PredictionsTable } from '../../../components/predictions/predictions-table';
import type { GamePredictionPublic } from '../../../schemas';

function buildPrediction(overrides: Partial<GamePredictionPublic> = {}): GamePredictionPublic {
  return {
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
    predictedMargin: 11,
    predictedWinner: 'Ohio State',
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
});
