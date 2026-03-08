import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-text-muted">
      {icon && <div className="mb-3 text-text-muted">{icon}</div>}
      <p className="text-center">{message}</p>
    </div>
  );
}
