import { useId } from 'react';

import type { AlgorithmVersion } from './algorithm-versions';

import { ALGORITHM_VERSIONS } from './algorithm-versions';

interface AlgorithmVersionPickerProps {
  onChange: (versions: AlgorithmVersion[]) => void;
  selectedVersions: AlgorithmVersion[];
}

const BASE_BUTTON_CLASS = 'px-3 py-1 text-sm font-medium rounded-full transition-colors duration-150';
const SELECTED_CLASS = 'bg-accent text-white shadow-sm';
const UNSELECTED_CLASS = 'bg-surface-alt text-text-secondary hover:bg-surface-elevated border border-border';

export function AlgorithmVersionPicker({ onChange, selectedVersions }: AlgorithmVersionPickerProps) {
  const labelId = useId();

  function handleToggle(version: AlgorithmVersion) {
    if (selectedVersions.includes(version)) {
      onChange(selectedVersions.filter((v) => v !== version));
      return;
    }
    onChange(ALGORITHM_VERSIONS.filter((v) => selectedVersions.includes(v) || v === version));
  }

  return (
    <div>
      <span id={labelId} className="block text-sm font-medium text-text-secondary mb-1">
        Algorithm Version
      </span>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap items-center gap-2">
        {ALGORITHM_VERSIONS.map((version) => {
          const isSelected = selectedVersions.includes(version);
          return (
            <button
              key={version}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleToggle(version)}
              className={`${BASE_BUTTON_CLASS} ${isSelected ? SELECTED_CLASS : UNSELECTED_CLASS}`}
            >
              {version}
            </button>
          );
        })}
      </div>
    </div>
  );
}
