import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarginStatCard } from '../../../components/track-record/margin-stat-card';

describe('MarginStatCard', () => {
  it('renders the label', () => {
    render(<MarginStatCard label="Margin RMSE" value="8.3 pts" />);

    expect(screen.getByText('Margin RMSE')).toBeInTheDocument();
  });

  it('renders the value as-is', () => {
    render(<MarginStatCard label="Margin Bias" value="-1.5 pts" />);

    expect(screen.getByText('-1.5 pts')).toBeInTheDocument();
  });
});
