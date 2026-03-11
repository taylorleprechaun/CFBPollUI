import { useId } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../contexts/auth-context';
import { usePageVisibility } from '../hooks/use-page-visibility';
import { BUTTON_GHOST } from '../components/ui/button-styles';
import { useDocumentTitle } from '../hooks/use-document-title';
import { updatePageVisibility } from '../services/admin-api';

interface ToggleSwitchProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ checked, disabled, label, onChange }: ToggleSwitchProps) {
  const id = useId();

  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 disabled:opacity-50 ${checked ? 'bg-accent' : 'bg-border-strong'}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
      </button>
    </div>
  );
}

export function SettingsPage() {
  useDocumentTitle('Settings - CFB Poll');

  const { token, logout } = useAuth();
  const { allTimeEnabled, pollLeadersEnabled, seasonTrendsEnabled } = usePageVisibility();
  const queryClient = useQueryClient();

  const visibilityMutation = useMutation({
    mutationFn: (visibility: { allTimeEnabled: boolean; pollLeadersEnabled: boolean; seasonTrendsEnabled: boolean }) => {
      if (!token) throw new Error('Authentication required');
      return updatePageVisibility(token, visibility);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-visibility'] });
    },
  });

  const handleToggle = (field: 'allTimeEnabled' | 'pollLeadersEnabled' | 'seasonTrendsEnabled', value: boolean) => {
    const current = { allTimeEnabled, pollLeadersEnabled, seasonTrendsEnabled };
    if (current[field] === value) return;
    visibilityMutation.mutate({ ...current, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <button
          onClick={logout}
          className={BUTTON_GHOST}
        >
          Log Out
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Page Visibility</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Rankings</h3>
            <div className="space-y-3">
              <ToggleSwitch
                checked={seasonTrendsEnabled}
                disabled={visibilityMutation.isPending}
                label="Season Trends"
                onChange={(checked) => handleToggle('seasonTrendsEnabled', checked)}
              />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">All-Time</h3>
            <div className="space-y-3">
              <ToggleSwitch
                checked={allTimeEnabled}
                disabled={visibilityMutation.isPending}
                label="All-Time Rankings"
                onChange={(checked) => handleToggle('allTimeEnabled', checked)}
              />
              <ToggleSwitch
                checked={pollLeadersEnabled}
                disabled={visibilityMutation.isPending}
                label="Poll Leaders"
                onChange={(checked) => handleToggle('pollLeadersEnabled', checked)}
              />
            </div>
          </div>
        </div>
        {visibilityMutation.isSuccess && (
          <p className="mt-3 text-sm text-green-600">Page visibility updated</p>
        )}
        {visibilityMutation.isError && (
          <p className="mt-3 text-sm text-red-600">Failed to update page visibility</p>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
