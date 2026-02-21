interface ChevronIconProps {
  open: boolean;
  size?: string;
}

export function ChevronIcon({ open, size = 'w-5 h-5' }: ChevronIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className={`${size} text-gray-500 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
