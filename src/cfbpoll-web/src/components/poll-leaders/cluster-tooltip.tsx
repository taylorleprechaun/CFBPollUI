import { useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

import type { ChartDataPoint } from './types';

export const PROXIMITY_RADIUS = 30;
const NORMALIZATION_SCALE = 300;

export interface ClusterTooltipProps {
  active?: boolean;
  allPoints: ChartDataPoint[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  coordinate?: { x: number; y: number };
  minTop?: number;
  payload?: Array<{ payload: ChartDataPoint }>;
  topN: '5' | '10';
}

export function ClusterTooltip({ active, coordinate, payload, allPoints, containerRef, minTop = 0, topN }: ClusterTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const { maxX, maxY } = useMemo(() => ({
    maxX: Math.max(...allPoints.map((pt) => pt.x)) || 1,
    maxY: Math.max(...allPoints.map((pt) => pt.y)) || 1,
  }), [allPoints]);

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    const container = containerRef.current;
    if (!el || !container || !coordinate) return;

    const svg = container.querySelector('svg');
    if (!svg) return;

    const svgRect = svg.getBoundingClientRect();
    const tooltipHeight = el.offsetHeight;

    const left = svgRect.left + coordinate.x + 10;
    let top = svgRect.top + coordinate.y - tooltipHeight;

    if (top < minTop) {
      top = minTop;
    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [active, coordinate, containerRef, minTop]);

  if (!active || !payload?.length || !coordinate) return null;

  const hoveredPoint = payload[0].payload;

  const nearby = allPoints.filter((p) => {
    const normalizedDx = ((p.x - hoveredPoint.x) / maxX) * NORMALIZATION_SCALE;
    const normalizedDy = ((p.y - hoveredPoint.y) / maxY) * NORMALIZATION_SCALE;
    return Math.sqrt(normalizedDx * normalizedDx + normalizedDy * normalizedDy) < PROXIMITY_RADIUS;
  });

  const sorted = [...nearby].sort((a, b) => a.teamName.localeCompare(b.teamName));
  const gridCols = sorted.length === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return createPortal(
    <div
      ref={tooltipRef}
      className={`pointer-events-none fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-xs grid ${gridCols} gap-x-3 z-50`}
      style={{ left: -9999, top: -9999 }}
    >
      {sorted.map((point) => (
        <div key={point.teamName} className="flex items-center gap-1.5 py-0.5 whitespace-nowrap min-w-0">
          <img
            src={point.logoURL}
            alt={point.teamName}
            className="w-4 h-4 shrink-0"
          />
          <div>
            <span className="font-medium">{point.teamName}</span>
            <span className="text-gray-500 ml-2">
              ({point.top25Count}, {topN === '5' ? point.top5Count : point.top10Count})
            </span>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}
