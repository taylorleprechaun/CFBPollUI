import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { RecordTrendSummary } from '../../../lib/track-record-utils';

import { RecordTrend } from '../../../components/track-record/record-trend';

const upTrend: RecordTrendSummary = { baselinePct: 69.4, direction: 'up', windowPct: 71.2 };

function getTrendIcon(container: HTMLElement): SVGElement {
  return container.querySelector('svg')!;
}

describe('RecordTrend', () => {
  it('describes the comparison against the all-time baseline for screen readers', () => {
    render(<RecordTrend trend={upTrend} windowWeeks={10} />);

    expect(screen.getByText('Up from 69.4% all-time')).toHaveClass('sr-only');
  });

  it('hides the trend icon from assistive technology', () => {
    const { container } = render(<RecordTrend trend={upTrend} windowWeeks={10} />);

    expect(getTrendIcon(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the window size and window percentage', () => {
    render(<RecordTrend trend={upTrend} windowWeeks={10} />);

    expect(screen.getByText('L10: 71.2%')).toBeInTheDocument();
  });

  it('shows a green trend icon when trending up', () => {
    const { container } = render(<RecordTrend trend={upTrend} windowWeeks={10} />);

    expect(getTrendIcon(container).parentElement).toHaveClass('text-green-600');
  });

  it('shows a muted trend icon when even with the baseline', () => {
    const flatTrend: RecordTrendSummary = { baselinePct: 49.0, direction: 'flat', windowPct: 49.0 };

    const { container } = render(<RecordTrend trend={flatTrend} windowWeeks={10} />);

    expect(getTrendIcon(container).parentElement).toHaveClass('text-text-muted');
    expect(screen.getByText('Even with 49.0% all-time')).toBeInTheDocument();
  });

  it('shows a red trend icon when trending down', () => {
    const downTrend: RecordTrendSummary = { baselinePct: 51.0, direction: 'down', windowPct: 46.5 };

    const { container } = render(<RecordTrend trend={downTrend} windowWeeks={10} />);

    expect(getTrendIcon(container).parentElement).toHaveClass('text-red-600');
    expect(screen.getByText('Down from 51.0% all-time')).toBeInTheDocument();
  });

  it('spells out the window in a hover title', () => {
    render(<RecordTrend trend={upTrend} windowWeeks={10} />);

    expect(screen.getByText('L10: 71.2%').closest('[title]')).toHaveAttribute('title', 'Last 10 published weeks');
  });
});
