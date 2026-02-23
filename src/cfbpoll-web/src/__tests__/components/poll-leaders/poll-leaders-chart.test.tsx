import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cloneElement, type ReactElement, type ReactNode } from 'react';

vi.mock('recharts', () => ({
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Scatter: ({ data, shape }: { data?: Array<Record<string, unknown>>; shape?: ReactElement }) => {
    if (!data || !shape) return null;
    return (
      <svg data-testid="scatter-points">
        {data.map((point, i) =>
          cloneElement(shape, { key: i, cx: 100 + i * 30, cy: 200, payload: point })
        )}
      </svg>
    );
  },
  ScatterChart: ({ children }: { children: ReactNode }) => <div data-testid="scatter-chart">{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

import { PollLeadersChart } from '../../../components/poll-leaders/poll-leaders-chart';
import type { PollLeaderEntry } from '../../../schemas';

const mockData: PollLeaderEntry[] = [
  { logoURL: 'https://example.com/ohio-state.png', teamName: 'Ohio State', top5Count: 5, top10Count: 8, top25Count: 15 },
  { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18 },
];

describe('PollLeadersChart', () => {
  it('renders mode toggle buttons', () => {
    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    expect(screen.getByText('All Weeks')).toBeInTheDocument();
    expect(screen.getByText('Final Only')).toBeInTheDocument();
  });

  it('renders top-N toggle buttons', () => {
    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    expect(screen.getByText('Top 5')).toBeInTheDocument();
    expect(screen.getByText('Top 10')).toBeInTheDocument();
  });

  it('calls onModeChange when mode toggle is clicked', async () => {
    const handleModeChange = vi.fn();
    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={handleModeChange}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    await userEvent.click(screen.getByText('Final Only'));

    expect(handleModeChange).toHaveBeenCalledWith('final');
  });

  it('calls onTopNChange when top-N toggle is clicked', async () => {
    const handleTopNChange = vi.fn();
    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={handleTopNChange}
        topN="10"
      />
    );

    await userEvent.click(screen.getByText('Top 5'));

    expect(handleTopNChange).toHaveBeenCalledWith('5');
  });

  it('aria-pressed reflects current mode state', () => {
    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    expect(screen.getByText('All Weeks')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Final Only')).toHaveAttribute('aria-pressed', 'false');
  });

  it('aria-pressed reflects final mode state', () => {
    render(
      <PollLeadersChart
        data={mockData}
        mode="final"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    expect(screen.getByText('All Weeks')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Final Only')).toHaveAttribute('aria-pressed', 'true');
  });

  it('aria-pressed reflects current topN state', () => {
    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="5"
      />
    );

    expect(screen.getByText('Top 5')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Top 10')).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the scatter chart', () => {
    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
  });

  it('renders with empty data without errors', () => {
    render(
      <PollLeadersChart
        data={[]}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
  });

  it('calls onModeChange with all when All Weeks is clicked', async () => {
    const handleModeChange = vi.fn();
    render(
      <PollLeadersChart
        data={mockData}
        mode="final"
        onModeChange={handleModeChange}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    await userEvent.click(screen.getByText('All Weeks'));

    expect(handleModeChange).toHaveBeenCalledWith('all');
  });

  it('calls onTopNChange with 10 when Top 10 is clicked', async () => {
    const handleTopNChange = vi.fn();
    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={handleTopNChange}
        topN="5"
      />
    );

    await userEvent.click(screen.getByText('Top 10'));

    expect(handleTopNChange).toHaveBeenCalledWith('10');
  });

  it('renders CustomShape with correct aria-label for each data point', () => {
    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    const ohioState = screen.getByLabelText('Ohio State');
    expect(ohioState).toBeInTheDocument();
    expect(ohioState.tagName.toLowerCase()).toBe('image');

    const alabama = screen.getByLabelText('Alabama');
    expect(alabama).toBeInTheDocument();
    expect(alabama.tagName.toLowerCase()).toBe('image');
  });

  it('CustomShape renders nothing when cx is undefined', () => {
    render(
      <PollLeadersChart
        data={[]}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    expect(screen.queryByLabelText('Ohio State')).not.toBeInTheDocument();
  });
});
