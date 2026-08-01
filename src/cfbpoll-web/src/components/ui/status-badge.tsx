interface StatusBadgeProps {
  className: string;
  label: string;
}

export function StatusBadge({ className, label }: StatusBadgeProps) {
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${className}`}>
      {label}
    </span>
  );
}
