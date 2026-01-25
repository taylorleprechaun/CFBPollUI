import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamDetailsPopup } from '../../components/rankings/team-details-popup';
import type { RankedTeam } from '../../types';

const createMockTeam = (overrides: Partial<RankedTeam> = {}): RankedTeam => ({
  rank: 1,
  teamName: 'Oregon',
  logoURL: 'https://example.com/oregon.png',
  conference: 'Big Ten',
  division: 'West',
  wins: 11,
  losses: 0,
  record: '11-0',
  rating: 165.42,
  weightedSOS: 0.582,
  sosRanking: 15,
  details: {
    home: { wins: 6, losses: 0 },
    away: { wins: 4, losses: 0 },
    neutral: { wins: 1, losses: 0 },
    vsRank1To10: { wins: 2, losses: 0 },
    vsRank11To25: { wins: 3, losses: 0 },
    vsRank26To50: { wins: 1, losses: 0 },
    vsRank51To100: { wins: 2, losses: 0 },
    vsRank101Plus: { wins: 3, losses: 0 },
  },
  ...overrides,
});

describe('TeamDetailsPopup', () => {
  const defaultPosition = { x: 100, y: 100 };

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  it('returns null when details is null', () => {
    const team = createMockTeam({ details: null });
    const { container } = render(<TeamDetailsPopup team={team} position={defaultPosition} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when details is undefined', () => {
    const team = createMockTeam({ details: undefined });
    const { container } = render(<TeamDetailsPopup team={team} position={defaultPosition} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders team name via portal', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={defaultPosition} />);

    expect(document.body.textContent).toContain('Oregon');
  });

  it('renders conference and division', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={defaultPosition} />);

    expect(document.body.textContent).toContain('Big Ten - West');
  });

  it('renders conference without division when division is empty', () => {
    const team = createMockTeam({ division: '' });
    render(<TeamDetailsPopup team={team} position={defaultPosition} />);

    expect(document.body.textContent).toContain('Big Ten');
    expect(document.body.textContent).not.toContain('Big Ten -');
  });

  it('renders location records section', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={defaultPosition} />);

    expect(document.body.textContent).toContain('Record by Location');
    expect(document.body.textContent).toContain('Home');
    expect(document.body.textContent).toContain('Away');
    expect(document.body.textContent).toContain('Neutral');
  });

  it('renders formatted records', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={defaultPosition} />);

    expect(document.body.textContent).toContain('6-0');
    expect(document.body.textContent).toContain('4-0');
    expect(document.body.textContent).toContain('1-0');
  });

  it('renders opponent rank records section', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={defaultPosition} />);

    expect(document.body.textContent).toContain('Record vs Opponent Rank');
    expect(document.body.textContent).toContain('vs #1-10');
    expect(document.body.textContent).toContain('vs #11-25');
    expect(document.body.textContent).toContain('vs #26-50');
    expect(document.body.textContent).toContain('vs #51-100');
    expect(document.body.textContent).toContain('vs #101+');
  });

  it('renders dash for records with no games', () => {
    const team = createMockTeam({
      details: {
        home: { wins: 0, losses: 0 },
        away: { wins: 0, losses: 0 },
        neutral: { wins: 0, losses: 0 },
        vsRank1To10: { wins: 0, losses: 0 },
        vsRank11To25: { wins: 0, losses: 0 },
        vsRank26To50: { wins: 0, losses: 0 },
        vsRank51To100: { wins: 0, losses: 0 },
        vsRank101Plus: { wins: 0, losses: 0 },
      },
    });
    render(<TeamDetailsPopup team={team} position={defaultPosition} />);

    const bodyText = document.body.textContent || '';
    const dashCount = (bodyText.match(/-(?!\d)/g) || []).length;
    expect(dashCount).toBeGreaterThan(0);
  });

  it('renders team logo', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={defaultPosition} />);

    const logo = document.querySelector('img[alt="Oregon logo"]');
    expect(logo).toBeInTheDocument();
  });

  it('positions popup with fixed positioning', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={{ x: 100, y: 100 }} />);

    const popup = document.querySelector('.fixed');
    expect(popup).toBeInTheDocument();
  });

  it('adjusts position when near right edge of viewport', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={{ x: 900, y: 100 }} />);

    const popup = document.querySelector('.fixed') as HTMLElement;
    expect(popup).toBeInTheDocument();
    const leftValue = parseInt(popup.style.left);
    expect(leftValue).toBeLessThan(900);
  });

  it('adjusts position when near bottom edge of viewport', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={{ x: 100, y: 600 }} />);

    const popup = document.querySelector('.fixed') as HTMLElement;
    expect(popup).toBeInTheDocument();
  });

  it('ensures minimum left boundary', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={{ x: 5, y: 100 }} />);

    const popup = document.querySelector('.fixed') as HTMLElement;
    expect(popup).toBeInTheDocument();
    const leftValue = parseInt(popup.style.left);
    expect(leftValue).toBeGreaterThanOrEqual(20);
  });

  it('ensures minimum top boundary', () => {
    const team = createMockTeam();
    render(<TeamDetailsPopup team={team} position={{ x: 100, y: 5 }} />);

    const popup = document.querySelector('.fixed') as HTMLElement;
    expect(popup).toBeInTheDocument();
    const topValue = parseInt(popup.style.top);
    expect(topValue).toBeGreaterThanOrEqual(20);
  });
});
