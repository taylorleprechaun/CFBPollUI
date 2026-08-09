interface MarginStatsToggleProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function MarginStatsToggle({ isVisible, onToggle }: MarginStatsToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span id="margin-stats-toggle-label" className="text-sm font-medium text-text-secondary">
        Advanced stats
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isVisible}
        aria-labelledby="margin-stats-toggle-label"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          isVisible ? 'bg-accent' : 'bg-border'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isVisible ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
