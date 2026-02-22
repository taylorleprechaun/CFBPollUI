import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordRow } from '../../../components/team-details/record-row';
import type { ScheduleGame, TeamRecord } from '../../../types';

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
    seasonType: 'regular',
    startTimeTbd: false,
    teamScore: 28,
    venue: 'Stadium',
    week: 1,
    ...overrides,
  };
}

describe('RecordRow', () => {
  const containerRef = createRef<HTMLDivElement>();

  function renderWithContainer(props: {
    filter: (g: ScheduleGame) => boolean;
    label: string;
    record: TeamRecord;
    schedule: ScheduleGame[];
  }) {
    return render(
      <div ref={containerRef}>
        <RecordRow containerRef={containerRef} {...props} />
      </div>
    );
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders record as a button when there are games', () => {
    renderWithContainer({
      label: 'Home',
      record: { wins: 3, losses: 1 },
      schedule: [createGame()],
      filter: () => true,
    });

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('3-1')).toBeInTheDocument();
  });

  it('renders a dash when there are no games', () => {
    renderWithContainer({
      label: 'Away',
      record: { wins: 0, losses: 0 },
      schedule: [],
      filter: () => true,
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('calls scrollIntoView when expanding', () => {
    const mockScrollIntoView = vi.fn();
    const mockRaf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    renderWithContainer({
      label: 'Home',
      record: { wins: 2, losses: 0 },
      schedule: [createGame()],
      filter: () => true,
    });

    const container = containerRef.current!;
    container.scrollIntoView = mockScrollIntoView;

    fireEvent.click(screen.getByRole('button'));

    expect(mockRaf).toHaveBeenCalled();
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });

    mockRaf.mockRestore();
  });

  it('does not call scrollIntoView when collapsing', () => {
    const mockScrollIntoView = vi.fn();
    const mockRaf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    renderWithContainer({
      label: 'Home',
      record: { wins: 2, losses: 0 },
      schedule: [createGame()],
      filter: () => true,
    });

    const container = containerRef.current!;
    container.scrollIntoView = mockScrollIntoView;

    fireEvent.click(screen.getByRole('button'));
    mockScrollIntoView.mockClear();
    mockRaf.mockClear();

    fireEvent.click(screen.getByRole('button'));

    expect(mockScrollIntoView).not.toHaveBeenCalled();

    mockRaf.mockRestore();
  });

  it('shows matching games when expanded', () => {
    const games = [
      createGame({ opponentName: 'Florida', week: 1 }),
      createGame({ opponentName: 'Texas', week: 2 }),
    ];

    renderWithContainer({
      label: 'Home',
      record: { wins: 2, losses: 0 },
      schedule: games,
      filter: () => true,
    });

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Florida')).toBeInTheDocument();
    expect(screen.getByText('Texas')).toBeInTheDocument();
  });

  it('does not expand when there are no games', () => {
    renderWithContainer({
      label: 'Neutral',
      record: { wins: 0, losses: 0 },
      schedule: [],
      filter: () => true,
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
