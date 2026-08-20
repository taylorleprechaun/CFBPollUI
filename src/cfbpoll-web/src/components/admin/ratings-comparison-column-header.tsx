import { useState } from 'react';

import type { AlgorithmVersion } from './algorithm-versions';

import { useExportExperimental } from '../../hooks/use-experimental-mutations';
import { toError } from '../../lib/error-utils';
import { ErrorAlert } from '../error';
import { BUTTON_SUCCESS } from '../ui/button-styles';

interface RatingsComparisonColumnHeaderProps {
  algorithmVersion: AlgorithmVersion;
  season: number;
  token: string | null;
  week: number;
}

export function RatingsComparisonColumnHeader({
  algorithmVersion,
  season,
  token,
  week,
}: RatingsComparisonColumnHeaderProps) {
  const [error, setError] = useState<Error | null>(null);

  const exportMutation = useExportExperimental(token);

  const handleExport = async () => {
    setError(null);
    try {
      await exportMutation.mutateAsync({ algorithmVersion, season, week });
    } catch (err) {
      setError(toError(err, 'Export failed'));
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <span className="font-semibold text-sm text-text-primary">{algorithmVersion}</span>
      <button
        onClick={handleExport}
        disabled={exportMutation.isPending}
        className={BUTTON_SUCCESS}
      >
        {exportMutation.isPending ? 'Exporting...' : 'Download Excel'}
      </button>
      {error && <ErrorAlert error={error} />}
    </div>
  );
}
