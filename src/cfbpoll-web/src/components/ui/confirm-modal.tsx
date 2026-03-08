import { useEffect, useRef } from 'react';
import { BUTTON_DANGER, BUTTON_SECONDARY } from './button-styles';

interface ConfirmModalProps {
  confirmLabel?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmModal({ confirmLabel = 'Delete', message, onCancel, onConfirm, title }: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;
    cancelRef.current?.focus();

    return () => {
      const el = previouslyFocusedRef.current;
      if (el instanceof HTMLElement) {
        el.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          if (document.activeElement === cancelRef.current) {
            confirmRef.current?.focus();
          } else {
            cancelRef.current?.focus();
          }
        } else {
          if (document.activeElement === confirmRef.current) {
            cancelRef.current?.focus();
          } else {
            confirmRef.current?.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h2>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className={BUTTON_SECONDARY}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={BUTTON_DANGER}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
