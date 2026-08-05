interface SpreadFormattable {
  bettingSpread: number | null;
  homeTeam: string;
}

export function formatSpread(prediction: SpreadFormattable): string {
  if (prediction.bettingSpread === null || prediction.bettingSpread === undefined) return 'N/A';
  const spread = prediction.bettingSpread;
  const sign = spread > 0 ? '+' : '';
  return `${prediction.homeTeam} ${sign}${spread}`;
}

export function formatOverUnder(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toString();
}

export function formatPick(pick: string): string {
  return pick || 'N/A';
}
