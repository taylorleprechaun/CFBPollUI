import { badgeColorClasses } from './badge-colors';

const BIAS_FAIR_MAX = 3;
const BIAS_GOOD_MAX = 1;
const RMSE_FAIR_MAX = 17.0;
const RMSE_GOOD_MAX = 15.5;

export function marginBiasClasses(value: number | null): string | null {
  if (value === null) return null;

  const magnitude = Math.abs(value);

  if (magnitude <= BIAS_GOOD_MAX) return badgeColorClasses('green');
  if (magnitude <= BIAS_FAIR_MAX) return badgeColorClasses('yellow');
  return badgeColorClasses('red');
}

export function marginRMSEClasses(value: number | null): string | null {
  if (value === null) return null;

  if (value <= RMSE_GOOD_MAX) return badgeColorClasses('green');
  if (value <= RMSE_FAIR_MAX) return badgeColorClasses('yellow');
  return badgeColorClasses('red');
}
