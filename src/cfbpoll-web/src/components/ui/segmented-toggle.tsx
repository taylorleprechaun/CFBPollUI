interface SegmentedToggleProps<T extends string> {
  ariaLabel: string;
  onChange: (value: T) => void;
  options: readonly { label: string; value: T }[];
  size?: 'md' | 'sm';
  value: T;
}

const SIZE_CLASSES = {
  md: 'px-3 py-1.5 text-sm',
  sm: 'px-3 py-1 text-xs',
};

/**
 * A row of joined buttons where exactly one option is selected.
 */
export function SegmentedToggle<T extends string>({ ariaLabel, onChange, options, size = 'md', value }: SegmentedToggleProps<T>) {
  return (
    <div aria-label={ariaLabel} className="inline-flex rounded-lg border border-border overflow-hidden" role="group">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            aria-pressed={isSelected}
            className={`${SIZE_CLASSES[size]} font-medium transition-colors duration-150 ${isSelected ? 'bg-accent text-white' : 'bg-surface text-text-secondary hover:bg-surface-alt'}`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
