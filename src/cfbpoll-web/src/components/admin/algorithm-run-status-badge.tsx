import type { AlgorithmRunStatus } from '../../hooks/use-algorithm-run-state';
import type { BadgeColor } from '../../lib/badge-colors';
import type { AlgorithmVersion } from './algorithm-versions';

import { badgeColorClasses } from '../../lib/badge-colors';
import { StatusBadge } from '../ui/status-badge';

interface AlgorithmRunStatusBadgeProps {
  status: AlgorithmRunStatus;
  version: AlgorithmVersion;
}

const STATUS_COLOR: Record<AlgorithmRunStatus, BadgeColor> = {
  error: 'red',
  idle: 'gray',
  pending: 'blue',
  success: 'green',
};

const STATUS_LABEL: Record<AlgorithmRunStatus, string> = {
  error: 'Failed',
  idle: 'Idle',
  pending: 'Running…',
  success: 'Done',
};

export function AlgorithmRunStatusBadge({ status, version }: AlgorithmRunStatusBadgeProps) {
  return (
    <StatusBadge
      className={badgeColorClasses(STATUS_COLOR[status])}
      label={`${version}: ${STATUS_LABEL[status]}`}
    />
  );
}
