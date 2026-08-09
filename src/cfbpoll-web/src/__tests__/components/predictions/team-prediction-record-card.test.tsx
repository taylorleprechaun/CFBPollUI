import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { TeamPredictionRecord } from '../../../types';

import { TeamPredictionRecordCard } from '../../../components/predictions/team-prediction-record-card';

function buildRecord(overrides: Partial<TeamPredictionRecord> = {}): TeamPredictionRecord {
  return {
    actualLosses: 3,
    actualWins: 7,
    gradedGameCount: 10,
    logoURL: 'https://example.com/logo.png',
    predictedLosses: 2,
    predictedWins: 8,
    teamName: 'Michigan',
    ...overrides,
  };
}

function renderCard(record: TeamPredictionRecord, season = 2024) {
  return render(
    <MemoryRouter>
      <TeamPredictionRecordCard record={record} season={season} />
    </MemoryRouter>
  );
}

describe('TeamPredictionRecordCard', () => {
  it('links the team name to team-details with the given season', () => {
    renderCard(buildRecord({ teamName: 'Iowa' }), 2023);

    const link = screen.getByRole('link', { name: 'Iowa' });
    expect(link).toHaveAttribute('href', `/team-details?team=${encodeURIComponent('Iowa')}&season=2023`);
  });

  it('renders a green delta badge for a close prediction', () => {
    renderCard(buildRecord({ predictedWins: 8, actualWins: 8 }));

    const delta = screen.getByText('0');
    expect(delta.className).toContain('bg-green-100');
  });

  it('renders a negative delta with its sign', () => {
    renderCard(buildRecord({ predictedWins: 8, actualWins: 7 }));

    expect(screen.getByText('-1')).toBeInTheDocument();
  });

  it('renders a red delta badge for a large miss', () => {
    renderCard(buildRecord({ predictedWins: 4, actualWins: 9 }));

    const delta = screen.getByText('+5');
    expect(delta.className).toContain('bg-red-100');
  });

  it('renders a yellow delta badge for a moderate miss', () => {
    renderCard(buildRecord({ predictedWins: 5, actualWins: 8 }));

    const delta = screen.getByText('+3');
    expect(delta.className).toContain('bg-yellow-100');
  });

  it('renders the predicted and actual records', () => {
    renderCard(buildRecord({ predictedWins: 8, predictedLosses: 2, actualWins: 7, actualLosses: 3 }));

    expect(screen.getByText('Predicted Record')).toBeInTheDocument();
    expect(screen.getByText('8-2')).toBeInTheDocument();
    expect(screen.getByText('Actual Record')).toBeInTheDocument();
    expect(screen.getByText('7-3')).toBeInTheDocument();
  });
});
