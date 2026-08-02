import type { ReactNode } from 'react';

interface CollapsibleContentProps {
  children: ReactNode;
  id: string;
  isOpen: boolean;
}

export function CollapsibleContent({ children, id, isOpen }: CollapsibleContentProps) {
  return (
    <div
      id={id}
      className="grid transition-[grid-template-rows] duration-300 ease-in-out"
      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
