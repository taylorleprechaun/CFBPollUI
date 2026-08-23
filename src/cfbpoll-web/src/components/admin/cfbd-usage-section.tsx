import { useCfbdUsage } from '../../hooks/use-cfbd-usage';
import { BUTTON_SECONDARY } from '../ui/button-styles';

interface CfbdUsageSectionProps {
  token: string | null;
}

export function CfbdUsageSection({ token }: CfbdUsageSectionProps) {
  const { data, isLoading, isRefreshing, refresh } = useCfbdUsage(token);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-text-primary">CFBD API</h2>
        <button
          onClick={refresh}
          disabled={isRefreshing || isLoading}
          className={BUTTON_SECONDARY}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading...</p>}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Remaining Calls" value={data.remainingCalls.toLocaleString()} />
            <Stat label="Used Calls" value={data.usedCalls.toLocaleString()} />
            <Stat label="Monthly Limit" value={data.monthlyLimit.toLocaleString()} />
            <Stat label="Tier" value={data.tierName} />
          </div>
          <p className="text-sm text-text-muted">
            Resets {new Date(data.resetAt).toLocaleString()} - {data.totalRequestsInWindow.toLocaleString()} requests in the current window.
          </p>
          {data.topEndpoints.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Top Endpoints</h3>
              <ul className="space-y-1">
                {data.topEndpoints.map((endpoint) => (
                  <li key={endpoint.endpoint} className="flex justify-between text-sm text-text-secondary">
                    <span>{endpoint.endpoint}</span>
                    <span className="text-text-muted">{endpoint.requestCount.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div>
      <div className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</div>
      <div className="text-lg font-semibold text-text-primary">{value}</div>
    </div>
  );
}
