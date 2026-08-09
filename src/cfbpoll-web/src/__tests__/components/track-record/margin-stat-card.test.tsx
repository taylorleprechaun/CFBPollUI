import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { MarginStatCard } from '../../../components/track-record/margin-stat-card';
import { TRACK_RECORD_STAT_INFO } from '../../../lib/track-record-stat-info';

describe('MarginStatCard', () => {
  it('colors the value when classes is provided', () => {
    render(<MarginStatCard label="Margin RMSE" value="8.3 pts" classes="bg-green-100 text-green-800" />);

    expect(screen.getByText('8.3 pts')).toHaveClass('bg-green-100');
  });

  it('renders no info button when statInfo is omitted', () => {
    render(<MarginStatCard label="Margin RMSE" value="8.3 pts" />);

    expect(screen.queryByRole('button', { name: 'About Margin RMSE' })).not.toBeInTheDocument();
  });

  it('renders the info button with the correct aria-label when statInfo is provided', () => {
    render(
      <MemoryRouter>
        <MarginStatCard label="Margin RMSE" value="8.3 pts" statInfo={TRACK_RECORD_STAT_INFO.marginRMSE} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'About Margin RMSE' })).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<MarginStatCard label="Margin RMSE" value="8.3 pts" />);

    expect(screen.getByText('Margin RMSE')).toBeInTheDocument();
  });

  it('renders the value as-is', () => {
    render(<MarginStatCard label="Margin Bias" value="-1.5 pts" />);

    expect(screen.getByText('-1.5 pts')).toBeInTheDocument();
  });

  it('renders the value uncolored when classes is omitted', () => {
    render(<MarginStatCard label="Margin RMSE" value="8.3 pts" />);

    expect(screen.getByText('8.3 pts')).not.toHaveClass('inline-block');
  });
});
