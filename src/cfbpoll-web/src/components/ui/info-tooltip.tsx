import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { TRACK_RECORD_EXPLAINED_PATH } from '../../lib/track-record-stat-info';
import { InfoIcon } from './icons';

interface InfoTooltipProps {
  anchor?: string;
  statName: string;
  summary: string;
}

export function InfoTooltip({ anchor, statName, summary }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const summaryId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  function handleBlur(event: React.FocusEvent) {
    if (!containerRef.current?.contains(event.relatedTarget as Node)) {
      setIsOpen(false);
    }
  }

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={handleBlur}
    >
      <button
        type="button"
        aria-label={`About ${statName}`}
        aria-describedby={summaryId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="text-text-muted hover:text-accent focus:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full"
      >
        <InfoIcon />
      </button>
      {isOpen && (
        // Outer wrapper sits flush against the button (top-full, no margin) and uses padding
        // instead of margin to create the visual gap, so the pointer stays over a hoverable
        // element the whole way from the button down into the panel - a margin gap here would
        // be dead space that triggers onMouseLeave before the pointer reaches the panel.
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 pt-2 w-64">
          <div
            role="group"
            aria-label={`About ${statName}`}
            className="bg-surface border border-border rounded-lg shadow-lg p-3 text-sm text-text-primary normal-case tracking-normal font-normal text-left"
          >
            <p id={summaryId}>{summary}</p>
            {anchor && (
              <Link
                to={`${TRACK_RECORD_EXPLAINED_PATH}#${anchor}`}
                onClick={() => setIsOpen(false)}
                className="mt-2 inline-block text-accent hover:underline text-xs font-medium"
              >
                Full explanation of {statName}
              </Link>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
