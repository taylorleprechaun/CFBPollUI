import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AlgorithmRunEntry } from '../../../hooks/use-algorithm-run-state';
import type { ExperimentalMatchupResponse } from '../../../schemas/admin';

import { MatchupVersionResult } from '../../../components/admin/matchup-version-result';

const prediction = {
  actualAwayScore: null,
  actualHomeScore: null,
  actualOverUnderResult: null,
  actualSpreadCoveringTeam: null,
  actualWinner: null,
  awayLogoURL: '',
  awayTeam: 'Michigan',
  awayTeamScore: 27,
  bettingOverUnder: null,
  bettingSpread: null,
  homeLogoURL: '',
  homeTeam: 'Oklahoma',
  homeTeamScore: 24,
  myOverUnderPick: '',
  mySpreadPick: '',
  neutralSite: false,
  overUnderGrade: 'Ungraded' as const,
  predictedMargin: 3,
  predictedWinner: 'Michigan',
  spreadGrade: 'Ungraded' as const,
  winnerGrade: 'Ungraded' as const,
};

function createEntry(
  overrides: Partial<AlgorithmRunEntry<ExperimentalMatchupResponse>>
): AlgorithmRunEntry<ExperimentalMatchupResponse> {
  return { error: null, result: null, status: 'idle', ...overrides };
}

describe('MatchupVersionResult', () => {
  it('renders nothing while idle', () => {
    const { container } = render(<MatchupVersionResult entry={createEntry({})} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a calculating placeholder while pending', () => {
    render(<MatchupVersionResult entry={createEntry({ status: 'pending' })} />);

    expect(screen.getByText('Calculating…')).toBeInTheDocument();
  });

  it('shows insufficient data when the version returned no prediction', () => {
    render(
      <MatchupVersionResult
        entry={createEntry({ result: { actualGames: [], algorithmVersion: 'V1', prediction: null }, status: 'success' })}
      />
    );

    expect(screen.getByText('Insufficient data')).toBeInTheDocument();
  });

  it('shows the error message when the version failed', () => {
    render(<MatchupVersionResult entry={createEntry({ error: new Error('V2 boom'), status: 'error' })} />);

    expect(screen.getByText('V2 boom')).toBeInTheDocument();
  });

  it('shows the predicted score when the version returned a prediction', () => {
    render(
      <MatchupVersionResult
        entry={createEntry({ result: { actualGames: [], algorithmVersion: 'V2', prediction }, status: 'success' })}
      />
    );

    expect(screen.getByText('27-24')).toBeInTheDocument();
    expect(screen.queryByText('Insufficient data')).not.toBeInTheDocument();
  });
});
