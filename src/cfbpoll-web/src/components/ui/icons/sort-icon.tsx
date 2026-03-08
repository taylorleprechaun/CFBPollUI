interface SortIconProps {
  className?: string;
}

export function SortAscIcon({ className = 'w-3 h-3' }: SortIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 2L10 8H2L6 2Z" />
    </svg>
  );
}

export function SortDescIcon({ className = 'w-3 h-3' }: SortIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 10L2 4H10L6 10Z" />
    </svg>
  );
}

export function SortNeutralIcon({ className = 'w-3 h-3' }: SortIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      fill="currentColor"
      className={`${className} opacity-30`}
      aria-hidden="true"
    >
      <path d="M6 1L9 5H3L6 1Z" />
      <path d="M6 11L3 7H9L6 11Z" />
    </svg>
  );
}
