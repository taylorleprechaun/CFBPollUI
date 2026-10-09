const TREND_ICON_PROPS = {
  'aria-hidden': true,
  className: 'w-4 h-4',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
  viewBox: '0 0 24 24',
  xmlns: 'http://www.w3.org/2000/svg',
} as const;

export function TrendDownIcon() {
  return (
    <svg {...TREND_ICON_PROPS}>
      <polyline points="3 5 9 12 13 9 20 19" />
      <polyline points="14.2 17.4 20 19 20.5 13" />
    </svg>
  );
}

export function TrendFlatIcon() {
  return (
    <svg {...TREND_ICON_PROPS}>
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

export function TrendUpIcon() {
  return (
    <svg {...TREND_ICON_PROPS}>
      <polyline points="3 19 9 12 13 15 20 5" />
      <polyline points="14.2 6.6 20 5 20.5 11" />
    </svg>
  );
}
