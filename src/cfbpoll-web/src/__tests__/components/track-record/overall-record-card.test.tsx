import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { OverallRecordCard } from '../../../components/track-record/overall-record-card';
import { TRACK_RECORD_STAT_INFO } from '../../../lib/track-record-stat-info';

describe('OverallRecordCard', () => {
  it('does not render a percentage when there are no decided picks', () => {
    render(<OverallRecordCard label="Over/Under" totals={{ correct: 0, incorrect: 0, push: 2 }} />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('renders no info button when statInfo is omitted', () => {
    render(<OverallRecordCard label="Winner" totals={{ correct: 10, incorrect: 5, push: 0 }} />);

    expect(screen.queryByRole('button', { name: 'About Winner' })).not.toBeInTheDocument();
  });

  it('renders the formatted record', () => {
    render(<OverallRecordCard label="Spread" totals={{ correct: 8, incorrect: 6, push: 1 }} />);

    expect(screen.getByText('8-6-1')).toBeInTheDocument();
  });

  it('renders the info button with the correct aria-label when statInfo is provided', () => {
    render(
      <MemoryRouter>
        <OverallRecordCard
          label="Winner"
          totals={{ correct: 10, incorrect: 5, push: 0 }}
          statInfo={TRACK_RECORD_STAT_INFO.winner}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'About Winner' })).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<OverallRecordCard label="Winner" totals={{ correct: 10, incorrect: 5, push: 0 }} />);

    expect(screen.getByText('Winner')).toBeInTheDocument();
  });

  it('renders the win percentage when decided picks exist', () => {
    render(<OverallRecordCard label="Winner" totals={{ correct: 3, incorrect: 1, push: 0 }} />);

    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });
});
