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
        <span className="font-medium text-gray-700">Conference:</span>
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  const baseButtonClass =
    'px-3 py-1 text-sm font-medium rounded-md transition-colors';
  const selectedClass = 'bg-blue-900 text-white';
  const unselectedClass = 'bg-gray-200 text-gray-700 hover:bg-gray-300';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-gray-700">Conference:</span>
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
  );
}
