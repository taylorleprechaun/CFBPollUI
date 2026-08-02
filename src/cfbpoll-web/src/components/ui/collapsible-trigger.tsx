import type { ReactNode } from 'react';

import { ChevronIcon } from './chevron-icon';

interface CollapsibleTriggerProps {
  children: ReactNode;
  className: string;
  contentId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function CollapsibleTrigger({ children, className, contentId, isOpen, onToggle }: CollapsibleTriggerProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={className}
      aria-expanded={isOpen}
      aria-controls={contentId}
    >
      <ChevronIcon open={isOpen} size="w-4 h-4" />
      {children}
    </button>
  );
}
