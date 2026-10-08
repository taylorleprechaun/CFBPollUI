import { useEffect, useId, useRef, useState } from 'react';

import { BUTTON_DANGER, BUTTON_SECONDARY, SELECT_BASE } from './button-styles';

interface ConfirmModalProps {
  confirmLabel?: string;
  confirmPhrase?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

const FOCUSABLE_SELECTOR = 'input:not([disabled]), button:not([disabled])';

export function ConfirmModal({ confirmLabel = 'Delete', confirmPhrase, message, onCancel, onConfirm, title }: ConfirmModalProps) {
  const [typedPhrase, setTypedPhrase] = useState('');
  const cancelRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const phraseInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);
  const phraseInputId = useId();

  const canConfirm = confirmPhrase === undefined || typedPhrase.trim() === confirmPhrase;

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;
    (phraseInputRef.current ?? cancelRef.current)?.focus();

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
        const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
        if (focusable.length === 0) return;

        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
        const step = e.shiftKey ? -1 : 1;
        const nextIndex = (currentIndex + step + focusable.length) % focusable.length;
        focusable[nextIndex].focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canConfirm) {
      onConfirm();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        className="bg-surface rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h2>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <form onSubmit={handleSubmit}>
          {confirmPhrase !== undefined && (
            <div className="mb-6">
              <label htmlFor={phraseInputId} className="block text-sm font-medium text-text-secondary mb-1">
                Type <span className="font-semibold text-text-primary">{confirmPhrase}</span> to confirm
              </label>
              <input
                ref={phraseInputRef}
                id={phraseInputId}
                type="text"
                autoComplete="off"
                value={typedPhrase}
                onChange={(e) => setTypedPhrase(e.target.value)}
                className={`w-full px-3 py-2 ${SELECT_BASE}`}
              />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className={BUTTON_SECONDARY}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canConfirm}
              className={BUTTON_DANGER}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
