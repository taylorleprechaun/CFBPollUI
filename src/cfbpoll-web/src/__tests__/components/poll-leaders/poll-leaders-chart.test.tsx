import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockUsePlotArea, mockUseXAxisDomain, mockUseYAxisDomain, rechartsMock } from '../../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

import { HitTarget, PollLeadersChart } from '../../../components/poll-leaders/poll-leaders-chart';
import type { PollLeaderEntry } from '../../../schemas';

const mockData: PollLeaderEntry[] = [
  { logoURL: 'https://example.com/ohio-state.png', teamName: 'Ohio State', top5Count: 5, top10Count: 8, top25Count: 15 },
  { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18 },
];

afterEach(() => {
  mockUsePlotArea.mockRestore();
  mockUsePlotArea.mockImplementation(() => ({ height: 400, width: 600, x: 50, y: 20 }));
  mockUseXAxisDomain.mockRestore();
  mockUseXAxisDomain.mockImplementation(() => [0, 20]);
  mockUseYAxisDomain.mockRestore();
  mockUseYAxisDomain.mockImplementation(() => [0, 12]);
});

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

  it('renders logos with correct aria-label for each data point', () => {
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

  it('renders no logos when data is empty', () => {
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

  it('renders no logos when plot area is unavailable', () => {
    mockUsePlotArea.mockReturnValue(undefined);

    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    expect(screen.queryByLabelText('Alabama')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Ohio State')).not.toBeInTheDocument();
  });

  it('renders no logos when x-axis domain is unavailable', () => {
    mockUseXAxisDomain.mockReturnValue(undefined);

    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    expect(screen.queryByLabelText('Alabama')).not.toBeInTheDocument();
  });

  it('renders no logos when y-axis domain is unavailable', () => {
    mockUseYAxisDomain.mockReturnValue(undefined);

    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    expect(screen.queryByLabelText('Alabama')).not.toBeInTheDocument();
  });

  it('renders newly added teams after data changes', () => {
    const initialData: PollLeaderEntry[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18 },
    ];
    const updatedData: PollLeaderEntry[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18 },
      { logoURL: 'https://example.com/ohio-state.png', teamName: 'Ohio State', top5Count: 5, top10Count: 8, top25Count: 15 },
    ];

    const onModeChange = vi.fn();
    const onTopNChange = vi.fn();

    const { rerender } = render(
      <PollLeadersChart data={initialData} mode="all" onModeChange={onModeChange} onTopNChange={onTopNChange} topN="10" />
    );

    rerender(
      <PollLeadersChart data={updatedData} mode="all" onModeChange={onModeChange} onTopNChange={onTopNChange} topN="10" />
    );

    expect(screen.getByLabelText('Alabama')).toBeInTheDocument();
    expect(screen.getByLabelText('Ohio State')).toBeInTheDocument();
  });

  it('cleans up animation frame on unmount after data change', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const initialData: PollLeaderEntry[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18 },
    ];
    const updatedData: PollLeaderEntry[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18 },
      { logoURL: 'https://example.com/ohio-state.png', teamName: 'Ohio State', top5Count: 5, top10Count: 8, top25Count: 15 },
    ];

    const onModeChange = vi.fn();
    const onTopNChange = vi.fn();

    const { rerender, unmount } = render(
      <PollLeadersChart data={initialData} mode="all" onModeChange={onModeChange} onTopNChange={onTopNChange} topN="10" />
    );

    rerender(
      <PollLeadersChart data={updatedData} mode="all" onModeChange={onModeChange} onTopNChange={onTopNChange} topN="10" />
    );

    unmount();

    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });

  it('handles data change with same teams without triggering animation', () => {
    const initialData: PollLeaderEntry[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18 },
    ];
    const updatedData: PollLeaderEntry[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 10, top10Count: 15, top25Count: 25 },
    ];

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const onModeChange = vi.fn();
    const onTopNChange = vi.fn();

    const { rerender } = render(
      <PollLeadersChart data={initialData} mode="all" onModeChange={onModeChange} onTopNChange={onTopNChange} topN="10" />
    );

    rafSpy.mockClear();

    rerender(
      <PollLeadersChart data={updatedData} mode="all" onModeChange={onModeChange} onTopNChange={onTopNChange} topN="10" />
    );

    expect(rafSpy).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Alabama')).toBeInTheDocument();
    rafSpy.mockRestore();
  });

  it('clears fade-in state after animation frame fires', async () => {
    const initialData: PollLeaderEntry[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18 },
    ];
    const updatedData: PollLeaderEntry[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18 },
      { logoURL: 'https://example.com/ohio-state.png', teamName: 'Ohio State', top5Count: 5, top10Count: 8, top25Count: 15 },
    ];

    const rafCallbacks: FrameRequestCallback[] = [];
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });

    const onModeChange = vi.fn();
    const onTopNChange = vi.fn();

    const { rerender } = render(
      <PollLeadersChart data={initialData} mode="all" onModeChange={onModeChange} onTopNChange={onTopNChange} topN="10" />
    );

    rerender(
      <PollLeadersChart data={updatedData} mode="all" onModeChange={onModeChange} onTopNChange={onTopNChange} topN="10" />
    );

    expect(rafCallbacks).toHaveLength(1);

    act(() => {
      rafCallbacks[0](performance.now());
    });

    const ohioState = screen.getByLabelText('Ohio State');
    expect(ohioState).toHaveStyle({ opacity: 1 });

    rafSpy.mockRestore();
  });

  it('HitTarget renders nothing when cx is undefined', () => {
    const { container } = render(
      <svg>
        <HitTarget cx={undefined} cy={100} />
      </svg>
    );

    expect(container.querySelector('rect')).not.toBeInTheDocument();
  });

  it('HitTarget renders nothing when cy is undefined', () => {
    const { container } = render(
      <svg>
        <HitTarget cx={100} cy={undefined} />
      </svg>
    );

    expect(container.querySelector('rect')).not.toBeInTheDocument();
  });

  it('HitTarget renders a rect when both cx and cy are provided', () => {
    const { container } = render(
      <svg>
        <HitTarget cx={100} cy={200} />
      </svg>
    );

    const rect = container.querySelector('rect');
    expect(rect).toBeInTheDocument();
    expect(rect).toHaveAttribute('fill', 'transparent');
  });

  it('applies opacity-60 class when isFetching is true', () => {
    render(
      <PollLeadersChart
        data={mockData}
        isFetching={true}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    const chartContainer = screen.getByTestId('scatter-chart').closest('.bg-white');
    expect(chartContainer).toHaveClass('opacity-60');
  });

  it('does not apply opacity-60 class when isFetching is not set', () => {
    render(
      <PollLeadersChart
        data={mockData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    const chartContainer = screen.getByTestId('scatter-chart').closest('.bg-white');
    expect(chartContainer).not.toHaveClass('opacity-60');
  });

  it('centers logos when all points share the same coordinates', () => {
    mockUseXAxisDomain.mockReturnValue([5, 5]);
    mockUseYAxisDomain.mockReturnValue([3, 3]);

    const samePointData: PollLeaderEntry[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 3, top10Count: 3, top25Count: 5 },
    ];

    render(
      <PollLeadersChart
        data={samePointData}
        mode="all"
        onModeChange={vi.fn()}
        onTopNChange={vi.fn()}
        topN="10"
      />
    );

    const logo = screen.getByLabelText('Alabama');
    expect(logo).toBeInTheDocument();
    const style = logo.getAttribute('style') ?? '';
    expect(style).toContain('translate(');
  });
});
