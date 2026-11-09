import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AlgorithmRunState } from '../../../hooks/use-algorithm-run-state';
import type { SubmittedMatchup } from '../../../hooks/use-experimental-matchup-state';
import type { ExperimentalMatchupResponse } from '../../../schemas/admin';

import { ExperimentalMatchupResults } from '../../../components/admin/experimental-matchup-results';

const IDLE = { error: null, result: null, status: 'idle' as const };

const submittedMatchup: SubmittedMatchup = {
  awayTeam: 'Florida',
  homeTeam: 'Notre Dame',
  neutralSite: false,
  season: 2024,
  week: 5,
};

const meeting = {
  awayPoints: 10,
  awayTeam: 'Florida',
  bettingOverUnder: null,
  bettingSpread: null,
  homePoints: 21,
  homeTeam: 'Notre Dame',
  neutralSite: false,
  playedAfterPrediction: false,
  seasonType: 'regular',
  week: 2,
};

function createRunState(
  overrides: Partial<AlgorithmRunState<ExperimentalMatchupResponse>>
): AlgorithmRunState<ExperimentalMatchupResponse> {
  return { V1: IDLE, V2: IDLE, ...overrides };
}

describe('ExperimentalMatchupResults', () => {
  it('renders nothing before a matchup has been submitted', () => {
    const { container } = render(
      <ExperimentalMatchupResults runState={createRunState({})} submittedMatchup={null} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a neutral-site heading with vs', () => {
    render(
      <ExperimentalMatchupResults
        runState={createRunState({ V2: { error: null, result: null, status: 'pending' } })}
        submittedMatchup={{ ...submittedMatchup, neutralSite: true }}
      />
    );

    expect(screen.getByText('Florida vs Notre Dame')).toBeInTheDocument();
    expect(screen.getByText('2024 Week 6 · Neutral site')).toBeInTheDocument();
  });

  it('shows only the versions that were run, side by side', () => {
    render(
      <ExperimentalMatchupResults
        runState={createRunState({
          V1: { error: null, result: { actualGames: [], algorithmVersion: 'V1', prediction: null }, status: 'success' },
          V2: { error: new Error('V2 boom'), result: null, status: 'error' },
        })}
        submittedMatchup={submittedMatchup}
      />
    );

    expect(screen.getByText('Florida at Notre Dame')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'V1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'V2' })).toBeInTheDocument();
    expect(screen.getByText('Insufficient data')).toBeInTheDocument();
    expect(screen.getByText('V2 boom')).toBeInTheDocument();
  });

  it('shows season meetings from the first completed version', () => {
    render(
      <ExperimentalMatchupResults
        runState={createRunState({
          V2: { error: null, result: { actualGames: [meeting], algorithmVersion: 'V2', prediction: null }, status: 'success' },
        })}
        submittedMatchup={submittedMatchup}
      />
    );

    expect(screen.queryByRole('heading', { name: 'V1' })).not.toBeInTheDocument();
    expect(screen.getByText('Season Meetings')).toBeInTheDocument();
    expect(screen.getByText('Florida 10 at Notre Dame 21')).toBeInTheDocument();
  });
});
