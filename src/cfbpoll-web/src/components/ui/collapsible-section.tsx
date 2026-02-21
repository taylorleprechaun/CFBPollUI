import { useState, type ReactNode } from 'react';
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

  return (
    <section className="mb-10">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center space-x-2 mb-4 cursor-pointer"
        aria-expanded={open}
      >
        <ChevronIcon open={open} />
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
      </button>
      {open && children}
    </section>
  );
}
