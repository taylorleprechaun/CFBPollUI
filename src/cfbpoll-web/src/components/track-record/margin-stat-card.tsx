interface MarginStatCardProps {
  label: string;
  value: string;
}

export function MarginStatCard({ label, value }: MarginStatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 text-center">
      <div className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-bold text-text-primary">{value}</div>
    </div>
  );
}
