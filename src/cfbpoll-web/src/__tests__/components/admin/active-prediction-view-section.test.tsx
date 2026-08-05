import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivePredictionViewSection } from '../../../components/admin/active-prediction-view-section';
import type { ActivePredictionView } from '../../../hooks/use-predictions-active-view';

function buildView(overrides: Partial<ActivePredictionView> = {}): ActivePredictionView {
  return {
    isGraded: false,
    isPersisted: true,
    isPublished: false,
    predictions: {
      isGraded: false,
      predictions: [
        {
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
        },
      ],
      resultsPublished: false,
      season: 2024,
      week: 5,
    },
    resultsPublished: false,
    season: 2024,
    source: 'calculated',
    unmatchedGameCount: null,
    week: 5,
    ...overrides,
  };
}

function defaultProps() {
  return {
    gradeFeedback: null,
    isActionPending: false,
    isGrading: false,
    onClearGradeFeedback: vi.fn(),
    onClearPublishFeedback: vi.fn(),
    onClearPublishResultsFeedback: vi.fn(),
    onGrade: vi.fn(),
    onPublish: vi.fn(),
    onPublishResults: vi.fn(),
    publishFeedback: null,
    publishResultsFeedback: null,
    view: buildView(),
  };
}

describe('ActivePredictionViewSection', () => {
  it('renders the season, week, and game count', () => {
    render(<ActivePredictionViewSection {...defaultProps()} />);

    expect(screen.getByText(/2024/)).toBeInTheDocument();
    expect(screen.getByText('(1 game)')).toBeInTheDocument();
  });

  it('shows a source label for a calculated view', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ source: 'calculated' })} />);

    expect(screen.getByText(/Just Generated/)).toBeInTheDocument();
  });

  it('shows a source label for a graded view', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ source: 'graded' })} />);

    expect(screen.getByText(/Just Graded/)).toBeInTheDocument();
  });

  it('shows no source label for a viewed (persisted) week', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ source: 'viewed' })} />);

    expect(screen.queryByText(/Just Generated/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Just Graded/)).not.toBeInTheDocument();
  });

  it('shows a Draft stage badge for an unpublished, ungraded view', () => {
    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        view={buildView({ isGraded: false, isPublished: false, resultsPublished: false })}
      />
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows a Picks Published stage badge once published but not yet graded', () => {
    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        view={buildView({ isGraded: false, isPublished: true, resultsPublished: false })}
      />
    );

    expect(screen.getByText('Picks Published')).toBeInTheDocument();
  });

  it('shows a Graded stage badge once graded but results are not yet published', () => {
    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        view={buildView({ isGraded: true, isPublished: true, resultsPublished: false })}
      />
    );

    expect(screen.getByText('Graded')).toBeInTheDocument();
  });

  it('shows a Results Published stage badge once results are published', () => {
    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        view={buildView({ isGraded: true, isPublished: true, resultsPublished: true })}
      />
    );

    expect(screen.getByText('Results Published')).toBeInTheDocument();
  });

  it('shows a not-persisted warning when isPersisted is false', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ isPersisted: false })} />);

    expect(screen.getByText(/Warning: Predictions were not persisted/)).toBeInTheDocument();
  });

  it('does not show a not-persisted warning when isPersisted is true or null', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ isPersisted: true })} />);

    expect(screen.queryByText(/Warning: Predictions were not persisted/)).not.toBeInTheDocument();
  });

  it('shows an unmatched games banner when unmatchedGameCount is greater than zero', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ unmatchedGameCount: 2 })} />);

    expect(screen.getByText('Unmatched games: 2')).toBeInTheDocument();
  });

  it('does not show an unmatched games banner when unmatchedGameCount is zero or null', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ unmatchedGameCount: null })} />);

    expect(screen.queryByText(/Unmatched games:/)).not.toBeInTheDocument();
  });

  it('shows Publish for a calculated view', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ source: 'calculated' })} />);

    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish Results' })).not.toBeInTheDocument();
  });

  it('shows Publish Results for a graded, published, not-yet-results-published view', () => {
    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        view={buildView({ source: 'graded', isGraded: true, isPublished: true, resultsPublished: false })}
      />
    );

    expect(screen.getByRole('button', { name: 'Publish Results' })).toBeInTheDocument();
  });

  it('does not revive Publish when grading a week whose picks are already published (regression)', () => {
    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        view={buildView({ source: 'graded', isGraded: true, isPublished: true, resultsPublished: false })}
      />
    );

    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish Results' })).toBeInTheDocument();
  });

  it('does not show Publish Results for a freshly-calculated (ungraded) view even though its label reads "graded" source', () => {
    // Guards against re-introducing the old "source === 'graded' shows the button unconditionally"
    // logic - Publish Results must depend on isGraded/isPublished/resultsPublished, not source.
    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        view={buildView({ source: 'graded', isGraded: false, isPublished: true, resultsPublished: false })}
      />
    );

    expect(screen.queryByRole('button', { name: 'Publish Results' })).not.toBeInTheDocument();
  });

  it('shows Grade for an ungraded view', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ isGraded: false })} />);

    expect(screen.getByRole('button', { name: 'Grade' })).toBeInTheDocument();
  });

  it('does not show Grade for an already-graded view', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ isGraded: true, isPublished: true })} />);

    expect(screen.queryByRole('button', { name: 'Grade' })).not.toBeInTheDocument();
  });

  it('shows a Grading... label while isGrading is true', () => {
    render(<ActivePredictionViewSection {...defaultProps()} isGrading={true} view={buildView({ isGraded: false })} />);

    expect(screen.getByRole('button', { name: 'Grading...' })).toBeInTheDocument();
  });

  it('calls onGrade with season and week when Grade is clicked', async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn();

    render(<ActivePredictionViewSection {...defaultProps()} onGrade={onGrade} view={buildView({ isGraded: false })} />);
    await user.click(screen.getByRole('button', { name: 'Grade' }));

    expect(onGrade).toHaveBeenCalledWith(2024, 5);
  });

  it('for a viewed week that is unpublished, shows Publish but not Publish Results', () => {
    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        view={buildView({ source: 'viewed', isPublished: false, isGraded: false })}
      />
    );

    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish Results' })).not.toBeInTheDocument();
  });

  it('for a viewed week that is published, graded, and not results-published, shows Publish Results but not Publish', () => {
    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        view={buildView({ source: 'viewed', isPublished: true, isGraded: true, resultsPublished: false })}
      />
    );

    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish Results' })).toBeInTheDocument();
  });

  it('for a viewed week whose results are already published, shows neither button', () => {
    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        view={buildView({ source: 'viewed', isPublished: true, isGraded: true, resultsPublished: true })}
      />
    );

    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish Results' })).not.toBeInTheDocument();
  });

  it('calls onPublish with season and week when Publish is clicked', async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn();

    render(<ActivePredictionViewSection {...defaultProps()} onPublish={onPublish} view={buildView({ source: 'calculated' })} />);
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(onPublish).toHaveBeenCalledWith(2024, 5);
  });

  it('calls onPublishResults with season and week when Publish Results is clicked', async () => {
    const user = userEvent.setup();
    const onPublishResults = vi.fn();

    render(
      <ActivePredictionViewSection
        {...defaultProps()}
        onPublishResults={onPublishResults}
        view={buildView({ source: 'graded', isGraded: true, isPublished: true, resultsPublished: false })}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Publish Results' }));

    expect(onPublishResults).toHaveBeenCalledWith(2024, 5);
  });

  it('renders the predictions table with grade pills shown when isGraded is true', () => {
    render(<ActivePredictionViewSection {...defaultProps()} view={buildView({ isGraded: true, source: 'graded' })} />);

    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('collapses and expands the table when the header is clicked', async () => {
    const user = userEvent.setup();
    render(<ActivePredictionViewSection {...defaultProps()} />);

    expect(screen.getAllByText('Ohio State').length).toBeGreaterThan(0);

    const headerButton = screen.getByText('(1 game)').closest('button');
    expect(headerButton).toBeTruthy();
    await user.click(headerButton!);
    await user.click(headerButton!);

    expect(screen.getAllByText('Ohio State').length).toBeGreaterThan(0);
  });

  it('toggles aria-expanded on the header button and points aria-controls at the content region', async () => {
    const user = userEvent.setup();
    render(<ActivePredictionViewSection {...defaultProps()} />);

    const headerButton = screen.getByText('(1 game)').closest('button')!;
    expect(headerButton).toHaveAttribute('aria-expanded', 'true');

    const contentId = headerButton.getAttribute('aria-controls');
    expect(contentId).toBeTruthy();
    expect(document.getElementById(contentId!)).not.toBeNull();

    await user.click(headerButton);
    expect(headerButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(headerButton);
    expect(headerButton).toHaveAttribute('aria-expanded', 'true');
  });
});
