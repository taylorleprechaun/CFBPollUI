import type { PredictionCalibrationHistoryEntry, PredictionCalibrationParameter } from '../../schemas/admin';

import { calibrationSourceLabel, formatCalibrationValue } from '../../lib/calibration-utils';
import { getWeekLabel } from '../../lib/week-utils';

interface PredictionCalibrationHistoryProps {
  entries: PredictionCalibrationHistoryEntry[];
  isLoading: boolean;
  parameters: PredictionCalibrationParameter[];
}

const HEADER_CLASSES = 'px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider';
const CELL_CLASSES = 'px-4 py-3 whitespace-nowrap text-sm';

export function PredictionCalibrationHistory({ entries, isLoading, parameters }: PredictionCalibrationHistoryProps) {
  if (isLoading) return <p className="text-sm text-text-muted">Loading history...</p>;
  if (entries.length === 0) return <p className="text-sm text-text-muted">No calibration saved for this season yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface-alt">
          <tr>
            <th className={`${HEADER_CLASSES} text-left`}>Week</th>
            {parameters.map((p) => (
              <th key={p.key} className={`${HEADER_CLASSES} text-right`}>{p.label}</th>
            ))}
            <th className={`${HEADER_CLASSES} text-left`}>Source</th>
            <th className={`${HEADER_CLASSES} text-left`}>Status</th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border">
          {entries.map((entry) => (
            <tr key={entry.week} className="even:bg-surface-alt/50">
              <td className={`${CELL_CLASSES} text-text-primary`}>{getWeekLabel(entry.week)}</td>
              {parameters.map((p) => (
                <td key={p.key} className={`${CELL_CLASSES} text-text-secondary text-right tabular-nums`}>
                  {formatCalibrationValue(entry.values[p.key])}
                </td>
              ))}
              <td className={`${CELL_CLASSES} text-text-secondary`}>{calibrationSourceLabel(entry)}</td>
              <td className={`${CELL_CLASSES} text-text-secondary`}>{entry.isLocked ? 'Locked' : 'Editable'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
