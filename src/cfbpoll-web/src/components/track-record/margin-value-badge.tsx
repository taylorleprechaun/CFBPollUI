interface MarginValueBadgeProps {
  classes: string | null;
  value: string;
}

export function MarginValueBadge({ classes, value }: MarginValueBadgeProps) {
  if (!classes) return value;

  return (
    <span className={`inline-block px-2 py-1 rounded-lg font-semibold ${classes}`}>
      {value}
    </span>
  );
}
