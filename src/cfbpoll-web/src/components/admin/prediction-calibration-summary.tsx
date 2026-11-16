import { Link } from 'react-router-dom';

import { usePredictionCalibration } from '../../hooks/use-prediction-calibration';
import { calibrationPageUrl, calibrationSourceLabel, formatCalibrationSummary } from '../../lib/calibration-utils';
import { BUTTON_GHOST } from '../ui/button-styles';

interface PredictionCalibrationSummaryProps {
  season: number;
  token: string | null;
  week: number;
}

/**
 * One-line view of the calibration a week's predictions are generated with, linking to the Calibration
 * page to change it. Renders nothing for seasons whose algorithm takes no calibration.
 */
export function PredictionCalibrationSummary({ season, token, week }: PredictionCalibrationSummaryProps) {
  const { data: calibration, error } = usePredictionCalibration(token, season, week);

  if (error) return <p role="alert" className="text-sm text-red-600">Failed to load calibration for this week.</p>;
  if (!calibration?.isSupported) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Calibration:</span>{' '}
          {formatCalibrationSummary(calibration.parameters, calibration.values)}
          <span className="text-text-muted"> ({calibrationSourceLabel(calibration)})</span>
        </p>
        <Link className={BUTTON_GHOST} to={calibrationPageUrl(season, week)}>
          {calibration.isLocked ? 'View calibration' : 'Edit calibration'}
        </Link>
      </div>
      {calibration.draftUsesDifferentValues && (
        <p className="text-amber-600 text-sm">
          {calibration.isLocked
            ? 'The published predictions for this week were generated with different calibration values than the ones shown.'
            : 'The draft predictions for this week were generated with different calibration values. Generate again to apply the current values.'}
        </p>
      )}
    </div>
  );
}
