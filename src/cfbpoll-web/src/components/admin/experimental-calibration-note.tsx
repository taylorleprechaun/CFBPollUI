import { Link } from 'react-router-dom';

import { useAuth } from '../../hooks/use-auth';
import { usePredictionCalibration } from '../../hooks/use-prediction-calibration';
import { formatCalibrationSummary } from '../../lib/calibration-utils';
import { getWeekLabel } from '../../lib/week-utils';

interface ExperimentalCalibrationNoteProps {
  appliedCalibration: Record<string, number>;
  season: number;
  week: number;
}

/**
 * One short line, shown under an algorithm version's heading, with the calibration values its run was
 * generated with and a link to that week on the Calibration page. Labels come from the week's calibration
 * definitions; raw keys show until they load.
 */
export function ExperimentalCalibrationNote({ appliedCalibration, season, week }: ExperimentalCalibrationNoteProps) {
  const { token } = useAuth();
  const { data: calibration } = usePredictionCalibration(token, season, week);

  const values = calibration
    ? formatCalibrationSummary(calibration.parameters, appliedCalibration)
    : Object.entries(appliedCalibration).map(([name, value]) => `${name} ${value}`).join(' · ');
  const action = calibration?.isLocked ? 'View' : 'Edit';

  return (
    <p className="text-xs font-normal text-text-muted">
      Calibration: {values} ·{' '}
      <Link
        aria-label={`${action} calibration for ${season} ${getWeekLabel(week)}`}
        className="text-accent hover:underline"
        to={`/admin/calibration?season=${season}&week=${week}`}
      >
        {action}
      </Link>
    </p>
  );
}
