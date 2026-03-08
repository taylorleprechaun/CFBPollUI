import { useId, useState, type ReactNode } from 'react';
import { ChevronIcon } from './chevron-icon';

interface CollapsibleSectionProps {
  children: ReactNode;
  defaultOpen?: boolean;
  title: string;
}

export function CollapsibleSection({
  children,
  defaultOpen = true,
  title,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className="mb-10">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center space-x-2 mb-4 cursor-pointer"
        aria-expanded={open}
        aria-controls={contentId}
      >
        <ChevronIcon open={open} />
        <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
      </button>
      <div
        id={contentId}
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
