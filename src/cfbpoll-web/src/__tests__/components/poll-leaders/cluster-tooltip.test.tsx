import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { ClusterTooltip } from '../../../components/poll-leaders/cluster-tooltip';
import type { ChartDataPoint } from '../../../components/poll-leaders/types';

const mockPoints: ChartDataPoint[] = [
  { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18, x: 18, y: 10 },
  { logoURL: 'https://example.com/ohio-state.png', teamName: 'Ohio State', top5Count: 5, top10Count: 8, top25Count: 15, x: 15, y: 8 },
  { logoURL: 'https://example.com/texas.png', teamName: 'Texas', top5Count: 3, top10Count: 6, top25Count: 12, x: 12, y: 6 },
];

function createContainerRef() {
  const ref = createRef<HTMLDivElement>();
  const container = document.createElement('div');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  container.appendChild(svg);
  document.body.appendChild(container);
  Object.defineProperty(ref, 'current', { value: container, writable: true });
  return ref;
}

describe('ClusterTooltip', () => {
  it('returns null when not active', () => {
    const containerRef = createContainerRef();
    const { container } = render(
      <ClusterTooltip
        active={false}
        allPoints={mockPoints}
        containerRef={containerRef}
        coordinate={{ x: 100, y: 100 }}
        payload={[{ payload: mockPoints[0] }]}
        topN="10"
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('returns null when payload is undefined', () => {
    const containerRef = createContainerRef();
    const { container } = render(
      <ClusterTooltip
        active={true}
        allPoints={mockPoints}
        containerRef={containerRef}
        coordinate={{ x: 100, y: 100 }}
        payload={undefined}
        topN="10"
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('returns null when payload is empty', () => {
    const containerRef = createContainerRef();
    const { container } = render(
      <ClusterTooltip
        active={true}
        allPoints={mockPoints}
        containerRef={containerRef}
        coordinate={{ x: 100, y: 100 }}
        payload={[]}
        topN="10"
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('returns null when coordinate is undefined', () => {
    const containerRef = createContainerRef();
    const { container } = render(
      <ClusterTooltip
        active={true}
        allPoints={mockPoints}
        containerRef={containerRef}
        coordinate={undefined}
        payload={[{ payload: mockPoints[0] }]}
        topN="10"
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders team names sorted alphabetically', () => {
    const closePoints: ChartDataPoint[] = [
      { logoURL: 'https://example.com/texas.png', teamName: 'Texas', top5Count: 3, top10Count: 6, top25Count: 100, x: 100, y: 100 },
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 100, x: 100, y: 101 },
      { logoURL: 'https://example.com/michigan.png', teamName: 'Michigan', top5Count: 4, top10Count: 7, top25Count: 100, x: 100, y: 100 },
    ];
    const containerRef = createContainerRef();

    render(
      <ClusterTooltip
        active={true}
        allPoints={closePoints}
        containerRef={containerRef}
        coordinate={{ x: 100, y: 100 }}
        payload={[{ payload: closePoints[0] }]}
        topN="10"
      />
    );

    const teamNames = screen.getAllByRole('img').map((img) => img.getAttribute('alt'));
    expect(teamNames).toEqual(['Alabama', 'Michigan', 'Texas']);
  });

  it('shows top10Count values when topN is 10', () => {
    const singlePoint: ChartDataPoint[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18, x: 18, y: 10 },
    ];
    const containerRef = createContainerRef();

    render(
      <ClusterTooltip
        active={true}
        allPoints={singlePoint}
        containerRef={containerRef}
        coordinate={{ x: 100, y: 100 }}
        payload={[{ payload: singlePoint[0] }]}
        topN="10"
      />
    );

    expect(screen.getByText('Alabama')).toBeInTheDocument();
    expect(screen.getByText('(18, 10)')).toBeInTheDocument();
  });

  it('shows top5Count values when topN is 5', () => {
    const singlePoint: ChartDataPoint[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18, x: 18, y: 7 },
    ];
    const containerRef = createContainerRef();

    render(
      <ClusterTooltip
        active={true}
        allPoints={singlePoint}
        containerRef={containerRef}
        coordinate={{ x: 100, y: 100 }}
        payload={[{ payload: singlePoint[0] }]}
        topN="5"
      />
    );

    expect(screen.getByText('Alabama')).toBeInTheDocument();
    expect(screen.getByText('(18, 7)')).toBeInTheDocument();
  });

  it('renders team logos with alt text', () => {
    const singlePoint: ChartDataPoint[] = [
      { logoURL: 'https://example.com/ohio-state.png', teamName: 'Ohio State', top5Count: 5, top10Count: 8, top25Count: 15, x: 15, y: 8 },
    ];
    const containerRef = createContainerRef();

    render(
      <ClusterTooltip
        active={true}
        allPoints={singlePoint}
        containerRef={containerRef}
        coordinate={{ x: 100, y: 100 }}
        payload={[{ payload: singlePoint[0] }]}
        topN="10"
      />
    );

    const logo = screen.getByRole('img', { name: 'Ohio State' });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/ohio-state.png');
  });

  it('filters out distant points based on proximity', () => {
    const spreadPoints: ChartDataPoint[] = [
      { logoURL: 'https://example.com/alabama.png', teamName: 'Alabama', top5Count: 7, top10Count: 10, top25Count: 18, x: 0, y: 0 },
      { logoURL: 'https://example.com/texas.png', teamName: 'Texas', top5Count: 3, top10Count: 6, top25Count: 100, x: 100, y: 100 },
    ];
    const containerRef = createContainerRef();

    render(
      <ClusterTooltip
        active={true}
        allPoints={spreadPoints}
        containerRef={containerRef}
        coordinate={{ x: 100, y: 100 }}
        payload={[{ payload: spreadPoints[0] }]}
        topN="10"
      />
    );

    expect(screen.getByText('Alabama')).toBeInTheDocument();
    expect(screen.queryByText('Texas')).not.toBeInTheDocument();
  });
});
