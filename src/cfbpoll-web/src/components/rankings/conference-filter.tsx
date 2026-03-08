import type { Conference } from '../../types';

interface ConferenceFilterProps {
  conferences: Conference[];
  selectedConference: string | null;
  onConferenceChange: (conference: string | null) => void;
  isLoading: boolean;
}

export function ConferenceFilter({
  conferences,
  selectedConference,
  onConferenceChange,
  isLoading,
}: ConferenceFilterProps) {
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <span className="font-medium text-text-secondary">Conference:</span>
        <span className="text-text-muted">Loading...</span>
      </div>
    );
  }

  const baseButtonClass =
    'px-3 py-1 text-sm font-medium rounded-full transition-colors duration-150';
  const selectedClass = 'bg-accent text-white shadow-sm';
  const unselectedClass = 'bg-surface-alt text-text-secondary hover:bg-surface-elevated border border-border';

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium text-text-secondary shrink-0">Conference:</span>
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => onConferenceChange(null)}
          className={`${baseButtonClass} ${
            selectedConference === null ? selectedClass : unselectedClass
          }`}
        >
          All
        </button>
        {conferences.map((conference) => (
          <button
            key={conference.id}
            onClick={() => onConferenceChange(conference.name)}
            className={`${baseButtonClass} ${
              selectedConference === conference.name ? selectedClass : unselectedClass
            }`}
            title={conference.name}
          >
            {conference.label}
          </button>
        ))}
      </div>
    </div>
  );
}
