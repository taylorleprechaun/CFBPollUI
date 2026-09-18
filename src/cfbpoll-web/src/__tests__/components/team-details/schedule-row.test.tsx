import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { ScheduleGame } from '../../../types';

import { ScheduleRow } from '../../../components/team-details/schedule-row';

function createGame(overrides: Partial<ScheduleGame> = {}): ScheduleGame {
  return {
    gameDate: '2024-09-07',
    isHome: true,
    isWin: true,
    neutralSite: false,
    opponentLogoURL: 'https://example.com/logo.png',
    opponentName: 'Alabama',
    opponentRank: null,
    opponentRecord: '3-1',
    opponentScore: 14,
    originalOpponentScore: null,
    originalTeamScore: null,
    seasonType: 'regular',
    startTimeTbd: false,
    teamScore: 28,
    venue: 'Stadium',
    week: 1,
    ...overrides,
  };
}

function renderRow(game: ScheduleGame) {
  return render(
    <MemoryRouter>
      <table>
        <tbody>
          <ScheduleRow fbsTeamNames={new Set(['Alabama'])} game={game} onTeamClick={vi.fn()} selectedSeason={2024} />
        </tbody>
      </table>
    </MemoryRouter>
  );
}

describe('ScheduleRow', () => {
  it('does not render an info tooltip when there is no score override', () => {
    renderRow(createGame({ scoreOverrideReason: null }));

    expect(screen.queryByRole('button', { name: 'About Score override' })).not.toBeInTheDocument();
  });

  it('does not show a struck-through score when there is no score override', () => {
    renderRow(createGame({ scoreOverrideReason: null }));

    expect(screen.queryByText(/^\d+-\d+$/, { selector: '.line-through' })).not.toBeInTheDocument();
  });

  it('renders an info tooltip with the override reason when scoreOverrideReason is present', async () => {
    renderRow(createGame({
      scoreOverrideReason: 'A targeting call was missed on the game-deciding play.',
    }));

    await userEvent.click(screen.getByRole('button', { name: 'About Score override' }));

    expect(screen.getByText('A targeting call was missed on the game-deciding play.')).toBeInTheDocument();
  });

  it('shows the original score struck through when overridden', () => {
    renderRow(createGame({
      isWin: false,
      scoreOverrideReason: 'A targeting call was missed on the game-deciding play.',
      teamScore: 20,
      opponentScore: 24,
      originalTeamScore: 24,
      originalOpponentScore: 20,
    }));

    expect(screen.getByText('24-20')).toBeInTheDocument();
  });

  it('still renders the win/loss score next to the tooltip when overridden', () => {
    renderRow(createGame({
      isWin: false,
      scoreOverrideReason: 'A targeting call was missed on the game-deciding play.',
      teamScore: 20,
      opponentScore: 24,
    }));

    expect(screen.getByText('L 20-24')).toBeInTheDocument();
  });
});
